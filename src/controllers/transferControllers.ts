import { Request, Response } from "express";
import TransferServices from "../services/transferServices";

const transferService = new TransferServices();

export default class TransferController {
  // POST search transfers with pagination
  searchTransfers = async (req: Request, res: Response) => {
    try {
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "requestDate", order: "desc" }
      } = req.body;

      const result = await transferService.searchTransfersService({
        search: String(search),
        currentPage: Number(currentPage),
        limit: Number(limit),
        filters,
        sort
      });

      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET transfer by ID
  getTransferById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const transfer = await transferService.getTransferByIdService(id);

      res.json({ success: true, data: transfer });
    } catch (error: any) {
      if (error.message === "Transfer not found") {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  };

  // POST transfers by warehouse with pagination
  getTransfersByWarehouse = async (req: Request, res: Response) => {
    try {
      const warehouseId = req.params.warehouseId as string;
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "requestDate", order: "desc" }
      } = req.body;

      const result = await transferService.getTransfersByWarehouseService(warehouseId, {
        search: String(search),
        currentPage: Number(currentPage),
        limit: Number(limit),
        filters,
        sort
      });

      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST create transfer
  createTransfer = async (req: Request, res: Response) => {
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
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // PUT update transfer
  updateTransfer = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const transfer = await transferService.updateTransferService(id, req.body);
      
      res.json({ success: true, data: transfer });
    } catch (error: any) {
      if (error.message === "Transfer not found") {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(400).json({ success: false, error: error.message });
      }
    }
  };

  // PATCH update transfer status
  updateTransferStatus = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ success: false, error: "Status is required" });
      }

      const transfer = await transferService.updateTransferStatusService(id, status, req.body);
      res.json({ success: true, data: transfer });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // POST complete transfer
  completeTransfer = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { completedBy } = req.body;
      
      if (!completedBy) {
        return res.status(400).json({ success: false, error: "Completed by user is required" });
      }

      const transfer = await transferService.completeTransferService(id, completedBy);
      res.json({ success: true, data: transfer });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // DELETE transfer
  deleteTransfer = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await transferService.deleteTransferService(id);
      
      res.json({ success: true, message: result.message });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // GET transfer statistics
  getTransferStatistics = async (req: Request, res: Response) => {
    try {
      const statistics = await transferService.getTransferStatisticsService();
      res.json({ success: true, data: statistics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}