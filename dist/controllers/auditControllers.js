"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auditServices_1 = require("../services/auditServices");
const auditService = new auditServices_1.AuditService();
class AuditController {
    /**
     * Search audit logs
     */
    async searchAuditLogs(req, res) {
        try {
            const result = await auditService.searchAuditLogs(req.body);
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get audit log by ID
     */
    async getAuditLogById(req, res) {
        try {
            const log = await auditService.getAuditLogById(req.params.id);
            if (!log) {
                return res.status(404).json({ success: false, message: "Audit log not found" });
            }
            res.json({ success: true, data: log });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Get logs for a specific entity
     */
    async getLogsByEntity(req, res) {
        try {
            const { entityType, entityId } = req.params;
            const logs = await auditService.getLogsByEntity(req.params.entityType, req.params.entityId);
            res.json({ success: true, data: logs });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.default = AuditController;
