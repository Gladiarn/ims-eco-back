"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inventoryServices_1 = __importDefault(require("../services/inventoryServices"));
const inventoryService = new inventoryServices_1.default();
class InventoryController {
    // POST search inventory with pagination
    searchInventory = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "lastUpdated", order: "desc" } } = req.body;
            const result = await inventoryService.searchInventoryService({
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
    // GET inventory by ID (keep as GET for single record)
    getInventoryById = async (req, res) => {
        try {
            const id = req.params.id;
            const inventory = await inventoryService.getInventoryByIdService(id);
            if (!inventory) {
                return res.status(404).json({
                    success: false,
                    error: "Inventory record not found",
                });
            }
            res.json({ success: true, data: inventory });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST search low stock inventory
    searchLowStockInventory = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "quantity", order: "asc" }, threshold } = req.body;
            const result = await inventoryService.searchLowStockInventoryService({
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort,
                threshold: threshold ? Number(threshold) : undefined
            });
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST search inventory by warehouse
    searchInventoryByWarehouse = async (req, res) => {
        try {
            const warehouseId = req.params.warehouseId;
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "product.name", order: "asc" } } = req.body;
            const result = await inventoryService.searchInventoryByWarehouseService(warehouseId, {
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
    // POST search inventory by product
    searchInventoryByProduct = async (req, res) => {
        try {
            const productId = req.params.productId;
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "warehouse.name", order: "asc" } } = req.body;
            const result = await inventoryService.searchInventoryByProductService(productId, {
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
    // POST create/update inventory (upsert)
    upsertInventory = async (req, res) => {
        try {
            const inventory = await inventoryService.upsertInventoryService(req.body);
            res.status(201).json({ success: true, data: inventory });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // PUT update inventory quantity
    updateInventoryQuantity = async (req, res) => {
        try {
            const id = req.params.id;
            const { quantity, action, notes } = req.body;
            const inventory = await inventoryService.updateInventoryQuantityService(id, Number(quantity), action, notes);
            res.json({ success: true, data: inventory });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // DELETE inventory record
    deleteInventory = async (req, res) => {
        try {
            const id = req.params.id;
            await inventoryService.deleteInventoryService(id);
            res.json({ success: true, message: "Inventory record deleted successfully" });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // POST bulk inventory update
    bulkUpdateInventory = async (req, res) => {
        try {
            const updates = req.body.updates;
            const results = await inventoryService.bulkUpdateInventoryService(updates);
            res.json({ success: true, data: results });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // GET inventory summary (dashboard stats)
    getInventorySummary = async (req, res) => {
        try {
            const summary = await inventoryService.getInventorySummaryService();
            res.json({ success: true, data: summary });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST inventory value report with filters
    getInventoryValueReport = async (req, res) => {
        try {
            const { filters = {} } = req.body;
            const report = await inventoryService.getInventoryValueReportService(filters);
            res.json({ success: true, data: report });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.default = InventoryController;
