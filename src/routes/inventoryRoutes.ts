import express from "express";
const router = express.Router();
import InventoryController from "../controllers/inventoryControllers";
const inventoryController = new InventoryController();

// I'm using POST for search operations allowing complex filters in the body
router.post("/search", inventoryController.searchInventory);
router.post("/low-stock", inventoryController.searchLowStockInventory);





// =================== SINGLE RECORD OPERATIONS ===================
// GET inventory by ID
router.get("/:id", inventoryController.getInventoryById);
