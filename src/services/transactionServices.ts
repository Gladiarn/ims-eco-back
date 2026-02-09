import { prisma } from "../lib/db";

interface TransactionSearchParams {
  search?: string;
  currentPage?: number;
  limit?: number;
  filters?: Record<string, any>;
  sort?: { field: string; order: "asc" | "desc" };
}

interface TransactionSearchResult {
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

export default class TransactionService {
  // Generate transaction number
  private generateTransactionNumber(type: string): string {
    const prefixMap: Record<string, string> = {
      STOCK_IN: "SI",
      STOCK_OUT: "SO",
      ADJUSTMENT: "ADJ",
      RETURN: "RET",
      WASTE: "WST",
      RECYCLING: "RCY",
    };
    
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const prefix = prefixMap[type] || "TRX";
    
    return `${prefix}-${timestamp}-${random}`;
  }

  // Calculate reorder status
  private calculateReorderStatus(quantity: number): string {
    return quantity <= 10 ? "BELOW_REORDER" : "OK";
  }

  // MAIN SEARCH METHOD with pagination
  searchTransactionsService = async (params: TransactionSearchParams): Promise<TransactionSearchResult> => {
    const { search, currentPage = 1, limit = 10, filters = {} } = params;
    
    const sort = params.sort || { field: "transactionDate", order: "desc" };
    const skip = (currentPage - 1) * limit;

    // Build WHERE clause
    const where: any = {};

    // Search
    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    // Apply filters
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
    if (filters.performedById) {
      where.performedById = filters.performedById;
    }
    if (filters.referenceType) {
      where.referenceType = filters.referenceType;
    }
    if (filters.startDate || filters.endDate) {
      where.transactionDate = {};
      if (filters.startDate) {
        where.transactionDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.transactionDate.lte = new Date(filters.endDate);
      }
    }

    // Build ORDER BY
    const orderBy: any = {};
    if (sort.field.includes(".")) {
      const [relation, field] = sort.field.split(".");
      orderBy[relation] = { [field]: sort.order };
    } else {
      orderBy[sort.field] = sort.order;
    }

    // Get data and count
    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          performedBy: {
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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data,
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

  // Search transactions by warehouse
  searchTransactionsByWarehouseService = async (
    warehouseId: string,
    params: TransactionSearchParams
  ): Promise<TransactionSearchResult> => {
    return this.searchTransactionsService({
      ...params,
      filters: { ...params.filters, warehouseId },
    });
  };

  // GET transaction by ID
  getTransactionByIdService = async (id: string) => {
    return await prisma.transaction.findUnique({
      where: { id },
      include: {
        warehouse: true,
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  };

  // CREATE transaction
  createTransactionService = async (data: any) => {
    return await prisma.$transaction(async (tx) => {
      const {
        type,
        warehouseId,
        performedById,
        referenceId,
        referenceType,
        notes,
        items,
      } = data;

      // Validate warehouse
      const warehouse = await tx.warehouse.findUnique({
        where: { id: warehouseId },
      });
      if (!warehouse) throw new Error("Warehouse not found");

      // Validate user
      const user = await tx.user.findUnique({
        where: { id: performedById },
      });
      if (!user) throw new Error("User not found");

      // Validate products
      const productIds = items.map((item: any) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p.id);
        const missingIds = productIds.filter((id: string) => !foundIds.includes(id));
        throw new Error(`Products not found: ${missingIds.join(", ")}`);
      }

      // Check inventory for stock out transactions
      const stockOutTypes = ["STOCK_OUT", "WASTE", "RECYCLING"];
      if (stockOutTypes.includes(type)) {
        for (const item of items) {
          const inventory = await tx.inventory.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId,
                productId: item.productId,
              },
            },
          });

          if (!inventory || inventory.available < item.quantity) {
            const product = products.find((p) => p.id === item.productId);
            throw new Error(`Insufficient stock for product ${product?.name || item.productId}`);
          }
        }
      }

      // Calculate totals and prepare items
      let totalItems = 0;
      let totalValue = 0;
      const itemsData: any[] = [];

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        const unitPrice = item.unitPrice || product?.costPrice || 0;
        const itemValue = item.quantity * unitPrice;

        totalItems += item.quantity;
        totalValue += itemValue;

        itemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: itemValue,
        });
      }

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber: this.generateTransactionNumber(type),
          type,
          warehouseId,
          performedById,
          referenceId,
          referenceType,
          totalItems,
          totalValue,
          notes,
          items: {
            create: itemsData,
          },
        },
        include: {
          warehouse: true,
          performedBy: {
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
                  category: true,
                },
              },
            },
          },
        },
      });

      // Update inventory
      for (const item of items) {
        const inventoryWhere = {
          warehouseId_productId: {
            warehouseId,
            productId: item.productId,
          },
        };

        const existingInventory = await tx.inventory.findUnique({
          where: inventoryWhere,
        });

        if (existingInventory) {
          let newQuantity = existingInventory.quantity;
          let newAvailable = existingInventory.available;

          switch (type) {
            case "STOCK_IN":
            case "RETURN":
              newQuantity += item.quantity;
              newAvailable += item.quantity;
              break;

            case "STOCK_OUT":
            case "WASTE":
            case "RECYCLING":
              newQuantity -= item.quantity;
              newAvailable -= item.quantity;
              break;

            case "ADJUSTMENT":
              newQuantity = item.quantity;
              newAvailable = Math.max(0, newQuantity - existingInventory.reserved);
              break;
          }

          await tx.inventory.update({
            where: inventoryWhere,
            data: {
              quantity: newQuantity,
              available: newAvailable,
              lastUpdated: new Date(),
              reorderStatus: this.calculateReorderStatus(newQuantity),
            },
          });

          // For adjustments, update transaction item
          if (type === "ADJUSTMENT") {
            await tx.transactionItem.updateMany({
              where: {
                transactionId: transaction.id,
                productId: item.productId,
              },
              data: {
                previousQty: existingInventory.quantity,
                newQty: item.quantity,
              },
            });
          }
        } else if (type === "STOCK_IN" || type === "RETURN") {
          await tx.inventory.create({
            data: {
              warehouseId,
              productId: item.productId,
              quantity: item.quantity,
              available: item.quantity,
              reserved: 0,
              reorderStatus: this.calculateReorderStatus(item.quantity),
            },
          });
        }
      }

      return transaction;
    });
  };

  // UPDATE transaction
  updateTransactionService = async (id: string, data: any) => {
    return await prisma.transaction.update({
      where: { id },
      data: {
        notes: data.notes,
      },
      include: {
        warehouse: true,
        performedBy: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  };

  // DELETE transaction
  deleteTransactionService = async (id: string) => {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Reverse inventory changes
      for (const item of transaction.items) {
        const inventoryWhere = {
          warehouseId_productId: {
            warehouseId: transaction.warehouseId,
            productId: item.productId,
          },
        };

        const existingInventory = await tx.inventory.findUnique({
          where: inventoryWhere,
        });

        if (existingInventory) {
          let newQuantity = existingInventory.quantity;
          let newAvailable = existingInventory.available;

          switch (transaction.type) {
            case "STOCK_IN":
            case "RETURN":
              newQuantity -= item.quantity;
              newAvailable -= item.quantity;
              break;

            case "STOCK_OUT":
            case "WASTE":
            case "RECYCLING":
              newQuantity += item.quantity;
              newAvailable += item.quantity;
              break;

            case "ADJUSTMENT":
              if (item.previousQty !== null && item.previousQty !== undefined) {
                newQuantity = item.previousQty;
                newAvailable = Math.max(0, newQuantity - existingInventory.reserved);
              }
              break;
          }

          await tx.inventory.update({
            where: inventoryWhere,
            data: {
              quantity: newQuantity,
              available: newAvailable,
              lastUpdated: new Date(),
              reorderStatus: this.calculateReorderStatus(newQuantity),
            },
          });
        }
      }

      // Delete transaction items first
      await tx.transactionItem.deleteMany({
        where: { transactionId: id },
      });

      // Delete transaction
      await tx.transaction.delete({
        where: { id },
      });

      return { message: "Transaction deleted successfully" };
    });
  };

  // GET transaction statistics
  getTransactionStatisticsService = async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalTransactions,
      todayTransactions,
      monthlyTransactions,
      yearlyTransactions,
      transactionsByType,
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({
        where: {
          transactionDate: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.transaction.count({
        where: {
          transactionDate: { gte: startOfMonth },
        },
      }),
      prisma.transaction.count({
        where: {
          transactionDate: { gte: startOfYear },
        },
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        _count: { id: true },
      }),
    ]);

    return {
      counts: {
        total: totalTransactions,
        today: todayTransactions,
        thisMonth: monthlyTransactions,
        thisYear: yearlyTransactions,
      },
      byType: transactionsByType.map((t) => ({
        type: t.type,
        count: t._count.id,
      })),
    };
  };
}