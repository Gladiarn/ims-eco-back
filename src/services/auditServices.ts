import { prisma } from "../lib/db";
import { Prisma } from "../../generated/prisma";

export class AuditService {
  /**
   * Search and filter audit logs with pagination
   */
  async searchAuditLogs(query: any) {
    const { search, currentPage = 1, limit = 20, filters = {}, sort = {} } = query;
    const skip = (currentPage - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (search) {
      where.OR = [
        { userEmail: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.dateFrom || filters.dateTo) {
      where.timestamp = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      };
    }

    const sortField = sort.field || 'timestamp';
    const sortOrder = sort.order || 'desc';

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
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
      prisma.auditLog.count({ where }),
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
  async createAuditLog(logData: any) {
    return prisma.auditLog.create({
      data: {
        userId: logData.userId,
        userEmail: logData.userEmail,
        action: logData.action,
        entityType: logData.entityType,
        entityId: logData.entityId,
        oldValues: logData.oldValues || Prisma.JsonNull,
        newValues: logData.newValues || Prisma.JsonNull,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
      },
    });
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: true
      }
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  async getLogsByEntity(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId
      },
      orderBy: { timestamp: 'desc' }
    });
  }
}
