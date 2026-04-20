import { Request, Response } from "express";
import { AnalyticsService } from "../services/analyticsServices";

const analyticsService = new AnalyticsService();

export default class AnalyticsController {
  /**
   * Get inventory valuation
   */
  async getValuation(req: Request, res: Response) {
    try {
      const result = await analyticsService.getInventoryValuation();
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get stock turnover
   */
  async getTurnover(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const result = await analyticsService.getStockTurnover(days);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get dashboard KPIs
   */
  async getKPIs(req: Request, res: Response) {
    try {
      const result = await analyticsService.getDashboardKPIs();
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
