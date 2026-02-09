import { prisma } from "../lib/db";

interface SearchParams {
  search: string;
  currentPage: number;
  limit: number;
  filters: Record<string, any>;
  sort: { field: string; order: "asc" | "desc" };
}

interface SearchResult {
  data: any[];
  pagination: {
    currentPage: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default class OrderService {
  // Generate order number
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `ORD-${timestamp}-${random}`;
  }

  // MAIN SEARCH METHOD with pagination
  searchOrdersService = async (
    params: SearchParams,
  ): Promise<SearchResult> => {
    const { search, currentPage, limit, filters } = params;
    const skip = (currentPage - 1) * limit;

    // ✅ CORRECT: Order model has `orderDate` (from your Prisma schema)
    const sort = params.sort || { field: "orderDate", order: "desc" };

    // Build WHERE clause
    const where: any = {
      AND: [],
    };

    // Search across order fields (from your Prisma schema)
    if (search) {
      where.AND.push({
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { customerName: { contains: search, mode: "insensitive" } },
          { customerEmail: { contains: search, mode: "insensitive" } },
          { customerPhone: { contains: search, mode: "insensitive" } },
          { shippingAddress: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Apply filters (using fields from your Prisma schema)
    if (filters.status) {
      where.AND.push({ status: filters.status });
    }
    if (filters.priority) {
      where.AND.push({ priority: filters.priority });
    }
    if (filters.fulfillmentWarehouseId) {
      where.AND.push({ fulfillmentWarehouseId: filters.fulfillmentWarehouseId });
    }
    if (filters.createdById) {
      where.AND.push({ createdById: filters.createdById });
    }
    if (filters.customerName) {
      where.AND.push({
        customerName: { contains: filters.customerName, mode: "insensitive" },
      });
    }
    
    // Date range filters (orderDate field from your Prisma schema)
    if (filters.startDate) {
      where.AND.push({
        orderDate: { gte: new Date(filters.startDate) },
      });
    }
    if (filters.endDate) {
      where.AND.push({
        orderDate: { lte: new Date(filters.endDate) },
      });
    }

    // Remove empty AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }

    // ✅ CORRECT: Build ORDER BY using Order model fields from your schema
    const orderBy: any = {};
    if (sort && sort.field) {
      if (sort.field.includes(".")) {
        // Nested field like "fulfillmentWarehouse.name"
        const [relation, field] = sort.field.split(".");
        orderBy[relation] = { [field]: sort.order };
      } else if (sort.field === "totalAmount") {
        orderBy.totalAmount = sort.order;
      } else if (sort.field === "customerName") {
        orderBy.customerName = sort.order;
      } else if (sort.field === "orderDate") {
        orderBy.orderDate = sort.order; // ✅ Correct: Order model has orderDate
      } else if (sort.field === "orderNumber") {
        orderBy.orderNumber = sort.order;
      } else if (sort.field === "status") {
        orderBy.status = sort.order;
      } else if (sort.field === "priority") {
        orderBy.priority = sort.order;
      } else if (sort.field === "subtotal") {
        orderBy.subtotal = sort.order;
      } else if (sort.field === "createdAt") {
        orderBy.createdAt = sort.order;
      } else {
        // Default to orderDate (exists in Order model)
        orderBy.orderDate = "desc";
      }
    } else {
      // Default ordering - Order model has orderDate
      orderBy.orderDate = "desc";
    }

    // Get data and count
    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          fulfillmentWarehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          fulfilledBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy, // ✅ This now uses correct Order model fields
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Calculate additional metrics for each order
    const ordersWithMetrics = await Promise.all(
      data.map(async (order) => {
        // Calculate fulfillment progress
        const fulfillmentProgress = await this.calculateFulfillmentProgress(order.id);
        
        // Calculate carbon impact per item
        const itemsWithCarbon = await Promise.all(
          order.items.map(async (item) => {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
              select: { carbonFootprintKg: true },
            });
            
            return {
              ...item,
              carbonImpact: (product?.carbonFootprintKg || 0) * item.quantity,
            };
          })
        );

        const totalCarbon = itemsWithCarbon.reduce(
          (sum, item) => sum + item.carbonImpact,
          0,
        );

        return {
          ...order,
          items: itemsWithCarbon,
          fulfillmentProgress,
          totalCarbon,
        };
      }),
    );

    return {
      data: ordersWithMetrics,
      pagination: {
        currentPage,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: currentPage * limit < total,
        hasPrev: currentPage > 1,
      },
    };
  };

  // Search orders by status
  searchOrdersByStatusService = async (
    status: string,
    params: SearchParams,
  ): Promise<SearchResult> => {
    return this.searchOrdersService({
      ...params,
      filters: { ...params.filters, status },
    });
  };

  // Search orders to fulfill (NEW, PROCESSING, PICKING)
  searchOrdersToFulfillService = async (
    params: SearchParams,
  ): Promise<SearchResult> => {
    return this.searchOrdersService({
      ...params,
      filters: {
        ...params.filters,
        status: { in: ["NEW", "PROCESSING", "PICKING"] },
      },
      sort: params.sort || { field: "orderDate", order: "asc" }, // Oldest first
    });
  };

  // GET order by ID (single record)
  getOrderByIdService = async (id: string) => {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        fulfillmentWarehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            location: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        fulfilledBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                inventory: {
                  where: {
                    warehouseId: {
                      in: await this.getFulfillmentWarehousesForOrder(id),
                    },
                  },
                  select: {
                    available: true,
                    quantity: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Calculate fulfillment progress
    const fulfillmentProgress = await this.calculateFulfillmentProgress(id);

    // Calculate inventory availability
    const itemsWithAvailability = await Promise.all(
      order.items.map(async (item) => {
        const totalAvailable = item.product.inventory.reduce(
          (sum, inv) => sum + inv.available,
          0,
        );
        const canFulfill = totalAvailable >= item.quantity;
        
        return {
          ...item,
          availableStock: totalAvailable,
          canFulfill,
        };
      }),
    );

    const canFulfillAll = itemsWithAvailability.every((item) => item.canFulfill);

    return {
      ...order,
      items: itemsWithAvailability,
      fulfillmentProgress,
      canFulfillAll,
    };
  };

  // CREATE order
  createOrderService = async (data: any) => {
    return await prisma.$transaction(async (tx) => {
      // Validate required fields
      const required = ["customerName", "createdById"];
      for (const field of required) {
        if (!data[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate user exists
      const user = await tx.user.findUnique({
        where: { id: data.createdById },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Validate warehouse if specified
      if (data.fulfillmentWarehouseId) {
        const warehouse = await tx.warehouse.findUnique({
          where: { id: data.fulfillmentWarehouseId },
        });

        if (!warehouse) {
          throw new Error("Warehouse not found");
        }
      }

      // Validate all products exist and are active
      const productIds = data.items.map((item: any) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
      });

      if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p.id);
        const missingIds = productIds.filter((id: string) => !foundIds.includes(id));
        throw new Error(`Products not found or inactive: ${missingIds.join(", ")}`);
      }

      // Calculate totals
      let subtotal = 0;
      const itemsData = [];

      for (const item of data.items) {
        const product = products.find((p) => p.id === item.productId);
        const unitPrice = item.unitPrice || product?.sellingPrice || 0;
        const itemTotal = item.quantity * unitPrice;

        subtotal += itemTotal;

        itemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: itemTotal,
          status: "PENDING",
        });
      }

      const tax = data.tax || 0;
      const shippingCost = data.shippingCost || 0;
      const totalAmount = subtotal + tax + shippingCost;

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress,
          fulfillmentWarehouseId: data.fulfillmentWarehouseId,
          priority: data.priority || "NORMAL",
          status: "NEW",
          createdById: data.createdById,
          requiredDate: data.requiredDate,
          subtotal,
          tax,
          shippingCost,
          totalAmount,
          estimatedCarbonKg: data.estimatedCarbonKg || 0,
          packagingType: data.packagingType || "STANDARD",
          notes: data.notes,
          items: {
            create: itemsData,
          },
        },
        include: {
          fulfillmentWarehouse: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Reserve inventory if warehouse is specified
      if (data.fulfillmentWarehouseId) {
        for (const item of data.items) {
          const inventoryWhere = {
            warehouseId_productId: {
              warehouseId: data.fulfillmentWarehouseId,
              productId: item.productId,
            },
          };

          await tx.inventory.update({
            where: inventoryWhere,
            data: {
              reserved: { increment: item.quantity },
              available: { decrement: item.quantity },
              lastUpdated: new Date(),
            },
          });
        }
      }

      return order;
    });
  };

  // UPDATE order
  updateOrderService = async (id: string, data: any) => {
    return await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
          fulfillmentWarehouse: true,
        },
      });

      if (!existingOrder) {
        throw new Error("Order not found");
      }

      // Handle status transitions
      if (data.status) {
        const validTransitions: Record<string, string[]> = {
          NEW: ["PROCESSING", "CANCELLED"],
          PROCESSING: ["PICKING", "CANCELLED"],
          PICKING: ["PACKED", "CANCELLED"],
          PACKED: ["SHIPPED", "CANCELLED"],
          SHIPPED: ["DELIVERED", "RETURNED"],
          DELIVERED: ["RETURNED"],
          CANCELLED: [],
          RETURNED: [],
        };

        const allowedNextStatuses = validTransitions[existingOrder.status] || [];
        if (!allowedNextStatuses.includes(data.status)) {
          throw new Error(
            `Invalid status transition from ${existingOrder.status} to ${data.status}`,
          );
        }

        // Handle cancellation - release reserved inventory
        if (data.status === "CANCELLED" && existingOrder.fulfillmentWarehouseId) {
          for (const item of existingOrder.items) {
            const inventoryWhere = {
              warehouseId_productId: {
                warehouseId: existingOrder.fulfillmentWarehouseId,
                productId: item.productId,
              },
            };

            await tx.inventory.update({
              where: inventoryWhere,
              data: {
                reserved: { decrement: item.quantity },
                available: { increment: item.quantity },
                lastUpdated: new Date(),
              },
            });
          }
        }

        // Handle returns - restock inventory
        if (data.status === "RETURNED" && existingOrder.fulfillmentWarehouseId) {
          for (const item of existingOrder.items) {
            const inventoryWhere = {
              warehouseId_productId: {
                warehouseId: existingOrder.fulfillmentWarehouseId,
                productId: item.productId,
              },
            };

            await tx.inventory.update({
              where: inventoryWhere,
              data: {
                quantity: { increment: item.quantity },
                available: { increment: item.quantity },
                lastUpdated: new Date(),
              },
            });
          }
        }
      }

      // Update order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          ...data,
          fulfilledById: data.fulfilledById || undefined,
        },
        include: {
          fulfillmentWarehouse: true,
          createdBy: true,
          fulfilledBy: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return updatedOrder;
    });
  };

