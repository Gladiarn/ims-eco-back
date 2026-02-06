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

export default class ProductServices {
  // MAIN SEARCH METHOD with pagination
  searchProductsService = async (
    params: SearchParams,
  ): Promise<SearchResult> => {
    const { search, currentPage, limit, filters } = params;
    const skip = (currentPage - 1) * limit;

    // FIX: Provide default sort if not provided
    const sort = params.sort || { field: "createdAt", order: "desc" };

    // Build WHERE clause
    const where: any = {
      AND: [],
    };

    // Search across product fields
    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { materialType: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Apply filters
    if (filters.categoryId) {
      where.AND.push({ categoryId: filters.categoryId });
    }
    if (filters.isEcoFriendly !== undefined) {
      where.AND.push({ isEcoFriendly: filters.isEcoFriendly });
    }
    if (filters.isActive !== undefined) {
      where.AND.push({ isActive: filters.isActive });
    }
    if (filters.materialType) {
      where.AND.push({ materialType: filters.materialType });
    }
    if (filters.supplierId) {
      where.AND.push({
        supplierProducts: {
          some: { supplierId: filters.supplierId },
        },
      });
    }

    // Remove empty AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }
    // Build ORDER BY
    const orderBy: any = {};
    if (sort && sort.field) {
      if (sort.field.includes(".")) {
        // Nested field like "category.name"
        const [relation, field] = sort.field.split(".");
        orderBy[relation] = { [field]: sort.order };
      } else if (sort.field === "inventoryCount") {
        // Special case: sort by number of inventory records
        orderBy.inventory = { _count: sort.order };
      } else {
        orderBy[sort.field] = sort.order;
      }
    } else {
      // Default ordering
      orderBy.createdAt = "desc";
    }

    // Get data and count
    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              isRecyclable: true,
            },
          },
          supplierProducts: {
            include: {
              supplier: {
                select: {
                  id: true,
                  name: true,
                  sustainabilityRating: true,
                },
              },
            },
            take: 1, // Just get first supplier for preview
          },
          _count: {
            select: {
              inventory: true,
              orderItems: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate additional metrics
    const productsWithMetrics = await Promise.all(
      data.map(async (product) => {
        // Get total stock across all warehouses
        const inventory = await prisma.inventory.findMany({
          where: { productId: product.id },
          select: { quantity: true, available: true },
        });

        const totalStock = inventory.reduce(
          (sum, inv) => sum + inv.quantity,
          0,
        );
        const totalAvailable = inventory.reduce(
          (sum, inv) => sum + inv.available,
          0,
        );
        const totalValue = totalStock * product.costPrice;

        const reorderStatus = this.calculateReorderStatus(
          totalAvailable,
          product.reorderPoint,
          product.minStockLevel,
        );

        return {
          ...product,
          totalStock,
          totalAvailable,
          totalValue,
          reorderStatus,
        };
      }),
    );

    return {
      data: productsWithMetrics,
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

  // Search low stock products
  searchLowStockProductsService = async (
  params: SearchParams & { threshold?: number },
): Promise<SearchResult> => {
  const { search, currentPage, limit, filters, threshold } = params;

  const sort = params.sort || { field: "totalAvailable", order: "asc" };
  const skip = (currentPage - 1) * limit;

  // Build WHERE clause
  const where: any = {
    isActive: true,
    AND: [],
  };

  // Search across product fields
  if (search) {
    where.AND.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  // Apply filters
  if (filters.categoryId) {
    where.AND.push({ categoryId: filters.categoryId });
  }
  if (filters.materialType) {
    where.AND.push({ materialType: filters.materialType });
  }

  // Remove empty AND array
  if (where.AND.length === 0) {
    delete where.AND;
  }

  // Get all active products
  const allProducts = await prisma.product.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      inventory: {
        select: {
          available: true,
        },
      },
    },
  });

  // Filter for low stock based on threshold or reorder point
  const lowStockProducts = allProducts.filter((product) => {
    const totalAvailable = product.inventory.reduce(
      (sum, inv) => sum + inv.available,
      0,
    );
    const thresholdValue = threshold || product.reorderPoint;
    return totalAvailable <= thresholdValue;
  });

  // === FIX: Type-safe sorting ===
  // First calculate totalAvailable for all products
  const lowStockProductsWithMetrics = lowStockProducts.map((product) => {
    const totalAvailable = product.inventory.reduce(
      (sum, inv) => sum + inv.available,
      0,
    );
    const thresholdValue = threshold || product.reorderPoint;
    const reorderStatus = this.calculateReorderStatus(
      totalAvailable,
      product.reorderPoint,
      product.minStockLevel,
    );

    return {
      ...product,
      totalAvailable,
      reorderThreshold: thresholdValue,
      reorderStatus,
    };
  });

  // Now apply sorting safely
  let sortedProducts = [...lowStockProductsWithMetrics];
  
  if (sort.field === "totalAvailable") {
    sortedProducts.sort((a, b) => {
      if (sort.order === "asc") {
        return a.totalAvailable - b.totalAvailable;
      } else {
        return b.totalAvailable - a.totalAvailable;
      }
    });
  } else if (sort.field === "name") {
    sortedProducts.sort((a, b) => {
      if (sort.order === "asc") {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
  } else if (sort.field === "reorderPoint") {
    sortedProducts.sort((a, b) => {
      if (sort.order === "asc") {
        return a.reorderPoint - b.reorderPoint;
      } else {
        return b.reorderPoint - a.reorderPoint;
      }
    });
  } else if (sort.field === "sku") {
    sortedProducts.sort((a, b) => {
      if (sort.order === "asc") {
        return a.sku.localeCompare(b.sku);
      } else {
        return b.sku.localeCompare(a.sku);
      }
    });
  }
  // Add more sort fields as needed
  // =================================

  // Paginate manually
  const startIndex = skip;
  const endIndex = Math.min(skip + limit, sortedProducts.length);
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  return {
    data: paginatedProducts,
    pagination: {
      currentPage,
      limit,
      total: sortedProducts.length,
      totalPages: Math.ceil(sortedProducts.length / limit),
      hasNext: endIndex < sortedProducts.length,
      hasPrev: currentPage > 1,
    },
  };
};

  // Search products by category
  searchProductsByCategoryService = async (
    categoryId: string,
    params: SearchParams,
  ): Promise<SearchResult> => {
    return this.searchProductsService({
      ...params,
      filters: { ...params.filters, categoryId },
    });
  };

  // GET product by ID (single record)
  getProductByIdService = async (id: string) => {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            isRecyclable: true,
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        supplierProducts: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                sustainabilityRating: true,
                isCertifiedEco: true,
                contactName: true,
                email: true,
              },
            },
          },
        },
        inventory: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                location: true,
                city: true,
              },
            },
          },
        },
        _count: {
          select: {
            inventory: true,
            orderItems: true,
            transferItems: true,
            transactionItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Calculate metrics
    const totalStock = product.inventory.reduce(
      (sum, inv) => sum + inv.quantity,
      0,
    );
    const totalReserved = product.inventory.reduce(
      (sum, inv) => sum + inv.reserved,
      0,
    );
    const totalAvailable = product.inventory.reduce(
      (sum, inv) => sum + inv.available,
      0,
    );
    const totalValue = totalStock * product.costPrice;

    const reorderStatus = this.calculateReorderStatus(
      totalAvailable,
      product.reorderPoint,
      product.minStockLevel,
    );

    return {
      ...product,
      totalStock,
      totalReserved,
      totalAvailable,
      totalValue,
      reorderStatus,
    };
  };

  // UPSERT product (create or update)
  upsertProductService = async (data: any) => {
    const {
      sku,
      name,
      description,
      categoryId,
      unit,
      weight,
      volume,
      isEcoFriendly,
      materialType,
      costPrice,
      sellingPrice,
      minStockLevel,
      reorderPoint,
      carbonFootprintKg,
      isActive = true,
    } = data;

    // Validate required fields
    if (!sku || !name || !categoryId || !unit || costPrice === undefined) {
      throw new Error("SKU, name, category, unit, and cost price are required");
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new Error("Category not found");
    }

    // For update: check if product exists
    if (data.id) {
      const existingProduct = await prisma.product.findUnique({
        where: { id: data.id },
      });
      if (!existingProduct) {
        throw new Error("Product not found");
      }
    }

    // Check for duplicate SKU (only if SKU is being changed)
    if (data.id) {
      const existingWithSku = await prisma.product.findFirst({
        where: {
          sku,
          id: { not: data.id },
        },
      });
      if (existingWithSku) {
        throw new Error(`Product with SKU ${sku} already exists`);
      }
    } else {
      const existingWithSku = await prisma.product.findUnique({
        where: { sku },
      });
      if (existingWithSku) {
        throw new Error(`Product with SKU ${sku} already exists`);
      }
    }

    const productData = {
      sku,
      name,
      description,
      categoryId,
      unit,
      weight,
      volume,
      isEcoFriendly: isEcoFriendly ?? true,
      materialType,
      costPrice,
      sellingPrice,
      minStockLevel: minStockLevel ?? 10,
      reorderPoint: reorderPoint ?? 20,
      carbonFootprintKg,
      isActive,
    };

    if (data.id) {
      // Update existing product
      return await prisma.product.update({
        where: { id: data.id },
        data: productData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else {
      // Create new product
      return await prisma.product.create({
        data: productData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }
  };

  // DELETE product
  deleteProductService = async (id: string) => {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventory: true,
            orderItems: true,
            transferItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if product has inventory
    if (product._count.inventory > 0) {
      throw new Error(
        "Cannot delete product with existing inventory. Please transfer or adjust inventory first.",
      );
    }

    // Check if product has order history
    if (product._count.orderItems > 0) {
      throw new Error(
        "Cannot delete product with existing order history. Consider marking as inactive instead.",
      );
    }

    return await prisma.product.delete({
      where: { id },
    });
  };

  // Bulk update products
  bulkUpdateProductsService = async (
    updates: Array<{
      id: string;
      data: Partial<any>;
    }>,
  ) => {
    const results = [];

    for (const update of updates) {
      try {
        const result = await this.upsertProductService({
          ...update.data,
          id: update.id,
        });
        results.push({ success: true, data: result });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  };

  // GET product inventory across all warehouses
  getProductInventoryService = async (productId: string) => {
    const inventory = await prisma.inventory.findMany({
      where: { productId },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
            city: true,
            country: true,
          },
        },
      },
      orderBy: { warehouse: { name: "asc" } },
    });

    // Calculate totals
    const totals = {
      totalQuantity: inventory.reduce((sum, inv) => sum + inv.quantity, 0),
      totalReserved: inventory.reduce((sum, inv) => sum + inv.reserved, 0),
      totalAvailable: inventory.reduce((sum, inv) => sum + inv.available, 0),
    };

    return {
      inventory,
      totals,
    };
  };

  // GET product statistics (dashboard)
  getProductStatisticsService = async () => {
    const [
      totalProducts,
      activeProducts,
      ecoFriendlyProducts,
      totalInventoryValue,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isEcoFriendly: true, isActive: true } }),
      this.calculateTotalProductsValue(),
    ]);

    // Get products by category
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const productsByCategory = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      productCount: cat._count.products,
    }));

    return {
      totalProducts,
      activeProducts,
      ecoFriendlyProducts,
      totalInventoryValue,
      productsByCategory,
      averageProductsPerCategory:
        categories.length > 0 ? activeProducts / categories.length : 0,
    };
  };

  // Helper: Calculate reorder status
  private calculateReorderStatus = (
    available: number,
    reorderPoint: number,
    minStockLevel: number,
  ): string => {
    if (available <= minStockLevel) return "CRITICAL";
    if (available <= reorderPoint) return "LOW";
    return "OK";
  };

  // Helper: Calculate total value of all products in inventory
  private calculateTotalProductsValue = async (): Promise<number> => {
    const inventory = await prisma.inventory.findMany({
      include: { product: true },
    });

    return inventory.reduce((sum, inv) => {
      return sum + inv.quantity * (inv.product.costPrice || 0);
    }, 0);
  };

  getProductsDashboardSummaryService = async () => {
    const [
      totalProducts,
      activeProducts,
      ecoFriendlyProducts,
      lowStockCount,
      outOfStockCount,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isEcoFriendly: true, isActive: true } }),
      this.getLowStockCountService(),
      this.getOutOfStockCountService(),
    ]);

    // Get recent products
    const recentProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get top categories
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        products: { _count: "desc" },
      },
      take: 5,
    });

    return {
      counts: {
        totalProducts,
        activeProducts,
        ecoFriendlyProducts,
        lowStockCount,
        outOfStockCount,
      },
      recentProducts,
      topCategories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        productCount: cat._count.products,
      })),
    };
  };

  // GET product analytics data
  getProductAnalyticsService = async (filters: Record<string, any> = {}) => {
    const where: any = { isActive: true };

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.materialType) {
      where.materialType = filters.materialType;
    }

    // Get all products with inventory
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        inventory: {
          include: {
            warehouse: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
            transferItems: true,
          },
        },
      },
    });

    // Calculate analytics
    const analytics = {
      totalProducts: products.length,
      totalValue: 0,
      totalStock: 0,
      avgCostPrice: 0,
      byCategory: new Map(),
      byWarehouse: new Map(),
      topProducts: [] as any[],
      lowStockProducts: [] as any[],
    };

    products.forEach((product) => {
      // Calculate product metrics
      const totalStock = product.inventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0,
      );
      const totalValue = totalStock * product.costPrice;
      const totalAvailable = product.inventory.reduce(
        (sum, inv) => sum + inv.available,
        0,
      );

      // Update totals
      analytics.totalValue += totalValue;
      analytics.totalStock += totalStock;

      // Category breakdown
      const categoryKey = product.categoryId;
      if (!analytics.byCategory.has(categoryKey)) {
        analytics.byCategory.set(categoryKey, {
          category: product.category,
          totalValue: 0,
          productCount: 0,
          totalStock: 0,
        });
      }
      const catData = analytics.byCategory.get(categoryKey);
      catData.totalValue += totalValue;
      catData.productCount += 1;
      catData.totalStock += totalStock;

      // Warehouse breakdown
      product.inventory.forEach((inv) => {
        const warehouseKey = inv.warehouseId;
        if (!analytics.byWarehouse.has(warehouseKey)) {
          analytics.byWarehouse.set(warehouseKey, {
            warehouse: inv.warehouse,
            totalValue: 0,
            productCount: 0,
          });
        }
        const whData = analytics.byWarehouse.get(warehouseKey);
        const invValue = inv.quantity * product.costPrice;
        whData.totalValue += invValue;
        whData.productCount += 1;
      });

      // Check for top products (by value)
      const productData = {
        ...product,
        totalStock,
        totalValue,
        totalAvailable,
        reorderStatus: this.calculateReorderStatus(
          totalAvailable,
          product.reorderPoint,
          product.minStockLevel,
        ),
      };

      // Add to top products if high value
      if (totalValue > 0) {
        analytics.topProducts.push(productData);
      }

      // Add to low stock if below reorder
      if (totalAvailable <= product.reorderPoint) {
        analytics.lowStockProducts.push(productData);
      }
    });

    // Sort and limit
    analytics.topProducts
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
    analytics.lowStockProducts
      .sort((a, b) => a.totalAvailable - b.totalAvailable)
      .slice(0, 10);

    // Calculate average cost price
    analytics.avgCostPrice =
      products.length > 0
        ? products.reduce((sum, p) => sum + p.costPrice, 0) / products.length
        : 0;

    return {
      ...analytics,
      byCategory: Array.from(analytics.byCategory.values()),
      byWarehouse: Array.from(analytics.byWarehouse.values()),
    };
  };

  // GET product turnover analytics
  getProductTurnoverService = async (period: string = "month") => {
    // This would need transaction data to calculate turnover
    // For now, return placeholder structure
    return {
      period,
      topTurnoverProducts: [],
      slowMovingProducts: [],
      averageTurnoverRate: 0,
    };
  };

  // GET products by warehouse (for warehouse-view)
  getProductsByWarehouseService = async (
    warehouseId: string,
    params: SearchParams,
  ) => {
    // Get inventory for this warehouse
    const inventoryResult = await this.searchInventoryByWarehouseService(
      warehouseId,
      params,
    );

    // Extract products from inventory
    const products = inventoryResult.data.map((inv) => ({
      ...inv.product,
      warehouseQuantity: inv.quantity,
      warehouseAvailable: inv.available,
      warehouseLocation: `${inv.aisle || ""}${inv.shelf ? `-${inv.shelf}` : ""}${inv.bin ? `-${inv.bin}` : ""}`,
      reorderStatus: inv.reorderStatus,
    }));

    return {
      data: products,
      pagination: inventoryResult.pagination,
    };
  };

  // Helper: Get low stock count
  private getLowStockCountService = async (): Promise<number> => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { inventory: true },
    });

    return products.filter((product) => {
      const totalAvailable = product.inventory.reduce(
        (sum, inv) => sum + inv.available,
        0,
      );
      return totalAvailable <= product.reorderPoint;
    }).length;
  };

  // Helper: Get out of stock count
  private getOutOfStockCountService = async (): Promise<number> => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { inventory: true },
    });

    return products.filter((product) => {
      const totalAvailable = product.inventory.reduce(
        (sum, inv) => sum + inv.available,
        0,
      );
      return totalAvailable === 0;
    }).length;
  };

  // Search inventory by warehouse (add this method)
  private searchInventoryByWarehouseService = async (
    warehouseId: string,
    params: SearchParams,
  ): Promise<SearchResult> => {
    const { search, currentPage, limit, filters, sort } = params;
    const skip = (currentPage - 1) * limit;

    const where: any = {
      warehouseId,
      product: {
        isActive: true,
      },
    };

    if (search) {
      where.product = {
        ...where.product,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (filters.categoryId) {
      where.product = {
        ...where.product,
        categoryId: filters.categoryId,
      };
    }

    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy: sort.field.includes("product.")
          ? { product: { [sort.field.split(".")[1]]: sort.order } }
          : { [sort.field]: sort.order },
        skip,
        take: limit,
      }),
      prisma.inventory.count({ where }),
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
}
