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

export default class WarehouseServices {
  // POST search warehouses with pagination
  searchWarehousesService = async (
    params: SearchParams,
  ): Promise<SearchResult> => {
    const { search, currentPage, limit, filters } = params;

    // FIX: Provide default sort if not provided
    const sort = params.sort || { field: "createdAt", order: "desc" };

    const skip = (currentPage - 1) * limit;

    // Build WHERE clause
    const where: any = {};

    // Search across multiple fields
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
      ];
    }

    // Apply filters
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === true || filters.isActive === "true";
    }
    if (filters.country) {
      where.country = filters.country;
    }
    if (filters.city) {
      where.city = filters.city;
    }
    if (filters.managerId) {
      where.managerId = filters.managerId;
    }
    if (filters.minCapacity) {
      where.capacity = { gte: Number(filters.minCapacity) };
    }
    if (filters.maxCapacity) {
      where.capacity = { ...where.capacity, lte: Number(filters.maxCapacity) };
    }

    // Build ORDER BY - ADD NULL CHECK!
    const orderBy: any = {};
    if (sort && sort.field) {
      if (sort.field.includes(".")) {
        // Nested field like "manager.firstName"
        const [relation, field] = sort.field.split(".");
        orderBy[relation] = { [field]: sort.order };
      } else {
        orderBy[sort.field] = sort.order;
      }
    } else {
      // Default ordering
      orderBy.createdAt = "desc";
    }

    // Get data and count
    const [data, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        include: {
          manager: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              inventory: true,
              transfers: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.warehouse.count({ where }),
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

  // Keep existing GET all for backward compatibility
  getAllWarehousesService = async () => {
    return await prisma.warehouse.findMany({
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            inventory: true,
            transfers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  };

  // GET active warehouses for dropdowns
  getActiveWarehousesService = async () => {
    return await prisma.warehouse.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        location: true,
        city: true,
        country: true,
      },
      orderBy: { name: "asc" },
    });
  };

  // GET warehouse by ID
  getWarehouseByIdService = async (id: string) => {
    return await prisma.warehouse.findUnique({
      where: { id },
      include: {
        manager: true,
        inventory: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        transfers: {
          include: {
            destWarehouse: true,
            requestedBy: true,
            items: {
              include: {
                product: true,
              },
            },
          },
          take: 10,
          orderBy: { requestDate: "desc" },
        },
        stockCounts: {
          include: {
            countedBy: true,
            inventory: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { countDate: "desc" },
          take: 5,
        },
      },
    });
  };

  // CREATE warehouse
  createWarehouseService = async (data: any) => {
    // Validate required fields
    const required = [
      "code",
      "name",
      "location",
      "address",
      "city",
      "country",
      "capacity",
    ];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check if code already exists
    const existing = await prisma.warehouse.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error("Warehouse code already exists");
    }

    return await prisma.warehouse.create({
      data: {
        ...data,
        capacity: parseInt(data.capacity),
        solarPercentage: data.solarPercentage
          ? parseFloat(data.solarPercentage)
          : null,
        carbonPerSqMeter: data.carbonPerSqMeter
          ? parseFloat(data.carbonPerSqMeter)
          : null,
      },
    });
  };

  // UPDATE warehouse
  updateWarehouseService = async (id: string, data: any) => {
    return await prisma.warehouse.update({
      where: { id },
      data,
    });
  };

  // DELETE warehouse
  deleteWarehouseService = async (id: string) => {
    // Check if warehouse has inventory
    const inventoryCount = await prisma.inventory.count({
      where: { warehouseId: id },
    });

    if (inventoryCount > 0) {
      throw new Error(
        "Cannot delete warehouse with inventory. Transfer or remove inventory first.",
      );
    }

    return await prisma.warehouse.delete({
      where: { id },
    });
  };

  // GET warehouse inventory summary
  getWarehouseInventorySummaryService = async (id: string) => {
    const inventory = await prisma.inventory.findMany({
      where: { warehouseId: id },
      include: {
        product: true,
      },
    });

    return {
      totalItems: inventory.length,
      totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: inventory.reduce((sum, item) => {
        return sum + item.quantity * (item.product.costPrice || 0);
      }, 0),
      lowStockItems: inventory.filter(
        (item) => item.quantity <= item.product.minStockLevel,
      ).length,
      outOfStockItems: inventory.filter((item) => item.quantity === 0).length,
    };
  };

  // GET warehouse statistics
  getWarehouseStatsService = async (id: string) => {
    const [inventory, transfers, stockCounts] = await Promise.all([
      prisma.inventory.count({ where: { warehouseId: id } }),
      prisma.transfer.count({
        where: {
          OR: [{ sourceWarehouseId: id }, { destWarehouseId: id }],
        },
      }),
      prisma.stockCount.count({ where: { warehouseId: id } }),
    ]);

    return {
      inventoryCount: inventory,
      transferCount: transfers,
      stockCountCount: stockCounts,
    };
  };

  // POST search warehouses with low stock
  searchWarehousesWithLowStockService = async (
    params: SearchParams,
  ): Promise<SearchResult> => {
    const { search, currentPage, limit, filters, sort } = params;
    const skip = (currentPage - 1) * limit;

    // Get all products with their min stock levels
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, minStockLevel: true },
    });

    const productMinStockMap = new Map(
      products.map((p) => [p.id, p.minStockLevel]),
    );

    // Build WHERE clause for warehouses
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === true || filters.isActive === "true";
    }
    if (filters.country) {
      where.country = filters.country;
    }

    // Get all warehouses with inventory
    const allWarehouses = await prisma.warehouse.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        inventory: {
          include: {
            product: true,
          },
        },
        _count: {
          select: {
            inventory: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Filter warehouses that have low stock items
    const warehousesWithLowStock = allWarehouses
      .map((warehouse) => ({
        ...warehouse,
        lowStockItems: warehouse.inventory.filter((item) => {
          const minStock = productMinStockMap.get(item.productId) || 0;
          return minStock > 0 && item.quantity <= minStock;
        }),
        totalLowStockCount: warehouse.inventory.filter((item) => {
          const minStock = productMinStockMap.get(item.productId) || 0;
          return minStock > 0 && item.quantity <= minStock;
        }).length,
      }))
      .filter((warehouse) => warehouse.totalLowStockCount > 0);

    // Apply sorting
    let sortedData = [...warehousesWithLowStock];
    if (sort.field === "totalLowStockCount") {
      sortedData.sort((a, b) => {
        return sort.order === "asc"
          ? a.totalLowStockCount - b.totalLowStockCount
          : b.totalLowStockCount - a.totalLowStockCount;
      });
    } else if (sort.field === "name") {
      sortedData.sort((a, b) => {
        return sort.order === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    }

    // Apply pagination
    const paginatedData = sortedData.slice(skip, skip + limit);

    return {
      data: paginatedData,
      pagination: {
        currentPage,
        limit,
        total: sortedData.length,
        totalPages: Math.ceil(sortedData.length / limit),
        hasNext: currentPage * limit < sortedData.length,
        hasPrev: currentPage > 1,
      },
    };
  };
}
