"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/inventoryRoutes.ts
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const inventoryControllers_1 = __importDefault(require("../controllers/inventoryControllers"));
const inventoryController = new inventoryControllers_1.default();
// =================== SEARCH & QUERY OPERATIONS ===================
// POST search inventory with pagination/filters
router.post("/search", inventoryController.searchInventory);
// POST search low stock inventory
router.post("/low-stock/search", inventoryController.searchLowStockInventory);
// POST search inventory by warehouse with pagination
router.post("/warehouse/:warehouseId/search", inventoryController.searchInventoryByWarehouse);
// POST search inventory by product with pagination
router.post("/product/:productId/search", inventoryController.searchInventoryByProduct);
// =================== SINGLE RECORD OPERATIONS ===================
// GET inventory by ID
router.get("/:id", inventoryController.getInventoryById);
// POST create new inventory record (or update if exists)
router.post("/", inventoryController.upsertInventory);
// PUT update inventory quantity (with action tracking)
router.put("/:id/quantity", inventoryController.updateInventoryQuantity);
// DELETE inventory record
router.delete("/:id", inventoryController.deleteInventory);
// =================== BULK & BATCH OPERATIONS ===================
// POST bulk update multiple inventory records
router.post("/bulk-update", inventoryController.bulkUpdateInventory);
// =================== REPORTS & ANALYTICS ===================
// GET inventory summary for dashboard
router.get("/summary/dashboard", inventoryController.getInventorySummary);
// POST inventory value report with filters
router.post("/reports/value", inventoryController.getInventoryValueReport);
exports.default = router;
