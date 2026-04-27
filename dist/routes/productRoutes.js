"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const productControllers_1 = __importDefault(require("../controllers/productControllers"));
const productController = new productControllers_1.default();
// =================== SEARCH & QUERY OPERATIONS ===================
// POST search products with pagination/filters
router.post("/search", productController.searchProducts);
// POST search low stock products
router.post("/low-stock/search", productController.searchLowStockProducts);
// POST search products by category with pagination
router.post("/category/:categoryId/search", productController.searchProductsByCategory);
// =================== SINGLE RECORD OPERATIONS ===================
// GET product by ID
router.get("/:id", productController.getProductById);
// POST create/update product (upsert)
router.post("/", productController.upsertProduct);
// DELETE product
router.delete("/:id", productController.deleteProduct);
// =================== INVENTORY RELATED ===================
// GET product inventory across all warehouses
router.get("/:productId/inventory", productController.getProductInventory);
// =================== BULK OPERATIONS ===================
// POST bulk update multiple products
router.post("/bulk-update", productController.bulkUpdateProducts);
// =================== STATISTICS ===================
// GET product statistics for dashboard
router.get("/statistics/dashboard", productController.getProductStatistics);
// =================== DASHBOARD & ANALYTICS ===================
// GET products dashboard summary
router.get("/summary/dashboard", productController.getProductsDashboardSummary);
// POST product analytics with filters
router.post("/analytics", productController.getProductAnalytics);
// GET product turnover analytics
router.get("/analytics/turnover", productController.getProductTurnover);
// =================== WAREHOUSE VIEW ===================
// POST products by warehouse (for warehouse-view page)
router.post("/warehouse/:warehouseId/view", productController.getProductsByWarehouse);
exports.default = router;
