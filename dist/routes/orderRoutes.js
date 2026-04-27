"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const orderControllers_1 = __importDefault(require("../controllers/orderControllers"));
const orderController = new orderControllers_1.default();
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
exports.default = router;
