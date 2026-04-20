import express from "express";
const router = express.Router();
import AuditController from "../controllers/auditControllers";
// import { authenticate, authorize } from "../middleware/auth";

const auditController = new AuditController();

// Search audit logs
router.post("/search", auditController.searchAuditLogs);

// Get specific log
router.get("/:id", auditController.getAuditLogById);

// Get logs for entity
router.get("/entity/:entityType/:entityId", auditController.getLogsByEntity);

export default router;
