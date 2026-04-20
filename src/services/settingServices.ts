import { prisma } from "../lib/db";

export class SettingService {
  /**
   * Get all settings grouped by category
   */
  async getAllSettings() {
    const settings = await prisma.systemSetting.findMany({
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
    return settings.reduce((acc: any, setting) => {
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
  async getSettingByKey(key: string) {
    return prisma.systemSetting.findUnique({
      where: { key }
    });
  }

  /**
   * Update or create a setting
   */
  async updateSetting(key: string, value: string, userId: string, category: string = "GENERAL", description?: string) {
    return prisma.systemSetting.upsert({
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
  async bulkUpdateSettings(settings: { key: string, value: string }[], userId: string) {
    const updates = settings.map(setting => 
      prisma.systemSetting.update({
        where: { key: setting.key },
        data: {
          value: setting.value,
          updatedById: userId
        }
      })
    );
    return Promise.all(updates);
  }
}
