// routes/inventoryRoutes.ts
import express from "express";
const router = express.Router();
import InventoryController from "../controllers/inventoryControllers";

const inventoryController = new InventoryController();

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

export default router;