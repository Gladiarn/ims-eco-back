import { Request, Response } from "express";
import { AuditService } from "../services/auditServices";

const auditService = new AuditService();

export default class AuditController {
  /**
   * Search audit logs
   */
  async searchAuditLogs(req: Request, res: Response) {
    try {
      const result = await auditService.searchAuditLogs(req.body);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(req: Request, res: Response) {
    try {
      const log = await auditService.getAuditLogById(req.params.id as string);
      if (!log) {
        return res.status(404).json({ success: false, message: "Audit log not found" });
      }
      res.json({ success: true, data: log });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get logs for a specific entity
   */
  async getLogsByEntity(req: Request, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const logs = await auditService.getLogsByEntity(req.params.entityType as string, req.params.entityId as string);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
