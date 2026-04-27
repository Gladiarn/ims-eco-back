"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sustainabilityServices_1 = __importDefault(require("../services/sustainabilityServices"));
const sustainabilityService = new sustainabilityServices_1.default();
class SustainabilityController {
    // ==================== CARBON TRACKING CONTROLLERS ====================
    // POST search carbon tracking
    searchCarbonTracking = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "recordedAt", order: "desc" } } = req.body;
            const result = await sustainabilityService.searchCarbonTrackingService({
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
    // GET carbon tracking by ID
    getCarbonTrackingById = async (req, res) => {
        try {
            const id = req.params.id;
            const record = await sustainabilityService.getCarbonTrackingByIdService(id);
            res.json({ success: true, data: record });
        }
        catch (error) {
            if (error.message === "Carbon tracking record not found") {
                res.status(404).json({ success: false, error: error.message });
            }
            else {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    };
    // POST create carbon tracking
    createCarbonTracking = async (req, res) => {
        try {
            const record = await sustainabilityService.createCarbonTrackingService(req.body);
            res.status(201).json({ success: true, data: record });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // PUT update carbon tracking
    updateCarbonTracking = async (req, res) => {
        try {
            const id = req.params.id;
            const record = await sustainabilityService.updateCarbonTrackingService(id, req.body);
            res.json({ success: true, data: record });
        }
        catch (error) {
            if (error.message === "Carbon tracking record not found") {
                res.status(404).json({ success: false, error: error.message });
            }
            else {
                res.status(400).json({ success: false, error: error.message });
            }
        }
    };
    // DELETE carbon tracking
    deleteCarbonTracking = async (req, res) => {
        try {
            const id = req.params.id;
            const result = await sustainabilityService.deleteCarbonTrackingService(id);
            res.json({ success: true, message: result.message });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // ==================== RECYCLING RECORDS CONTROLLERS ====================
    // POST search recycling records
    searchRecyclingRecords = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "processedDate", order: "desc" } } = req.body;
            const result = await sustainabilityService.searchRecyclingRecordsService({
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
    // GET recycling record by ID
    getRecyclingRecordById = async (req, res) => {
        try {
            const id = req.params.id;
            const record = await sustainabilityService.getRecyclingRecordByIdService(id);
            res.json({ success: true, data: record });
        }
        catch (error) {
            if (error.message === "Recycling record not found") {
                res.status(404).json({ success: false, error: error.message });
            }
            else {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    };
    // POST create recycling record
    createRecyclingRecord = async (req, res) => {
        try {
            const record = await sustainabilityService.createRecyclingRecordService(req.body);
            res.status(201).json({ success: true, data: record });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // PUT update recycling record
    updateRecyclingRecord = async (req, res) => {
        try {
            const id = req.params.id;
            const record = await sustainabilityService.updateRecyclingRecordService(id, req.body);
            res.json({ success: true, data: record });
        }
        catch (error) {
            if (error.message === "Recycling record not found") {
                res.status(404).json({ success: false, error: error.message });
            }
            else {
                res.status(400).json({ success: false, error: error.message });
            }
        }
    };
    // DELETE recycling record
    deleteRecyclingRecord = async (req, res) => {
        try {
            const id = req.params.id;
            const result = await sustainabilityService.deleteRecyclingRecordService(id);
            res.json({ success: true, message: result.message });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // ==================== MATERIAL FLOW CONTROLLERS ====================
    // POST search material flows
    searchMaterialFlows = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "flowDate", order: "desc" } } = req.body;
            const result = await sustainabilityService.searchMaterialFlowsService({
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
    // GET material flow by ID
    getMaterialFlowById = async (req, res) => {
        try {
            const id = req.params.id;
            const flow = await sustainabilityService.getMaterialFlowByIdService(id);
            res.json({ success: true, data: flow });
        }
        catch (error) {
            if (error.message === "Material flow record not found") {
                res.status(404).json({ success: false, error: error.message });
            }
            else {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    };
    // POST create material flow
    createMaterialFlow = async (req, res) => {
        try {
            const flow = await sustainabilityService.createMaterialFlowService(req.body);
            res.status(201).json({ success: true, data: flow });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // PUT update material flow
    updateMaterialFlow = async (req, res) => {
        try {
            const id = req.params.id;
            const flow = await sustainabilityService.updateMaterialFlowService(id, req.body);
            res.json({ success: true, data: flow });
        }
        catch (error) {
            if (error.message === "Material flow record not found") {
                res.status(404).json({ success: false, error: error.message });
            }
            else {
                res.status(400).json({ success: false, error: error.message });
            }
        }
    };
    // DELETE material flow
    deleteMaterialFlow = async (req, res) => {
        try {
            const id = req.params.id;
            const result = await sustainabilityService.deleteMaterialFlowService(id);
            res.json({ success: true, message: result.message });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // ==================== DASHBOARD CONTROLLERS ====================
    // GET sustainability dashboard
    getSustainabilityDashboard = async (req, res) => {
        try {
            const dashboard = await sustainabilityService.getSustainabilityDashboardService();
            res.json({ success: true, data: dashboard });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET carbon summary by warehouse
    getCarbonByWarehouse = async (req, res) => {
        try {
            const warehouseId = req.params.warehouseId;
            const summary = await sustainabilityService.getCarbonByWarehouseService(warehouseId);
            res.json({ success: true, data: summary });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET recycling summary by warehouse
    getRecyclingByWarehouse = async (req, res) => {
        try {
            const warehouseId = req.params.warehouseId;
            const summary = await sustainabilityService.getRecyclingByWarehouseService(warehouseId);
            res.json({ success: true, data: summary });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.default = SustainabilityController;
