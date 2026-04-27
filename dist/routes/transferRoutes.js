"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const transferControllers_1 = __importDefault(require("../controllers/transferControllers"));
const transferController = new transferControllers_1.default();
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
exports.default = router;
