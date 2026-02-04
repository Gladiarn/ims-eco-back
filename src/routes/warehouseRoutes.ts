import express from "express";
const router = express.Router();
import WarehouseController from "../controllers/warehouseControllers";

const warehouseController = new WarehouseController();

// I'm using POST for search operations allowing complex filters in the body
// POST search warehouses
router.post("/search", warehouseController.searchWarehouses);

// POST search warehouses with low stock
router.post("/reports/low-stock/search", warehouseController.searchWarehousesWithLowStock);

// =================== SINGLE RECORD OPERATIONS ===================
// GET single warehouse by ID
router.get("/:id", warehouseController.getWarehouseById);

// POST create new warehouse
router.post("/", warehouseController.createWarehouse);

// PUT update warehouse
router.put("/:id", warehouseController.updateWarehouse);

// DELETE warehouse
router.delete("/:id", warehouseController.deleteWarehouse);

// GET warehouse inventory summary
router.get("/:id/inventory-summary", warehouseController.getWarehouseInventorySummary);

// GET warehouse statistics
router.get("/:id/stats", warehouseController.getWarehouseStats);

// GET active warehouses (for dropdowns/selects)
router.get("/active/list", warehouseController.getActiveWarehouses);


export default router;