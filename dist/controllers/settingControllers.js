"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const settingServices_1 = require("../services/settingServices");
const settingService = new settingServices_1.SettingService();
class SettingController {
    /**
     * Get all settings
     */
    async getAllSettings(req, res) {
        try {
            const settings = await settingService.getAllSettings();
            res.json({ success: true, data: settings });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get setting by key
     */
    async getSettingByKey(req, res) {
        try {
            const setting = await settingService.getSettingByKey(req.params.key);
            if (!setting) {
                return res.status(404).json({ success: false, message: "Setting not found" });
            }
            res.json({ success: true, data: setting });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Update setting
     */
    async updateSetting(req, res) {
        try {
            const { key, value, category, description } = req.body;
            // @ts-ignore - userId from auth middleware
            const userId = req.user?.id || null;
            const setting = await settingService.updateSetting(key, value, userId, category, description);
            res.json({ success: true, data: setting });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Bulk update settings
     */
    async bulkUpdateSettings(req, res) {
        try {
            const { settings } = req.body;
            // @ts-ignore - userId from auth middleware
            const userId = req.user?.id || null;
            await settingService.bulkUpdateSettings(settings, userId);
            res.json({ success: true, message: "Settings updated successfully" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.default = SettingController;
