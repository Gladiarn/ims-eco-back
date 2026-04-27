"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../lib/db");
class SustainabilityServices {
    // ==================== CARBON TRACKING METHODS ====================
    // Search carbon tracking records
    searchCarbonTrackingService = async (params) => {
        const { search, currentPage, limit, filters } = params;
        const sort = params.sort || { field: "recordedAt", order: "desc" };
        const skip = (currentPage - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { scope: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
                { sourceType: { contains: search, mode: "insensitive" } },
                { notes: { contains: search, mode: "insensitive" } },
                {
                    warehouse: {
                        name: { contains: search, mode: "insensitive" }
                    }
                }
            ];
        }
        if (filters.scope)
            where.scope = filters.scope;
        if (filters.category)
            where.category = filters.category;
        if (filters.sourceType)
            where.sourceType = filters.sourceType;
        if (filters.sourceId)
            where.sourceId = filters.sourceId;
        if (filters.measurementPeriod)
            where.measurementPeriod = filters.measurementPeriod;
        if (filters.dateFrom && filters.dateTo) {
            where.recordedAt = {
                gte: new Date(filters.dateFrom),
                lte: new Date(filters.dateTo)
            };
        }
        const orderBy = {};
        if (sort.field) {
            if (sort.field.includes(".")) {
                const [relation, field] = sort.field.split(".");
                orderBy[relation] = { [field]: sort.order };
            }
            else {
                orderBy[sort.field] = sort.order;
            }
        }
        const [data, total] = await Promise.all([
            db_1.prisma.carbonTracking.findMany({
                where,
                include: {
                    warehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    }
                },
                orderBy,
                skip,
                take: limit,
            }),
            db_1.prisma.carbonTracking.count({ where }),
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
    // Get carbon tracking by ID
    getCarbonTrackingByIdService = async (id) => {
        const record = await db_1.prisma.carbonTracking.findUnique({
            where: { id },
            include: {
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        location: true
                    }
                }
            }
        });
        if (!record) {
            throw new Error("Carbon tracking record not found");
        }
        return record;
    };
    // Create carbon tracking record
    createCarbonTrackingService = async (data) => {
        const { scope, category, carbonKg, sourceId, sourceType, measurementPeriod, calculationMethod = "ESTIMATED", notes } = data;
        if (!scope)
            throw new Error("Scope is required");
        if (!category)
            throw new Error("Category is required");
        if (carbonKg === undefined || carbonKg < 0)
            throw new Error("Valid carbon kg is required");
        if (!measurementPeriod)
            throw new Error("Measurement period is required");
        // If sourceId is provided and sourceType is WAREHOUSE, validate warehouse exists
        if (sourceId && sourceType === "WAREHOUSE") {
            const warehouse = await db_1.prisma.warehouse.findUnique({
                where: { id: sourceId }
            });
            if (!warehouse)
                throw new Error("Warehouse not found");
        }
        return await db_1.prisma.carbonTracking.create({
            data: {
                scope,
                category,
                carbonKg,
                sourceId,
                sourceType,
                measurementPeriod,
                calculationMethod,
                notes,
                recordedAt: new Date()
            },
            include: {
                warehouse: sourceType === "WAREHOUSE" ? {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                } : undefined
            }
        });
    };
    // Update carbon tracking
    updateCarbonTrackingService = async (id, data) => {
        const existing = await db_1.prisma.carbonTracking.findUnique({
            where: { id }
        });
        if (!existing) {
            throw new Error("Carbon tracking record not found");
        }
        return await db_1.prisma.carbonTracking.update({
            where: { id },
            data: {
                carbonKg: data.carbonKg !== undefined ? data.carbonKg : existing.carbonKg,
                calculationMethod: data.calculationMethod || existing.calculationMethod,
                notes: data.notes !== undefined ? data.notes : existing.notes
            }
        });
    };
    // Delete carbon tracking
    deleteCarbonTrackingService = async (id) => {
        const existing = await db_1.prisma.carbonTracking.findUnique({
            where: { id }
        });
        if (!existing) {
            throw new Error("Carbon tracking record not found");
        }
        await db_1.prisma.carbonTracking.delete({
            where: { id }
        });
        return { message: "Carbon tracking record deleted successfully" };
    };
    // ==================== RECYCLING RECORDS METHODS ====================
    // Search recycling records
    searchRecyclingRecordsService = async (params) => {
        const { search, currentPage, limit, filters } = params;
        const sort = params.sort || { field: "processedDate", order: "desc" };
        const skip = (currentPage - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { recyclingType: { contains: search, mode: "insensitive" } },
                { method: { contains: search, mode: "insensitive" } },
                {
                    processingWarehouse: {
                        name: { contains: search, mode: "insensitive" }
                    }
                },
                {
                    product: {
                        name: { contains: search, mode: "insensitive" }
                    }
                },
                {
                    product: {
                        sku: { contains: search, mode: "insensitive" }
                    }
                }
            ];
        }
        if (filters.processingWarehouseId)
            where.processingWarehouseId = filters.processingWarehouseId;
        if (filters.productId)
            where.productId = filters.productId;
        if (filters.recyclingType)
            where.recyclingType = filters.recyclingType;
        if (filters.method)
            where.method = filters.method;
        if (filters.processedById)
            where.processedById = filters.processedById;
        if (filters.dateFrom && filters.dateTo) {
            where.processedDate = {
                gte: new Date(filters.dateFrom),
                lte: new Date(filters.dateTo)
            };
        }
        const orderBy = {};
        if (sort.field) {
            if (sort.field.includes(".")) {
                const [relation, field] = sort.field.split(".");
                orderBy[relation] = { [field]: sort.order };
            }
            else {
                orderBy[sort.field] = sort.order;
            }
        }
        const [data, total] = await Promise.all([
            db_1.prisma.recyclingRecord.findMany({
                where,
                include: {
                    processingWarehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                            materialType: true
                        }
                    },
                    processedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy,
                skip,
                take: limit,
            }),
            db_1.prisma.recyclingRecord.count({ where }),
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
    // Get recycling record by ID
    getRecyclingRecordByIdService = async (id) => {
        const record = await db_1.prisma.recyclingRecord.findUnique({
            where: { id },
            include: {
                processingWarehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        location: true
                    }
                },
                product: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                processedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        if (!record) {
            throw new Error("Recycling record not found");
        }
        return record;
    };
    // Create recycling record
    createRecyclingRecordService = async (data) => {
        const { processingWarehouseId, productId, quantity, weightKg, recyclingType, method, carbonSavedKg = 0, landfillDivertedKg = 0, processedById
        // No notes field
         } = data;
        if (!processingWarehouseId)
            throw new Error("Processing warehouse ID is required");
        if (!productId)
            throw new Error("Product ID is required");
        if (!quantity || quantity < 0)
            throw new Error("Valid quantity is required");
        if (!recyclingType)
            throw new Error("Recycling type is required");
        if (!method)
            throw new Error("Method is required");
        if (!processedById)
            throw new Error("Processed by user is required");
        // Validate warehouse exists
        const warehouse = await db_1.prisma.warehouse.findUnique({
            where: { id: processingWarehouseId }
        });
        if (!warehouse)
            throw new Error("Processing warehouse not found");
        // Validate product exists
        const product = await db_1.prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product)
            throw new Error("Product not found");
        // Validate user exists
        const user = await db_1.prisma.user.findUnique({
            where: { id: processedById }
        });
        if (!user)
            throw new Error("User not found");
        return await db_1.prisma.recyclingRecord.create({
            data: {
                processingWarehouseId,
                productId,
                quantity,
                weightKg: weightKg || quantity * (product.weight || 1),
                recyclingType,
                method,
                carbonSavedKg,
                landfillDivertedKg,
                processedById,
                processedDate: new Date()
            },
            include: {
                processingWarehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true
                    }
                },
                processedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
    };
    // Update recycling record - FIXED: removed notes field
    updateRecyclingRecordService = async (id, data) => {
        const existing = await db_1.prisma.recyclingRecord.findUnique({
            where: { id }
        });
        if (!existing) {
            throw new Error("Recycling record not found");
        }
        // RecyclingRecord schema doesn't have notes, so only update these fields
        return await db_1.prisma.recyclingRecord.update({
            where: { id },
            data: {
                quantity: data.quantity !== undefined ? data.quantity : existing.quantity,
                weightKg: data.weightKg !== undefined ? data.weightKg : existing.weightKg,
                carbonSavedKg: data.carbonSavedKg !== undefined ? data.carbonSavedKg : existing.carbonSavedKg,
                landfillDivertedKg: data.landfillDivertedKg !== undefined ? data.landfillDivertedKg : existing.landfillDivertedKg
                // No notes field in schema
            }
        });
    };
    // Delete recycling record
    deleteRecyclingRecordService = async (id) => {
        const existing = await db_1.prisma.recyclingRecord.findUnique({
            where: { id }
        });
        if (!existing) {
            throw new Error("Recycling record not found");
        }
        await db_1.prisma.recyclingRecord.delete({
            where: { id }
        });
        return { message: "Recycling record deleted successfully" };
    };
    // ==================== MATERIAL FLOW METHODS ====================
    // Search material flows
    searchMaterialFlowsService = async (params) => {
        const { search, currentPage, limit, filters } = params;
        const sort = params.sort || { field: "flowDate", order: "desc" };
        const skip = (currentPage - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { materialType: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
                { sourceType: { contains: search, mode: "insensitive" } },
                { destType: { contains: search, mode: "insensitive" } },
                {
                    warehouse: {
                        name: { contains: search, mode: "insensitive" }
                    }
                }
            ];
        }
        if (filters.materialType)
            where.materialType = filters.materialType;
        if (filters.category)
            where.category = filters.category;
        if (filters.sourceType)
            where.sourceType = filters.sourceType;
        if (filters.sourceId)
            where.sourceId = filters.sourceId;
        if (filters.destType)
            where.destType = filters.destType;
        if (filters.destId)
            where.destId = filters.destId;
        if (filters.dateFrom && filters.dateTo) {
            where.flowDate = {
                gte: new Date(filters.dateFrom),
                lte: new Date(filters.dateTo)
            };
        }
        const orderBy = {};
        if (sort.field) {
            if (sort.field.includes(".")) {
                const [relation, field] = sort.field.split(".");
                orderBy[relation] = { [field]: sort.order };
            }
            else {
                orderBy[sort.field] = sort.order;
            }
        }
        const [data, total] = await Promise.all([
            db_1.prisma.materialFlow.findMany({
                where,
                include: {
                    warehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    }
                },
                orderBy,
                skip,
                take: limit,
            }),
            db_1.prisma.materialFlow.count({ where }),
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
    // Get material flow by ID
    getMaterialFlowByIdService = async (id) => {
        const flow = await db_1.prisma.materialFlow.findUnique({
            where: { id },
            include: {
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        location: true
                    }
                }
            }
        });
        if (!flow) {
            throw new Error("Material flow record not found");
        }
        return flow;
    };
    // Create material flow
    createMaterialFlowService = async (data) => {
        const { materialType, category, quantity, unit, sourceId, sourceType, destId, destType, flowDate
        // No notes field
         } = data;
        if (!materialType)
            throw new Error("Material type is required");
        if (!category)
            throw new Error("Category is required");
        if (!quantity || quantity < 0)
            throw new Error("Valid quantity is required");
        if (!unit)
            throw new Error("Unit is required");
        // If sourceId is provided and sourceType is WAREHOUSE, validate warehouse exists
        if (sourceId && sourceType === "WAREHOUSE") {
            const warehouse = await db_1.prisma.warehouse.findUnique({
                where: { id: sourceId }
            });
            if (!warehouse)
                throw new Error("Source warehouse not found");
        }
        // If destId is provided and destType is WAREHOUSE, validate warehouse exists
        if (destId && destType === "WAREHOUSE") {
            const warehouse = await db_1.prisma.warehouse.findUnique({
                where: { id: destId }
            });
            if (!warehouse)
                throw new Error("Destination warehouse not found");
        }
        return await db_1.prisma.materialFlow.create({
            data: {
                materialType,
                category,
                quantity,
                unit,
                sourceId,
                sourceType,
                destId,
                destType,
                flowDate: flowDate || new Date(),
                recordedAt: new Date()
            },
            include: {
                warehouse: sourceType === "WAREHOUSE" ? {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                } : undefined
            }
        });
    };
    // Update material flow - FIXED: removed notes field
    updateMaterialFlowService = async (id, data) => {
        const existing = await db_1.prisma.materialFlow.findUnique({
            where: { id }
        });
        if (!existing) {
            throw new Error("Material flow record not found");
        }
        // MaterialFlow schema doesn't have notes, so only update quantity if provided
        return await db_1.prisma.materialFlow.update({
            where: { id },
            data: {
                quantity: data.quantity !== undefined ? data.quantity : existing.quantity
                // No notes field in schema
            }
        });
    };
    // Delete material flow
    deleteMaterialFlowService = async (id) => {
        const existing = await db_1.prisma.materialFlow.findUnique({
            where: { id }
        });
        if (!existing) {
            throw new Error("Material flow record not found");
        }
        await db_1.prisma.materialFlow.delete({
            where: { id }
        });
        return { message: "Material flow record deleted successfully" };
    };
    // ==================== DASHBOARD & STATISTICS ====================
    // Get complete sustainability dashboard
    getSustainabilityDashboardService = async () => {
        // Carbon statistics
        const carbonRecords = await db_1.prisma.carbonTracking.findMany();
        const totalCarbonKg = carbonRecords.reduce((sum, r) => sum + r.carbonKg, 0);
        const byScope = {
            scope1: carbonRecords.filter(r => r.scope === "SCOPE_1").reduce((sum, r) => sum + r.carbonKg, 0),
            scope2: carbonRecords.filter(r => r.scope === "SCOPE_2").reduce((sum, r) => sum + r.carbonKg, 0),
            scope3: carbonRecords.filter(r => r.scope === "SCOPE_3").reduce((sum, r) => sum + r.carbonKg, 0)
        };
        const byCategory = {
            transport: carbonRecords.filter(r => r.category === "TRANSPORT").reduce((sum, r) => sum + r.carbonKg, 0),
            energy: carbonRecords.filter(r => r.category === "ENERGY").reduce((sum, r) => sum + r.carbonKg, 0),
            waste: carbonRecords.filter(r => r.category === "WASTE").reduce((sum, r) => sum + r.carbonKg, 0),
            materials: carbonRecords.filter(r => r.category === "MATERIALS").reduce((sum, r) => sum + r.carbonKg, 0)
        };
        const recentTrackings = await db_1.prisma.carbonTracking.findMany({
            take: 5,
            orderBy: { recordedAt: "desc" },
            include: {
                warehouse: {
                    select: { name: true }
                }
            }
        });
        // Recycling statistics
        const recyclingRecords = await db_1.prisma.recyclingRecord.findMany({
            include: {
                product: true
            }
        });
        const totalRecycledKg = recyclingRecords.reduce((sum, r) => sum + (r.weightKg || 0), 0);
        const carbonSavedKg = recyclingRecords.reduce((sum, r) => sum + (r.carbonSavedKg || 0), 0);
        const landfillDivertedKg = recyclingRecords.reduce((sum, r) => sum + (r.landfillDivertedKg || 0), 0);
        const byType = {
            plastic: recyclingRecords.filter(r => r.recyclingType === "PLASTIC").reduce((sum, r) => sum + (r.weightKg || 0), 0),
            paper: recyclingRecords.filter(r => r.recyclingType === "PAPER").reduce((sum, r) => sum + (r.weightKg || 0), 0),
            metal: recyclingRecords.filter(r => r.recyclingType === "METAL").reduce((sum, r) => sum + (r.weightKg || 0), 0),
            electronic: recyclingRecords.filter(r => r.recyclingType === "ELECTRONIC").reduce((sum, r) => sum + (r.weightKg || 0), 0),
            organic: recyclingRecords.filter(r => r.recyclingType === "ORGANIC").reduce((sum, r) => sum + (r.weightKg || 0), 0)
        };
        const recentRecords = await db_1.prisma.recyclingRecord.findMany({
            take: 5,
            orderBy: { processedDate: "desc" },
            include: {
                processingWarehouse: {
                    select: { name: true }
                },
                product: {
                    select: { name: true, sku: true }
                }
            }
        });
        // Material flow statistics
        const materialFlows = await db_1.prisma.materialFlow.findMany();
        const totalInput = materialFlows
            .filter(f => f.category === "INPUT")
            .reduce((sum, f) => sum + f.quantity, 0);
        const totalOutput = materialFlows
            .filter(f => f.category === "OUTPUT")
            .reduce((sum, f) => sum + f.quantity, 0);
        const totalWaste = materialFlows
            .filter(f => f.category === "WASTE")
            .reduce((sum, f) => sum + f.quantity, 0);
        const totalRecycled = materialFlows
            .filter(f => f.category === "RECYCLED")
            .reduce((sum, f) => sum + f.quantity, 0);
        const efficiency = totalInput > 0 ? ((totalOutput - totalWaste) / totalInput) * 100 : 0;
        const recentFlows = await db_1.prisma.materialFlow.findMany({
            take: 5,
            orderBy: { flowDate: "desc" }
        });
        return {
            carbon: {
                totalCarbonKg,
                byScope,
                byCategory,
                recentTrackings
            },
            recycling: {
                totalRecycledKg,
                carbonSavedKg,
                landfillDivertedKg,
                byType,
                recentRecords
            },
            materialFlow: {
                totalInput,
                totalOutput,
                totalWaste,
                totalRecycled,
                efficiency,
                recentFlows
            }
        };
    };
    // Get carbon summary by warehouse
    getCarbonByWarehouseService = async (warehouseId) => {
        const records = await db_1.prisma.carbonTracking.findMany({
            where: { sourceId: warehouseId, sourceType: "WAREHOUSE" }
        });
        return {
            warehouseId,
            totalCarbonKg: records.reduce((sum, r) => sum + r.carbonKg, 0),
            byScope: {
                scope1: records.filter(r => r.scope === "SCOPE_1").reduce((sum, r) => sum + r.carbonKg, 0),
                scope2: records.filter(r => r.scope === "SCOPE_2").reduce((sum, r) => sum + r.carbonKg, 0),
                scope3: records.filter(r => r.scope === "SCOPE_3").reduce((sum, r) => sum + r.carbonKg, 0)
            },
            byCategory: {
                transport: records.filter(r => r.category === "TRANSPORT").reduce((sum, r) => sum + r.carbonKg, 0),
                energy: records.filter(r => r.category === "ENERGY").reduce((sum, r) => sum + r.carbonKg, 0),
                waste: records.filter(r => r.category === "WASTE").reduce((sum, r) => sum + r.carbonKg, 0),
                materials: records.filter(r => r.category === "MATERIALS").reduce((sum, r) => sum + r.carbonKg, 0)
            },
            records
        };
    };
    // Get recycling summary by warehouse
    getRecyclingByWarehouseService = async (warehouseId) => {
        const records = await db_1.prisma.recyclingRecord.findMany({
            where: { processingWarehouseId: warehouseId },
            include: { product: true }
        });
        return {
            warehouseId,
            totalRecycledKg: records.reduce((sum, r) => sum + (r.weightKg || 0), 0),
            carbonSavedKg: records.reduce((sum, r) => sum + (r.carbonSavedKg || 0), 0),
            landfillDivertedKg: records.reduce((sum, r) => sum + (r.landfillDivertedKg || 0), 0),
            byType: {
                plastic: records.filter(r => r.recyclingType === "PLASTIC").reduce((sum, r) => sum + (r.weightKg || 0), 0),
                paper: records.filter(r => r.recyclingType === "PAPER").reduce((sum, r) => sum + (r.weightKg || 0), 0),
                metal: records.filter(r => r.recyclingType === "METAL").reduce((sum, r) => sum + (r.weightKg || 0), 0),
                electronic: records.filter(r => r.recyclingType === "ELECTRONIC").reduce((sum, r) => sum + (r.weightKg || 0), 0),
                organic: records.filter(r => r.recyclingType === "ORGANIC").reduce((sum, r) => sum + (r.weightKg || 0), 0)
            },
            records
        };
    };
}
exports.default = SustainabilityServices;
