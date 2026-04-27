"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingService = void 0;
const db_1 = require("../lib/db");
class SettingService {
    /**
     * Get all settings grouped by category
     */
    async getAllSettings() {
        const settings = await db_1.prisma.systemSetting.findMany({
            orderBy: { category: 'asc' },
            include: {
                updatedBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        // Group by category
        return settings.reduce((acc, setting) => {
            const category = setting.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(setting);
            return acc;
        }, {});
    }
    /**
     * Get setting by key
     */
    async getSettingByKey(key) {
        return db_1.prisma.systemSetting.findUnique({
            where: { key }
        });
    }
    /**
     * Update or create a setting
     */
    async updateSetting(key, value, userId, category = "GENERAL", description) {
        return db_1.prisma.systemSetting.upsert({
            where: { key },
            update: {
                value,
                updatedById: userId,
                updatedAt: new Date()
            },
            create: {
                key,
                value,
                category,
                description,
                updatedById: userId
            }
        });
    }
    /**
     * Bulk update settings
     */
    async bulkUpdateSettings(settings, userId) {
        const updates = settings.map(setting => db_1.prisma.systemSetting.update({
            where: { key: setting.key },
            data: {
                value: setting.value,
                updatedById: userId
            }
        }));
        return Promise.all(updates);
    }
}
exports.SettingService = SettingService;
