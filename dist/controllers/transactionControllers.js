"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transactionServices_1 = __importDefault(require("../services/transactionServices"));
const transactionService = new transactionServices_1.default();
class TransactionController {
    // POST search transactions with pagination
    searchTransactions = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "transactionDate", order: "desc" } } = req.body;
            const result = await transactionService.searchTransactionsService({
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET transaction by ID
    getTransactionById = async (req, res) => {
        try {
            const id = req.params.id;
            const transaction = await transactionService.getTransactionByIdService(id);
            if (!transaction) {
                return res.status(404).json({ success: false, error: "Transaction not found" });
            }
            res.json({ success: true, data: transaction });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST create transaction
    createTransaction = async (req, res) => {
        try {
            const transaction = await transactionService.createTransactionService(req.body);
            res.status(201).json({ success: true, data: transaction });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // PUT update transaction
    updateTransaction = async (req, res) => {
        try {
            const id = req.params.id;
            const transaction = await transactionService.updateTransactionService(id, req.body);
            res.json({ success: true, data: transaction });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // DELETE transaction
    deleteTransaction = async (req, res) => {
        try {
            const id = req.params.id;
            const result = await transactionService.deleteTransactionService(id);
            res.json({ success: true, message: result.message });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // GET transaction statistics
    getTransactionStatistics = async (req, res) => {
        try {
            const statistics = await transactionService.getTransactionStatisticsService();
            res.json({ success: true, data: statistics });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST transactions by warehouse with pagination
    getTransactionsByWarehouse = async (req, res) => {
        try {
            const warehouseId = req.params.warehouseId;
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "transactionDate", order: "desc" } } = req.body;
            const result = await transactionService.searchTransactionsByWarehouseService(warehouseId, {
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST stock in transaction
    createStockIn = async (req, res) => {
        try {
            const transactionData = {
                ...req.body,
                type: "STOCK_IN"
            };
            const transaction = await transactionService.createTransactionService(transactionData);
            res.status(201).json({ success: true, data: transaction });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // POST stock out transaction
    createStockOut = async (req, res) => {
        try {
            const transactionData = {
                ...req.body,
                type: "STOCK_OUT"
            };
            const transaction = await transactionService.createTransactionService(transactionData);
            res.status(201).json({ success: true, data: transaction });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // POST adjustment transaction
    createAdjustment = async (req, res) => {
        try {
            const transactionData = {
                ...req.body,
                type: "ADJUSTMENT"
            };
            const transaction = await transactionService.createTransactionService(transactionData);
            res.status(201).json({ success: true, data: transaction });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // POST waste/recycling transaction
    createWasteTransaction = async (req, res) => {
        try {
            const { wasteType = "WASTE", ...rest } = req.body;
            const transactionData = {
                ...rest,
                type: wasteType
            };
            const transaction = await transactionService.createTransactionService(transactionData);
            res.status(201).json({ success: true, data: transaction });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
}
exports.default = TransactionController;
