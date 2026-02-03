import { prisma } from "../lib/db";

export default class WarehouseServices {
  // GET all warehouses
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

  // GET warehouses with low stock
  getWarehousesWithLowStockService = async () => {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        minStockLevel: true,
      },
    });

    const productMinStockMap = new Map(
      products.map((p) => [p.id, p.minStockLevel]),
    );

    // Get all warehouses with their inventory
    const warehouses = await prisma.warehouse.findMany({
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
      },
    });

    return warehouses
      .map((warehouse) => ({
        ...warehouse,
        inventory: warehouse.inventory.filter(
          (item) =>
            item.quantity <= (productMinStockMap.get(item.productId) || 0),
        ),
      }))
      .filter((warehouse) => warehouse.inventory.length > 0);
  };
}