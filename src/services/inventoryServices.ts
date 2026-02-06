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

export default class InventoryServices {
  // MAIN SEARCH METHOD with pagination
  searchInventoryService = async (params: SearchParams): Promise<SearchResult> => {
    const { search, currentPage, limit, filters } = params;
    
    // FIX: Provide default sort if not provided
    const sort = params.sort || { field: "lastUpdated", order: "desc" };
    
    const skip = (currentPage - 1) * limit;

    // Build WHERE clause
    const where: any = {};

    // Search across product name, sku, warehouse name
    if (search) {
      where.OR = [
        {
          product: {
            name: { contains: search, mode: "insensitive" }
          }
        },
        {
          product: {
            sku: { contains: search, mode: "insensitive" }
          }
        },
        {
          warehouse: {
            name: { contains: search, mode: "insensitive" }
          }
        },
        {
          warehouse: {
            code: { contains: search, mode: "insensitive" }
          }
        }
      ];
    }

    // Apply filters
    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }
    if (filters.productId) {
      where.productId = filters.productId;
    }
    if (filters.categoryId) {
      where.product = { categoryId: filters.categoryId };
    }
    if (filters.lowStockOnly) {
      // Get products with their min stock levels
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, minStockLevel: true }
      });
      
      const lowStockProductIds = products
        .filter(p => p.minStockLevel > 0)
        .map(p => p.id);
      
      where.productId = { in: lowStockProductIds };
      
      // Create a raw SQL condition for low stock
      const productConditions = products
        .filter(p => p.minStockLevel > 0)
        .map(p => `(inventory."product_id" = '${p.id}' AND inventory.quantity <= ${p.minStockLevel})`)
        .join(' OR ');
      
      if (productConditions) {
        where.AND = [
          { productId: { in: lowStockProductIds } },
          // We'll filter in memory for complex conditions
        ];
      }
    }
    if (filters.outOfStockOnly) {
      where.quantity = 0;
    }
    if (filters.reorderStatus) {
      where.reorderStatus = filters.reorderStatus;
    }

    // Build ORDER BY - FIXED: Added null check
    const orderBy: any = {};
    if (sort && sort.field) {
      if (sort.field.includes(".")) {
        // Nested field like "product.name"
        const [relation, field] = sort.field.split(".");
        orderBy[relation] = { [field]: sort.order };
      } else {
        orderBy[sort.field] = sort.order;
      }
    } else {
      // Default ordering
      orderBy.lastUpdated = "desc";
    }

    // Get data and count
    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
              location: true,
            },
          },
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.inventory.count({ where }),
    ]);

    // Apply low stock filter in memory if needed
    let filteredData = data;
    if (filters.lowStockOnly) {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, minStockLevel: true }
      });
      
      const productMinStockMap = new Map(
        products.map(p => [p.id, p.minStockLevel])
      );
      
      filteredData = data.filter(inv => {
        const minStock = productMinStockMap.get(inv.productId) || 0;
        return minStock > 0 && inv.quantity <= minStock;
      });
    }

    return {
      data: filteredData,
      pagination: {
        currentPage,
        limit,
        total: filters.lowStockOnly ? filteredData.length : total,
        totalPages: Math.ceil((filters.lowStockOnly ? filteredData.length : total) / limit),
        hasNext: currentPage * limit < (filters.lowStockOnly ? filteredData.length : total),
        hasPrev: currentPage > 1,
      },
    };
  };

  // Search low stock inventory
  searchLowStockInventoryService = async (
    params: SearchParams & { threshold?: number }
  ): Promise<SearchResult> => {
    // Use the main search method with lowStockOnly filter
    return this.searchInventoryService({
      ...params,
      filters: { ...params.filters, lowStockOnly: true },
    });
  };

  // Search inventory by warehouse
  searchInventoryByWarehouseService = async (
    warehouseId: string,
    params: SearchParams
  ): Promise<SearchResult> => {
    return this.searchInventoryService({
      ...params,
      filters: { ...params.filters, warehouseId },
    });
  };

  // Search inventory by product
  searchInventoryByProductService = async (
    productId: string,
    params: SearchParams
  ): Promise<SearchResult> => {
    return this.searchInventoryService({
      ...params,
      filters: { ...params.filters, productId },
    });
  };

  // GET inventory by ID (single record)
  getInventoryByIdService = async (id: string) => {
    return await prisma.inventory.findUnique({
      where: { id },
      include: {
        warehouse: true,
        product: {
          include: {
            category: true,
            inventory: {
              include: {
                warehouse: true,
              },
            },
          },
        },
        stockCounts: {
          include: {
            countedBy: true,
          },
          orderBy: { countDate: "desc" },
        },
      },
    });
  };

  // UPSERT inventory (create or update)
  upsertInventoryService = async (data: any) => {
    const { warehouseId, productId, quantity = 0, aisle, shelf, bin } = data;

    if (!warehouseId || !productId) {
      throw new Error("Warehouse ID and Product ID are required");
    }

    const [warehouse, product] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: warehouseId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);

    if (!warehouse) throw new Error("Warehouse not found");
    if (!product) throw new Error("Product not found");

    const available = Math.max(0, quantity - (data.reserved || 0));

    return await prisma.inventory.upsert({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
      update: {
        quantity,
        available,
        aisle,
        shelf,
        bin,
        lastUpdated: new Date(),
        reorderStatus: this.calculateReorderStatus(quantity, product.minStockLevel, product.reorderPoint),
      },
      create: {
        warehouseId,
        productId,
        quantity,
        available,
        aisle,
        shelf,
        bin,
        reorderStatus: this.calculateReorderStatus(quantity, product.minStockLevel, product.reorderPoint),
      },
      include: {
        warehouse: true,
        product: true,
      },
    });
  };

  // Update inventory quantity with action
  updateInventoryQuantityService = async (
    id: string,
    quantity: number,
    action: string = "SET",
    notes?: string
  ) => {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!inventory) {
      throw new Error("Inventory record not found");
    }

    let newQuantity = inventory.quantity;
    switch (action) {
      case "SET":
        newQuantity = quantity;
        break;
      case "ADD":
        newQuantity = inventory.quantity + quantity;
        break;
      case "SUBTRACT":
        newQuantity = Math.max(0, inventory.quantity - quantity);
        break;
      default:
        throw new Error("Invalid action. Use 'SET', 'ADD', or 'SUBTRACT'");
    }

    return await prisma.inventory.update({
      where: { id },
      data: {
        quantity: newQuantity,
        available: Math.max(0, newQuantity - inventory.reserved),
        lastUpdated: new Date(),
        reorderStatus: this.calculateReorderStatus(
          newQuantity,
          inventory.product.minStockLevel,
          inventory.product.reorderPoint
        ),
      },
      include: {
        warehouse: true,
        product: true,
      },
    });
  };

  // DELETE inventory record
  deleteInventoryService = async (id: string) => {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      throw new Error("Inventory record not found");
    }

    if (inventory.quantity > 0) {
      throw new Error("Cannot delete inventory with stock. Set quantity to zero first.");
    }

    return await prisma.inventory.delete({
      where: { id },
    });
  };

  // Bulk update inventory
  bulkUpdateInventoryService = async (updates: Array<{
    id: string;
    quantity: number;
    action: string;
    notes?: string;
  }>) => {
    const results = [];
    
    for (const update of updates) {
      try {
        const result = await this.updateInventoryQuantityService(
          update.id,
          update.quantity,
          update.action,
          update.notes
        );
        results.push({ success: true, data: result });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  };

  // GET inventory summary (dashboard)
  getInventorySummaryService = async () => {
    const [
      totalItems,
      totalQuantity,
      outOfStockCount,
      warehousesWithStock,
    ] = await Promise.all([
      prisma.inventory.count(),
      prisma.inventory.aggregate({
        _sum: { quantity: true },
      }),
      prisma.inventory.count({ where: { quantity: 0 } }),
      prisma.warehouse.count({
        where: {
          inventory: {
            some: { quantity: { gt: 0 } },
          },
        },
      }),
    ]);

    const [totalValue, lowStockCount] = await Promise.all([
      this.calculateTotalInventoryValue(),
      this.getLowStockCount(),
    ]);

    return {
      totalItems,
      totalQuantity: totalQuantity._sum.quantity || 0,
      totalValue,
      lowStockCount,
      outOfStockCount,
      warehousesWithStock,
      averageStockPerItem: totalItems > 0 ? (totalQuantity._sum.quantity || 0) / totalItems : 0,
    };
  };

  // POST inventory value report with filters
  getInventoryValueReportService = async (filters: Record<string, any>) => {
    const where: any = {};
    
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.categoryId) where.product = { categoryId: filters.categoryId };
    
    // Handle low stock filter differently
    let inventory = await prisma.inventory.findMany({
      where,
      include: {
        warehouse: true,
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Apply low stock filter in memory if needed
    if (filters.lowStockOnly) {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, minStockLevel: true }
      });
      
      const productMinStockMap = new Map(
        products.map(p => [p.id, p.minStockLevel])
      );
      
      inventory = inventory.filter(inv => {
        const minStock = productMinStockMap.get(inv.productId) || 0;
        return minStock > 0 && inv.quantity <= minStock;
      });
    }

    // Calculate values
    let totalValue = 0;
    const byWarehouse = new Map();
    const byCategory = new Map();

    inventory.forEach(inv => {
      const value = inv.quantity * (inv.product.costPrice || 0);
      totalValue += value;

      // Warehouse grouping
      const warehouseKey = inv.warehouseId;
      if (!byWarehouse.has(warehouseKey)) {
        byWarehouse.set(warehouseKey, {
          warehouse: inv.warehouse,
          totalValue: 0,
          items: 0,
        });
      }
      const warehouseData = byWarehouse.get(warehouseKey);
      warehouseData.totalValue += value;
      warehouseData.items += inv.quantity;

      // Category grouping
      const categoryKey = inv.product.categoryId;
      if (!byCategory.has(categoryKey)) {
        byCategory.set(categoryKey, {
          category: inv.product.category,
          totalValue: 0,
          items: 0,
        });
      }
      const categoryData = byCategory.get(categoryKey);
      categoryData.totalValue += value;
      categoryData.items += inv.quantity;
    });

    return {
      totalValue,
      byWarehouse: Array.from(byWarehouse.values()),
      byCategory: Array.from(byCategory.values()),
      inventoryCount: inventory.length,
    };
  };

  // Helper: Calculate reorder status
  private calculateReorderStatus = (
    quantity: number,
    minStockLevel: number,
    reorderPoint: number
  ): string => {
    if (quantity <= minStockLevel) return "BELOW_MIN";
    if (quantity <= reorderPoint) return "BELOW_REORDER";
    return "OK";
  };

  // Helper: Calculate total inventory value
  private calculateTotalInventoryValue = async (): Promise<number> => {
    const inventory = await prisma.inventory.findMany({
      include: { product: true },
    });

    return inventory.reduce((sum, inv) => {
      return sum + (inv.quantity * (inv.product.costPrice || 0));
    }, 0);
  };

  // Helper: Get low stock count
  private getLowStockCount = async (): Promise<number> => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, minStockLevel: true }
    });
    
    const allInventory = await prisma.inventory.findMany({
      where: {
        productId: { in: products.map(p => p.id) }
      },
      include: {
        product: true
      }
    });
    
    return allInventory.filter(inv => {
      const product = products.find(p => p.id === inv.productId);
      return product && product.minStockLevel > 0 && inv.quantity <= product.minStockLevel;
    }).length;
  };
}