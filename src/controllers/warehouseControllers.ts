import { Request, Response } from "express";
import WarehouseService from "../services/warehouseServices";

const warehouseService = new WarehouseService();

export default class WarehouseController {
  // GET all warehouses
  getAllWarehouses = async (req: Request, res: Response) => {
    try {
      const warehouses = await warehouseService.getAllWarehousesService();
      res.json({ success: true, data: warehouses });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET single warehouse by ID
  getWarehouseById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const warehouse = await warehouseService.getWarehouseByIdService(id);

      if (!warehouse) {
        return res.status(404).json({
          success: false,
          error: "Warehouse not found",
        });
      }

      res.json({ success: true, data: warehouse });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST create warehouse
  createWarehouse = async (req: Request, res: Response) => {
    try {
      const warehouse = await warehouseService.createWarehouseService(req.body);
      res.status(201).json({ success: true, data: warehouse });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // PUT update warehouse
  updateWarehouse = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const warehouse = await warehouseService.updateWarehouseService(
        id,
        req.body,
      );
      res.json({ success: true, data: warehouse });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // DELETE warehouse
  deleteWarehouse = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      await warehouseService.deleteWarehouseService(id);
      res.json({ success: true, message: "Warehouse deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // GET warehouse stats
  getWarehouseStats = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const stats = await warehouseService.getWarehouseStatsService(id);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET warehouse inventory summary
  getWarehouseInventorySummary = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const summary = await warehouseService.getWarehouseInventorySummaryService(id);
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET warehouses with low stock
  getWarehousesWithLowStock = async (req: Request, res: Response) => {
    try {
      const warehouses = await warehouseService.getWarehousesWithLowStockService();
      res.json({ success: true, data: warehouses });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}