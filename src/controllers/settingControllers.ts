import { Request, Response } from "express";
import { SettingService } from "../services/settingServices";

const settingService = new SettingService();

export default class SettingController {
  /**
   * Get all settings
   */
  async getAllSettings(req: Request, res: Response) {
    try {
      const settings = await settingService.getAllSettings();
      res.json({ success: true, data: settings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get setting by key
   */
  async getSettingByKey(req: Request, res: Response) {
    try {
      const setting = await settingService.getSettingByKey(req.params.key as string);
      if (!setting) {
        return res.status(404).json({ success: false, message: "Setting not found" });
      }
      res.json({ success: true, data: setting });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update setting
   */
  async updateSetting(req: Request, res: Response) {
    try {
      const { key, value, category, description } = req.body;
      // @ts-ignore - userId from auth middleware
      const userId = req.user?.id || null;
      
      const setting = await settingService.updateSetting(key, value, userId, category, description);
      res.json({ success: true, data: setting });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Bulk update settings
   */
  async bulkUpdateSettings(req: Request, res: Response) {
    try {
      const { settings } = req.body;
      // @ts-ignore - userId from auth middleware
      const userId = req.user?.id || null;
      
      await settingService.bulkUpdateSettings(settings, userId);
      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
