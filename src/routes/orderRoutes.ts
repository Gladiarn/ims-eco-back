import express from "express";
const router = express.Router();
import OrderController from "../controllers/orderControllers";

const orderController = new OrderController();

// =================== SEARCH & QUERY OPERATIONS ===================
// POST search all orders with pagination/filters
router.post("/search", orderController.searchOrders);

// POST search orders by status
router.post("/status/:status/search", orderController.searchOrdersByStatus);

// POST search orders to fulfill (for fulfillment dashboard)
router.post("/fulfill/search", orderController.searchOrdersToFulfill);

// =================== SINGLE RECORD OPERATIONS ===================
// GET order by ID
router.get("/:id", orderController.getOrderById);

// POST create new order
router.post("/", orderController.createOrder);

// PUT update order status/details
router.put("/:id", orderController.updateOrder);

// =================== STATISTICS ===================
// GET order statistics for dashboard
router.get("/statistics/dashboard", orderController.getOrderStatistics);

export default router;