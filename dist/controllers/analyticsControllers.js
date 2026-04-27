"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const analyticsServices_1 = require("../services/analyticsServices");
const analyticsService = new analyticsServices_1.AnalyticsService();
class AnalyticsController {
    /**
     * Get inventory valuation
     */
    async getValuation(req, res) {
        try {
            const result = await analyticsService.getInventoryValuation();
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get stock turnover
     */
    async getTurnover(req, res) {
        try {
            const days = parseInt(req.query.days) || 30;
            const result = await analyticsService.getStockTurnover(days);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get dashboard KPIs
     */
    async getKPIs(req, res) {
        try {
            const result = await analyticsService.getDashboardKPIs();
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.default = AnalyticsController;
