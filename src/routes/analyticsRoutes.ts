import express from "express";
const router = express.Router();
import AnalyticsController from "../controllers/analyticsControllers";

const analyticsController = new AnalyticsController();

// GET inventory valuation
router.get("/valuation", analyticsController.getValuation);

// GET stock turnover
router.get("/turnover", analyticsController.getTurnover);

// GET dashboard KPIs
router.get("/kpis", analyticsController.getKPIs);

export default router;
