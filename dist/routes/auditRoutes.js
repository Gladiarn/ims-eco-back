"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const auditControllers_1 = __importDefault(require("../controllers/auditControllers"));
// import { authenticate, authorize } from "../middleware/auth";
const auditController = new auditControllers_1.default();
// Search audit logs
router.post("/search", auditController.searchAuditLogs);
// Get specific log
router.get("/:id", auditController.getAuditLogById);
// Get logs for entity
router.get("/entity/:entityType/:entityId", auditController.getLogsByEntity);
exports.default = router;
