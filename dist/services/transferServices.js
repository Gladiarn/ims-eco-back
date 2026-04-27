"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../lib/db");
class TransferServices {
    // MAIN SEARCH METHOD with pagination
    searchTransfersService = async (params) => {
        const { search, currentPage, limit, filters } = params;
        const sort = params.sort || { field: "requestDate", order: "desc" };
        const skip = (currentPage - 1) * limit;
        // Build WHERE clause
        const where = {};
        // Search across transfer fields
        if (search) {
            where.OR = [
                { transferNumber: { contains: search, mode: "insensitive" } },
                { notes: { contains: search, mode: "insensitive" } },
                {
                    sourceWarehouse: {
                        name: { contains: search, mode: "insensitive" }
                    }
                },
                {
                    destWarehouse: {
                        name: { contains: search, mode: "insensitive" }
                    }
                }
            ];
        }
        // Apply filters
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.sourceWarehouseId) {
            where.sourceWarehouseId = filters.sourceWarehouseId;
        }
        if (filters.destWarehouseId) {
            where.destWarehouseId = filters.destWarehouseId;
        }
        if (filters.requestedById) {
            where.requestedById = filters.requestedById;
        }
        if (filters.dateFrom && filters.dateTo) {
            where.requestDate = {
                gte: new Date(filters.dateFrom),
                lte: new Date(filters.dateTo)
            };
        }
        // Build ORDER BY
        const orderBy = {};
        if (sort && sort.field) {
            if (sort.field.includes(".")) {
                const [relation, field] = sort.field.split(".");
                orderBy[relation] = { [field]: sort.order };
            }
            else {
                orderBy[sort.field] = sort.order;
            }
        }
        else {
            orderBy.requestDate = "desc";
        }
        // Get data and count
        const [data, total] = await Promise.all([
            db_1.prisma.transfer.findMany({
                where,
                include: {
                    sourceWarehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    destWarehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    requestedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true
                                }
                            }
                        },
                        take: 5
                    },
                    _count: {
                        select: {
                            items: true
                        }
                    }
                },
                orderBy,
                skip,
                take: limit,
            }),
            db_1.prisma.transfer.count({ where }),
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
    // GET transfer by ID (single record)
    getTransferByIdService = async (id) => {
        const transfer = await db_1.prisma.transfer.findUnique({
            where: { id },
            include: {
                sourceWarehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        address: true,
                        city: true,
                        country: true
                    }
                },
                destWarehouse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        address: true,
                        city: true,
                        country: true
                    }
                },
                requestedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                },
                items: {
                    include: {
                        product: {
                            include: {
                                category: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        items: true
                    }
                }
            }
        });
        if (!transfer) {
            throw new Error("Transfer not found");
        }
        return transfer;
    };
    // GET transfers by warehouse ID
    getTransfersByWarehouseService = async (warehouseId, params) => {
        const { search, currentPage, limit, filters } = params;
        const sort = params.sort || { field: "requestDate", order: "desc" };
        const skip = (currentPage - 1) * limit;
        const where = {
            OR: [
                { sourceWarehouseId: warehouseId },
                { destWarehouseId: warehouseId }
            ]
        };
        if (search) {
            where.AND = where.AND || [];
            where.AND.push({
                OR: [
                    { transferNumber: { contains: search, mode: "insensitive" } },
                    { notes: { contains: search, mode: "insensitive" } }
                ]
            });
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.type === "outgoing") {
            where.sourceWarehouseId = warehouseId;
            delete where.OR;
        }
        else if (filters.type === "incoming") {
            where.destWarehouseId = warehouseId;
            delete where.OR;
        }
        const orderBy = {};
        if (sort && sort.field) {
            if (sort.field.includes(".")) {
                const [relation, field] = sort.field.split(".");
                orderBy[relation] = { [field]: sort.order };
            }
            else {
                orderBy[sort.field] = sort.order;
            }
        }
        else {
            orderBy.requestDate = "desc";
        }
        const [data, total] = await Promise.all([
            db_1.prisma.transfer.findMany({
                where,
                include: {
                    sourceWarehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    destWarehouse: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    requestedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    _count: {
                        select: {
                            items: true
                        }
                    }
                },
                orderBy,
                skip,
                take: limit,
            }),
            db_1.prisma.transfer.count({ where }),
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
    // CREATE transfer
    createTransferService = async (data) => {
        const { sourceWarehouseId, destinationWarehouseId, requestedById, items, notes, estimatedArrival } = data;
        // Validate required fields
        if (!sourceWarehouseId) {
            throw new Error("Source warehouse is required");
        }
        if (!destinationWarehouseId) {
            throw new Error("Destination warehouse is required");
        }
        if (sourceWarehouseId === destinationWarehouseId) {
            throw new Error("Source and destination warehouses cannot be the same");
        }
        if (!requestedById) {
            throw new Error("Requested by user is required");
        }
        if (!items || items.length === 0) {
            throw new Error("Transfer must contain at least one item");
        }
        // Validate warehouses exist
        const [sourceWarehouse, destinationWarehouse] = await Promise.all([
            db_1.prisma.warehouse.findUnique({ where: { id: sourceWarehouseId } }),
            db_1.prisma.warehouse.findUnique({ where: { id: destinationWarehouseId } })
        ]);
        if (!sourceWarehouse) {
            throw new Error("Source warehouse not found");
        }
        if (!destinationWarehouse) {
            throw new Error("Destination warehouse not found");
        }
        // Validate user exists
        const user = await db_1.prisma.user.findUnique({ where: { id: requestedById } });
        if (!user) {
            throw new Error("Requested by user not found");
        }
        // Generate transfer number
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const transferCount = await db_1.prisma.transfer.count({
            where: {
                requestDate: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`)
                }
            }
        });
        const transferNumber = `TRF-${year}${month}-${String(transferCount + 1).padStart(5, '0')}`;
        // Check stock availability for each item
        for (const item of items) {
            const inventory = await db_1.prisma.inventory.findFirst({
                where: {
                    productId: item.productId,
                    warehouseId: sourceWarehouseId
                }
            });
            if (!inventory) {
                throw new Error(`Product ${item.productId} not available in source warehouse`);
            }
            if (inventory.quantity < item.quantity) {
                throw new Error(`Insufficient stock for product ${item.productId}. Available: ${inventory.quantity}, Requested: ${item.quantity}`);
            }
        }
        // Create transfer with items in a transaction
        return await db_1.prisma.$transaction(async (tx) => {
            // Create the transfer
            const transfer = await tx.transfer.create({
                data: {
                    transferNumber,
                    sourceWarehouseId,
                    destWarehouseId: destinationWarehouseId,
                    requestedById,
                    notes,
                    estimatedArrival: estimatedArrival || null,
                    status: "PENDING",
                    requestDate: new Date()
                }
            });
            // Create transfer items
            const createdItems = [];
            for (const item of items) {
                const transferItem = await tx.transferItem.create({
                    data: {
                        transferId: transfer.id,
                        productId: item.productId,
                        quantity: item.quantity
                    },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true
                            }
                        }
                    }
                });
                createdItems.push(transferItem);
            }
            return {
                ...transfer,
                items: createdItems
            };
        });
    };
    // UPDATE transfer
    updateTransferService = async (id, data) => {
        const existingTransfer = await db_1.prisma.transfer.findUnique({
            where: { id },
            include: {
                items: true
            }
        });
        if (!existingTransfer) {
            throw new Error("Transfer not found");
        }
        if (["COMPLETED", "CANCELLED"].includes(existingTransfer.status)) {
            throw new Error(`Cannot update a ${existingTransfer.status.toLowerCase()} transfer`);
        }
        if (data.sourceWarehouseId || data.destinationWarehouseId) {
            const sourceId = data.sourceWarehouseId || existingTransfer.sourceWarehouseId;
            const destId = data.destinationWarehouseId || existingTransfer.destWarehouseId;
            if (sourceId === destId) {
                throw new Error("Source and destination warehouses cannot be the same");
            }
        }
        const updatedTransfer = await db_1.prisma.transfer.update({
            where: { id },
            data: {
                notes: data.notes !== undefined ? data.notes : existingTransfer.notes,
                estimatedArrival: data.estimatedArrival !== undefined
                    ? new Date(data.estimatedArrival)
                    : existingTransfer.estimatedArrival,
                status: data.status || existingTransfer.status
            },
            include: {
                sourceWarehouse: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                destWarehouse: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        return updatedTransfer;
    };
    // UPDATE transfer status
    updateTransferStatusService = async (id, status, additionalData) => {
        const transfer = await db_1.prisma.transfer.findUnique({
            where: { id }
        });
        if (!transfer) {
            throw new Error("Transfer not found");
        }
        const updateData = { status };
        if (status === "COMPLETED") {
            updateData.completedAt = new Date();
        }
        return await db_1.prisma.transfer.update({
            where: { id },
            data: updateData,
            include: {
                sourceWarehouse: true,
                destWarehouse: true,
                requestedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
    };
    // COMPLETE transfer (execute the transfer)
    completeTransferService = async (id, completedBy) => {
        const transfer = await db_1.prisma.transfer.findUnique({
            where: { id },
            include: {
                items: true
            }
        });
        if (!transfer) {
            throw new Error("Transfer not found");
        }
        if (transfer.status !== "PENDING") {
            throw new Error("Transfer must be pending before completion");
        }
        // Validate completer exists
        const completer = await db_1.prisma.user.findUnique({ where: { id: completedBy } });
        if (!completer) {
            throw new Error("Completer not found");
        }
        // Execute transfer in a transaction
        return await db_1.prisma.$transaction(async (tx) => {
            for (const item of transfer.items) {
                // Remove from source warehouse
                await tx.inventory.upsert({
                    where: {
                        warehouseId_productId: {
                            warehouseId: transfer.sourceWarehouseId,
                            productId: item.productId
                        }
                    },
                    update: {
                        quantity: {
                            decrement: item.quantity
                        },
                        lastUpdated: new Date()
                    },
                    create: {
                        warehouseId: transfer.sourceWarehouseId,
                        productId: item.productId,
                        quantity: -item.quantity,
                        available: 0,
                        reserved: 0,
                        reorderStatus: "OK"
                    }
                });
                // Add to destination warehouse
                await tx.inventory.upsert({
                    where: {
                        warehouseId_productId: {
                            warehouseId: transfer.destWarehouseId,
                            productId: item.productId
                        }
                    },
                    update: {
                        quantity: {
                            increment: item.quantity
                        },
                        lastUpdated: new Date()
                    },
                    create: {
                        warehouseId: transfer.destWarehouseId,
                        productId: item.productId,
                        quantity: item.quantity,
                        available: item.quantity,
                        reserved: 0,
                        reorderStatus: "OK"
                    }
                });
            }
            const updatedTransfer = await tx.transfer.update({
                where: { id },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date()
                },
                include: {
                    sourceWarehouse: true,
                    destWarehouse: true,
                    requestedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });
            return updatedTransfer;
        });
    };
    // DELETE transfer (only if pending)
    deleteTransferService = async (id) => {
        const transfer = await db_1.prisma.transfer.findUnique({
            where: { id }
        });
        if (!transfer) {
            throw new Error("Transfer not found");
        }
        if (transfer.status !== "PENDING") {
            throw new Error(`Cannot delete a ${transfer.status.toLowerCase()} transfer`);
        }
        await db_1.prisma.$transaction(async (tx) => {
            // Delete transfer items first
            await tx.transferItem.deleteMany({
                where: { transferId: id }
            });
            // Delete the transfer
            await tx.transfer.delete({
                where: { id }
            });
        });
        return { message: "Transfer deleted successfully" };
    };
    // GET transfer statistics
    getTransferStatisticsService = async () => {
        const transfers = await db_1.prisma.transfer.findMany({
            include: {
                sourceWarehouse: true,
                destWarehouse: true,
                items: true
            }
        });
        const totalTransfers = transfers.length;
        const pendingTransfers = transfers.filter(t => t.status === "PENDING").length;
        const inTransitTransfers = transfers.filter(t => t.status === "IN_TRANSIT").length;
        const completedTransfers = transfers.filter(t => t.status === "COMPLETED").length;
        const cancelledTransfers = transfers.filter(t => t.status === "CANCELLED").length;
        const completedTransfersWithTime = transfers.filter(t => t.status === "COMPLETED" && t.requestDate && t.completedAt);
        const totalTransferTimeHours = completedTransfersWithTime.reduce((sum, t) => {
            const timeDiff = t.completedAt.getTime() - t.requestDate.getTime();
            return sum + (timeDiff / (1000 * 60 * 60));
        }, 0);
        const totalItemsTransferred = transfers.reduce((sum, t) => {
            return sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);
        const sourceWarehouseMap = new Map();
        const destWarehouseMap = new Map();
        transfers.forEach(transfer => {
            // Source warehouses
            const sourceKey = transfer.sourceWarehouseId;
            if (!sourceWarehouseMap.has(sourceKey)) {
                sourceWarehouseMap.set(sourceKey, {
                    warehouseId: transfer.sourceWarehouseId,
                    warehouseName: transfer.sourceWarehouse?.name || "Unknown",
                    transferCount: 0,
                    totalItems: 0
                });
            }
            const sourceData = sourceWarehouseMap.get(sourceKey);
            sourceData.transferCount++;
            sourceData.totalItems += transfer.items.reduce((sum, item) => sum + item.quantity, 0);
            // Destination warehouses
            const destKey = transfer.destWarehouseId;
            if (!destWarehouseMap.has(destKey)) {
                destWarehouseMap.set(destKey, {
                    warehouseId: transfer.destWarehouseId,
                    warehouseName: transfer.destWarehouse?.name || "Unknown",
                    transferCount: 0,
                    totalItems: 0
                });
            }
            const destData = destWarehouseMap.get(destKey);
            destData.transferCount++;
            destData.totalItems += transfer.items.reduce((sum, item) => sum + item.quantity, 0);
        });
        const topSourceWarehouses = Array.from(sourceWarehouseMap.values())
            .sort((a, b) => b.transferCount - a.transferCount)
            .slice(0, 5);
        const topDestinationWarehouses = Array.from(destWarehouseMap.values())
            .sort((a, b) => b.transferCount - a.transferCount)
            .slice(0, 5);
        return {
            counts: {
                totalTransfers,
                pendingTransfers,
                inTransitTransfers,
                completedTransfers,
                cancelledTransfers
            },
            metrics: {
                averageTransferTimeHours: completedTransfersWithTime.length > 0
                    ? totalTransferTimeHours / completedTransfersWithTime.length
                    : 0,
                totalItemsTransferred,
                averageItemsPerTransfer: totalTransfers > 0
                    ? totalItemsTransferred / totalTransfers
                    : 0
            },
            topSourceWarehouses,
            topDestinationWarehouses
        };
    };
}
exports.default = TransferServices;
