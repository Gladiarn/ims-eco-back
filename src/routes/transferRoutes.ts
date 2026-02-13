import express from "express";
const router = express.Router();
import TransferController from "../controllers/transferControllers";

const transferController = new TransferController();

// =================== SEARCH & QUERY OPERATIONS ===================
// POST search transfers with pagination/filters
router.post("/search", transferController.searchTransfers);

// POST transfers by warehouse with pagination
router.post("/warehouse/:warehouseId", transferController.getTransfersByWarehouse);

// =================== SINGLE RECORD OPERATIONS ===================
// GET transfer by ID
router.get("/:id", transferController.getTransferById);

// POST create new transfer
router.post("/", transferController.createTransfer);

// PUT update transfer
router.put("/:id", transferController.updateTransfer);

// PATCH update transfer status
router.patch("/:id/status", transferController.updateTransferStatus);

// DELETE transfer
router.delete("/:id", transferController.deleteTransfer);

// =================== TRANSFER ACTIONS ===================
// POST complete transfer
router.post("/:id/complete", transferController.completeTransfer);

// =================== STATISTICS ===================
// GET transfer statistics
router.get("/statistics/dashboard", transferController.getTransferStatistics);

export default router;