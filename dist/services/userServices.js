"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const db_1 = require("../lib/db");
class UserService {
    /**
     * Search and filter users with pagination
     */
    async searchUsers(query) {
        const { search, currentPage = 1, limit = 10, filters = {}, sort = {} } = query;
        const skip = (currentPage - 1) * limit;
        const where = {
            isActive: filters.isActive !== undefined ? filters.isActive : true,
        };
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { department: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (filters.role)
            where.role = filters.role;
        if (filters.department)
            where.department = filters.department;
        const sortField = sort.field || 'createdAt';
        const sortOrder = sort.order || 'desc';
        const [users, total] = await Promise.all([
            db_1.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder },
            }),
            db_1.prisma.user.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: users,
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
     * Get user by ID
     */
    async getUserById(id) {
        return db_1.prisma.user.findUnique({
            where: { id },
            include: {
                managedWarehouses: true,
            },
        });
    }
    /**
     * Get user by Supabase UID
     */
    async getUserBySupabaseUid(supabaseUid) {
        return db_1.prisma.user.findUnique({
            where: { supabaseUid },
        });
    }
    /**
     * Create new user
     */
    async createUser(userData) {
        return db_1.prisma.user.create({
            data: {
                supabaseUid: userData.supabaseUid,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role || 'staff',
                department: userData.department,
                isActive: userData.isActive !== undefined ? userData.isActive : true,
            },
        });
    }
    /**
     * Update user
     */
    async updateUser(id, userData) {
        return db_1.prisma.user.update({
            where: { id },
            data: {
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                department: userData.department,
                isActive: userData.isActive,
                lastLoginAt: userData.lastLoginAt,
            },
        });
    }
    /**
     * Delete user (Soft delete by setting isActive to false)
     */
    async deleteUser(id) {
        return db_1.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
    /**
     * Get all active users for selection
     */
    async getActiveUsers() {
        return db_1.prisma.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
            },
        });
    }
}
exports.UserService = UserService;
