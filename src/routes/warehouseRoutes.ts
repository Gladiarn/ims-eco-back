import express from "express";
const router = express.Router();
import WarehouseController from "../controllers/warehouseControllers";

const warehouseController = new WarehouseController();

// GET all warehouses
router.get("/", warehouseController.getAllWarehouses);

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

// GET warehouses with low stock
router.get("/reports/low-stock", warehouseController.getWarehousesWithLowStock);

export default router;