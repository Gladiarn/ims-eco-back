"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const orderServices_1 = __importDefault(require("../services/orderServices"));
const orderService = new orderServices_1.default();
class OrderController {
    // POST search orders with pagination
    searchOrders = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "orderDate", order: "desc" } } = req.body;
            // ✅ FIXED: Method name matches service
            const result = await orderService.searchOrdersService({
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET order by ID
    getOrderById = async (req, res) => {
        try {
            const id = req.params.id;
            // ✅ FIXED: Method name matches service
            const order = await orderService.getOrderByIdService(id);
            if (!order) {
                return res.status(404).json({ success: false, error: "Order not found" });
            }
            res.json({ success: true, data: order });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST create order
    createOrder = async (req, res) => {
        try {
            // ✅ FIXED: Method name matches service
            const order = await orderService.createOrderService(req.body);
            res.status(201).json({ success: true, data: order });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // PUT update order
    updateOrder = async (req, res) => {
        try {
            const id = req.params.id;
            // ✅ FIXED: Method name matches service
            const order = await orderService.updateOrderService(id, req.body);
            res.json({ success: true, data: order });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // POST search orders by status
    searchOrdersByStatus = async (req, res) => {
        try {
            const status = req.params.status;
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "orderDate", order: "desc" } } = req.body;
            // ✅ FIXED: Method name matches service
            const result = await orderService.searchOrdersByStatusService(status, {
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST search orders to fulfill (NEW, PROCESSING, PICKING)
    searchOrdersToFulfill = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "orderDate", order: "asc" } } = req.body;
            // ✅ FIXED: Method name matches service
            const result = await orderService.searchOrdersToFulfillService({
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET order statistics
    getOrderStatistics = async (req, res) => {
        try {
            // ✅ FIXED: Method name matches service
            const statistics = await orderService.getOrderStatisticsService();
            res.json({ success: true, data: statistics });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.default = OrderController;
