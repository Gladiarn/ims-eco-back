"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transferServices_1 = __importDefault(require("../services/transferServices"));
const transferService = new transferServices_1.default();
class TransferController {
    // POST search transfers with pagination
    searchTransfers = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "requestDate", order: "desc" } } = req.body;
            const result = await transferService.searchTransfersService({
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET transfer by ID
    getTransferById = async (req, res) => {
        try {
            const id = req.params.id;
            const transfer = await transferService.getTransferByIdService(id);
            res.json({ success: true, data: transfer });
        }
        catch (error) {
            if (error.message === "Transfer not found") {
                res.status(404).json({ success: false, error: error.message });
            }
            else {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    };
    // POST transfers by warehouse with pagination
    getTransfersByWarehouse = async (req, res) => {
        try {
            const warehouseId = req.params.warehouseId;
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "requestDate", order: "desc" } } = req.body;
            const result = await transferService.getTransfersByWarehouseService(warehouseId, {
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST create transfer
    createTransfer = async (req, res) => {
        try {
            // Transform the request body to match the service expected format
            const transferData = {
                sourceWarehouseId: req.body.sourceWarehouseId,
                destinationWarehouseId: req.body.destinationWarehouseId,
                requestedById: req.body.requestedById,
                items: req.body.items,
                notes: req.body.notes,
                estimatedArrival: req.body.estimatedArrival ? new Date(req.body.estimatedArrival) : undefined
            };
            const transfer = await transferService.createTransferService(transferData);
            res.status(201).json({ success: true, data: transfer });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // PUT update transfer
    updateTransfer = async (req, res) => {
        try {
            const id = req.params.id;
            const transfer = await transferService.updateTransferService(id, req.body);
            res.json({ success: true, data: transfer });
        }
        catch (error) {
            if (error.message === "Transfer not found") {
                res.status(404).json({ success: false, error: error.message });
            }
            else {
                res.status(400).json({ success: false, error: error.message });
            }
        }
    };
    // PATCH update transfer status
    updateTransferStatus = async (req, res) => {
        try {
            const id = req.params.id;
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ success: false, error: "Status is required" });
            }
            const transfer = await transferService.updateTransferStatusService(id, status, req.body);
            res.json({ success: true, data: transfer });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // POST complete transfer
    completeTransfer = async (req, res) => {
        try {
            const id = req.params.id;
            const { completedBy } = req.body;
            if (!completedBy) {
                return res.status(400).json({ success: false, error: "Completed by user is required" });
            }
            const transfer = await transferService.completeTransferService(id, completedBy);
            res.json({ success: true, data: transfer });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // DELETE transfer
    deleteTransfer = async (req, res) => {
        try {
            const id = req.params.id;
            const result = await transferService.deleteTransferService(id);
            res.json({ success: true, message: result.message });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // GET transfer statistics
    getTransferStatistics = async (req, res) => {
        try {
            const statistics = await transferService.getTransferStatisticsService();
            res.json({ success: true, data: statistics });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.default = TransferController;
