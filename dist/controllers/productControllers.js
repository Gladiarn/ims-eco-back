"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const productServices_1 = __importDefault(require("../services/productServices"));
const productService = new productServices_1.default();
class ProductController {
    // POST search products with pagination
    searchProducts = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "createdAt", order: "desc" } } = req.body;
            const result = await productService.searchProductsService({
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET product by ID (single record)
    getProductById = async (req, res) => {
        try {
            const id = req.params.id;
            const product = await productService.getProductByIdService(id);
            res.json({ success: true, data: product });
        }
        catch (error) {
            if (error.message === "Product not found") {
                res.status(404).json({ success: false, error: error.message });
            }
            else {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    };
    // POST search low stock products
    searchLowStockProducts = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "totalAvailable", order: "asc" }, threshold } = req.body;
            const result = await productService.searchLowStockProductsService({
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort,
                threshold: threshold ? Number(threshold) : undefined
            });
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST search products by category
    searchProductsByCategory = async (req, res) => {
        try {
            const categoryId = req.params.categoryId;
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "name", order: "asc" } } = req.body;
            const result = await productService.searchProductsByCategoryService(categoryId, {
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST create/update product (upsert)
    upsertProduct = async (req, res) => {
        try {
            const product = await productService.upsertProductService(req.body);
            res.status(201).json({ success: true, data: product });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // DELETE product
    deleteProduct = async (req, res) => {
        try {
            const id = req.params.id;
            await productService.deleteProductService(id);
            res.json({ success: true, message: "Product deleted successfully" });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // POST bulk products update
    bulkUpdateProducts = async (req, res) => {
        try {
            const updates = req.body.updates;
            const results = await productService.bulkUpdateProductsService(updates);
            res.json({ success: true, data: results });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // GET product inventory across warehouses
    getProductInventory = async (req, res) => {
        try {
            const productId = req.params.productId;
            const result = await productService.getProductInventoryService(productId);
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET product statistics (dashboard stats)
    getProductStatistics = async (req, res) => {
        try {
            const statistics = await productService.getProductStatisticsService();
            res.json({ success: true, data: statistics });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    getProductsDashboardSummary = async (req, res) => {
        try {
            const summary = await productService.getProductsDashboardSummaryService();
            res.json({ success: true, data: summary });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET product analytics
    getProductAnalytics = async (req, res) => {
        try {
            const { filters = {} } = req.body;
            const analytics = await productService.getProductAnalyticsService(filters);
            res.json({ success: true, data: analytics });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET product turnover analytics
    getProductTurnover = async (req, res) => {
        try {
            const { period = "month" } = req.query;
            const turnover = await productService.getProductTurnoverService(period);
            res.json({ success: true, data: turnover });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET products by warehouse (for warehouse-view)
    getProductsByWarehouse = async (req, res) => {
        try {
            const warehouseId = req.params.warehouseId;
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "product.name", order: "asc" } } = req.body;
            const result = await productService.getProductsByWarehouseService(warehouseId, {
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.default = ProductController;
