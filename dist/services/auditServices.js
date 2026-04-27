"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const db_1 = require("../lib/db");
const prisma_1 = require("../../generated/prisma");
class AuditService {
    /**
     * Search and filter audit logs with pagination
     */
    async searchAuditLogs(query) {
        const { search, currentPage = 1, limit = 20, filters = {}, sort = {} } = query;
        const skip = (currentPage - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { userEmail: { contains: search, mode: 'insensitive' } },
                { action: { contains: search, mode: 'insensitive' } },
                { entityType: { contains: search, mode: 'insensitive' } },
                { entityId: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.action)
            where.action = filters.action;
        if (filters.entityType)
            where.entityType = filters.entityType;
        if (filters.dateFrom || filters.dateTo) {
            where.timestamp = {
                gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
                lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
            };
        }
        const sortField = sort.field || 'timestamp';
        const sortOrder = sort.order || 'desc';
        const [logs, total] = await Promise.all([
            db_1.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            }),
            db_1.prisma.auditLog.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: logs,
            pagination: {
                currentPage,
                limit,
                total,
                totalPages,
                hasNext: currentPage < totalPages,
                hasPrev: currentPage > 1,
            },
        };
    }
    /**
     * Create an audit log entry
     */
    async createAuditLog(logData) {
        return db_1.prisma.auditLog.create({
            data: {
                userId: logData.userId,
                userEmail: logData.userEmail,
                action: logData.action,
                entityType: logData.entityType,
                entityId: logData.entityId,
                oldValues: logData.oldValues || prisma_1.Prisma.JsonNull,
                newValues: logData.newValues || prisma_1.Prisma.JsonNull,
                ipAddress: logData.ipAddress,
                userAgent: logData.userAgent,
            },
        });
    }
    /**
     * Get audit log by ID
     */
    async getAuditLogById(id) {
        return db_1.prisma.auditLog.findUnique({
            where: { id },
            include: {
                user: true
            }
        });
    }
    /**
     * Get audit logs for a specific entity
     */
    async getLogsByEntity(entityType, entityId) {
        return db_1.prisma.auditLog.findMany({
            where: {
                entityType,
                entityId
            },
            orderBy: { timestamp: 'desc' }
        });
    }
}
exports.AuditService = AuditService;
