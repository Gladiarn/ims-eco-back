import express from "express";
const router = express.Router();
import SustainabilityController from "../controllers/sustainabilityControllers";

const sustainabilityController = new SustainabilityController();

// ==================== CARBON TRACKING ROUTES ====================

// POST search carbon tracking
router.post("/carbon/search", sustainabilityController.searchCarbonTracking);

// GET carbon tracking by ID
router.get("/carbon/:id", sustainabilityController.getCarbonTrackingById);

// POST create carbon tracking
router.post("/carbon", sustainabilityController.createCarbonTracking);

// PUT update carbon tracking
router.put("/carbon/:id", sustainabilityController.updateCarbonTracking);

// DELETE carbon tracking
router.delete("/carbon/:id", sustainabilityController.deleteCarbonTracking);

// ==================== RECYCLING RECORDS ROUTES ====================

// POST search recycling records
router.post("/recycling/search", sustainabilityController.searchRecyclingRecords);

// GET recycling record by ID
router.get("/recycling/:id", sustainabilityController.getRecyclingRecordById);

// POST create recycling record
router.post("/recycling", sustainabilityController.createRecyclingRecord);

// PUT update recycling record
router.put("/recycling/:id", sustainabilityController.updateRecyclingRecord);

// DELETE recycling record
router.delete("/recycling/:id", sustainabilityController.deleteRecyclingRecord);

// ==================== MATERIAL FLOW ROUTES ====================

// POST search material flows
router.post("/material-flow/search", sustainabilityController.searchMaterialFlows);

// GET material flow by ID
router.get("/material-flow/:id", sustainabilityController.getMaterialFlowById);

// POST create material flow
router.post("/material-flow", sustainabilityController.createMaterialFlow);

// PUT update material flow
router.put("/material-flow/:id", sustainabilityController.updateMaterialFlow);

// DELETE material flow
router.delete("/material-flow/:id", sustainabilityController.deleteMaterialFlow);

// ==================== DASHBOARD ROUTES ====================

// GET sustainability dashboard
router.get("/dashboard", sustainabilityController.getSustainabilityDashboard);

// GET carbon summary by warehouse
router.get("/carbon/warehouse/:warehouseId", sustainabilityController.getCarbonByWarehouse);

// GET recycling summary by warehouse
router.get("/recycling/warehouse/:warehouseId", sustainabilityController.getRecyclingByWarehouse);

export default router;