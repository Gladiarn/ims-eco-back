import { Request, Response } from "express";
import WarehouseService from "../services/warehouseServices";

const warehouseService = new WarehouseService();

export default class WarehouseController {
  // POST search warehouses with pagination
  searchWarehouses = async (req: Request, res: Response) => {
  try {
    const {
      search = "",
      currentPage = 1,
      limit = 10,
      filters = {},
      sort = { field: "createdAt", order: "desc" } 
    } = req.body;

    const result = await warehouseService.searchWarehousesService({
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

  // POST search warehouses with low stock
  searchWarehousesWithLowStock = async (req: Request, res: Response) => {
    try {
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "name", order: "asc" }
      } = req.body;

      const result = await warehouseService.searchWarehousesWithLowStockService({
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

  // GET active warehouses only (for dropdowns)
  getActiveWarehouses = async (req: Request, res: Response) => {
    try {
      const warehouses = await warehouseService.getActiveWarehousesService();
      res.json({ success: true, data: warehouses });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}