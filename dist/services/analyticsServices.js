"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const db_1 = require("../lib/db");
class AnalyticsService {
    /**
     * Get total inventory valuation across all warehouses
     */
    async getInventoryValuation() {
        const inventory = await db_1.prisma.inventory.findMany({
            include: {
                product: {
                    select: {
                        costPrice: true,
                        sellingPrice: true
                    }
                },
                warehouse: {
                    select: {
                        name: true,
                        city: true
                    }
                }
            }
        });
        const totalCostValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.product.costPrice || 0)), 0);
        const totalRetailValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.product.sellingPrice || 0)), 0);
        // Group by warehouse
        const byWarehouse = inventory.reduce((acc, item) => {
            const wId = item.warehouseId;
            if (!acc[wId]) {
                acc[wId] = {
                    name: item.warehouse.name,
                    city: item.warehouse.city,
                    costValue: 0,
                    retailValue: 0,
                    itemCount: 0
                };
            }
            acc[wId].costValue += (item.quantity * (item.product.costPrice || 0));
            acc[wId].retailValue += (item.quantity * (item.product.sellingPrice || 0));
            acc[wId].itemCount += item.quantity;
            return acc;
        }, {});
        return {
            summary: {
                totalCostValue,
                totalRetailValue,
                potentialProfit: totalRetailValue - totalCostValue,
                totalItems: inventory.reduce((sum, item) => sum + item.quantity, 0)
            },
            breakdown: Object.values(byWarehouse)
        };
    }
    /**
     * Get stock turnover rates
     * Simplified calculation: (Cost of Goods Sold / Average Inventory)
     */
    async getStockTurnover(periodDays = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        // 1. Calculate COGS (Sum of cost price of sold items from fulfilled orders)
        const fulfilledOrders = await db_1.prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                deliveredDate: { gte: startDate }
            },
            include: {
                items: {
                    include: {
                        product: { select: { costPrice: true } }
                    }
                }
            }
        });
        let cogs = 0;
        fulfilledOrders.forEach(order => {
            order.items.forEach(item => {
                cogs += (item.quantity * (item.product.costPrice || 0));
            });
        });
        // 2. Calculate Average Inventory (Current inventory as proxy for simplicity)
        const currentInventory = await db_1.prisma.inventory.findMany({
            include: { product: { select: { costPrice: true } } }
        });
        const inventoryValue = currentInventory.reduce((sum, item) => sum + (item.quantity * (item.product.costPrice || 0)), 0);
        // Avoid division by zero
        const turnoverRate = inventoryValue > 0 ? (cogs / inventoryValue) : 0;
        return {
            periodDays,
            cogs,
            averageInventoryValue: inventoryValue,
            turnoverRate,
            daysSalesInInventory: turnoverRate > 0 ? (periodDays / turnoverRate) : 0
        };
    }
    /**
     * Get main dashboard KPIs
     */
    async getDashboardKPIs() {
        const [totalProducts, totalWarehouses, lowStockItems, pendingOrders, activeTransfers, totalSustainability] = await Promise.all([
            db_1.prisma.product.count({ where: { isActive: true } }),
            db_1.prisma.warehouse.count({ where: { isActive: true } }),
            db_1.prisma.inventory.count({ where: { quantity: { lte: 10 } } }), // Simplified threshold
            db_1.prisma.order.count({ where: { status: { in: ['NEW', 'PROCESSING'] } } }),
            db_1.prisma.transfer.count({ where: { status: { in: ['PENDING', 'IN_TRANSIT'] } } }),
            db_1.prisma.carbonTracking.aggregate({
                _sum: { carbonKg: true }
            })
        ]);
        return {
            inventory: {
                totalProducts,
                totalWarehouses,
                lowStockItems
            },
            operations: {
                pendingOrders,
                activeTransfers
            },
            sustainability: {
                totalCarbonFootprint: totalSustainability._sum.carbonKg || 0
            }
        };
    }
}
exports.AnalyticsService = AnalyticsService;
