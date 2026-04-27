"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const transactionControllers_1 = __importDefault(require("../controllers/transactionControllers"));
const transactionController = new transactionControllers_1.default();
// =================== SEARCH & QUERY OPERATIONS ===================
// POST search transactions with pagination/filters
router.post("/search", transactionController.searchTransactions);
// POST transactions by warehouse with pagination
router.post("/warehouse/:warehouseId/search", transactionController.getTransactionsByWarehouse);
// =================== SPECIFIC TRANSACTION TYPES ===================
// POST create stock in transaction
router.post("/stock-in", transactionController.createStockIn);
// POST create stock out transaction
router.post("/stock-out", transactionController.createStockOut);
// POST create adjustment transaction
router.post("/adjustment", transactionController.createAdjustment);
// POST create waste/recycling transaction
router.post("/waste", transactionController.createWasteTransaction);
// =================== SINGLE RECORD OPERATIONS ===================
// GET transaction by ID
router.get("/:id", transactionController.getTransactionById);
// PUT update transaction (notes, etc.)
router.put("/:id", transactionController.updateTransaction);
// DELETE transaction (with inventory reversal)
router.delete("/:id", transactionController.deleteTransaction);
// =================== STATISTICS & ANALYTICS ===================
// GET transaction statistics for dashboard
router.get("/statistics/dashboard", transactionController.getTransactionStatistics);
exports.default = router;