  // GET order statistics
  getOrderStatisticsService = async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalOrders,
      todayOrders,
      monthlyOrders,
      yearlyOrders,
      ordersByStatus,
      ordersByPriority,
      totalRevenue,
      averageOrderValue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: {
          orderDate: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.order.count({
        where: {
          orderDate: { gte: startOfMonth },
        },
      }),
      prisma.order.count({
        where: {
          orderDate: { gte: startOfYear },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ["priority"],
        _count: { id: true },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.order.aggregate({
        _avg: { totalAmount: true },
        where: { status: { not: "CANCELLED" } },
      }),
    ]);

    // Get top customers
    const topCustomers = await prisma.order.groupBy({
      by: ["customerName"],
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5,
      where: { status: { not: "CANCELLED" } },
    });

    return {
      counts: {
        total: totalOrders,
        today: todayOrders,
        thisMonth: monthlyOrders,
        thisYear: yearlyOrders,
      },
      byStatus: ordersByStatus.map((o) => ({
        status: o.status,
        count: o._count.id,
      })),
      byPriority: ordersByPriority.map((o) => ({
        priority: o.priority,
        count: o._count.id,
      })),
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        average: averageOrderValue._avg.totalAmount || 0,
      },
      topCustomers: topCustomers.map((c) => ({
        customerName: c.customerName,
        orderCount: c._count.id,
        totalSpent: c._sum.totalAmount || 0,
      })),
    };
  };

  // Helper: Calculate fulfillment progress
  private calculateFulfillmentProgress = async (orderId: string): Promise<number> => {
    const items = await prisma.orderItem.findMany({
      where: { orderId },
      select: { status: true },
    });

    if (items.length === 0) return 0;

    const statusWeights: Record<string, number> = {
      PENDING: 0,
      RESERVED: 25,
      PICKED: 50,
      PACKED: 75,
      SHIPPED: 100,
    };

    const totalWeight = items.reduce(
      (sum, item) => sum + (statusWeights[item.status] || 0),
      0,
    );

    return Math.round(totalWeight / items.length);
  };

  // Helper: Get fulfillment warehouses for order
  private getFulfillmentWarehousesForOrder = async (orderId: string): Promise<string[]> => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { fulfillmentWarehouseId: true },
    });

    return order?.fulfillmentWarehouseId ? [order.fulfillmentWarehouseId] : [];
  };
}