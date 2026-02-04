import { Request, Response } from "express";
import InventoryService from "../services/inventoryServices";

const inventoryService = new InventoryService();

export default class InventoryController {
  // POST search inventory with pagination
  searchInventory = async (req: Request, res: Response) => {
    try {
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "lastUpdated", order: "desc" }
      } = req.body;

      const result = await inventoryService.searchInventoryService({
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

  // GET inventory by ID (keep as GET for single record)
  getInventoryById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const inventory = await inventoryService.getInventoryByIdService(id);

      if (!inventory) {
        return res.status(404).json({
          success: false,
          error: "Inventory record not found",
        });
      }

      res.json({ success: true, data: inventory });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST search low stock inventory
  searchLowStockInventory = async (req: Request, res: Response) => {
    try {
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "quantity", order: "asc" },
        threshold
      } = req.body;

      const result = await inventoryService.searchLowStockInventoryService({
        search: String(search),
        currentPage: Number(currentPage),
        limit: Number(limit),
        filters,
        sort,
        threshold: threshold ? Number(threshold) : undefined
      });

      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST search inventory by warehouse
  searchInventoryByWarehouse = async (req: Request, res: Response) => {
    try {
      const warehouseId = req.params.warehouseId as string;
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "product.name", order: "asc" }
      } = req.body;

      const result = await inventoryService.searchInventoryByWarehouseService(
        warehouseId,
        {
          search: String(search),
          currentPage: Number(currentPage),
          limit: Number(limit),
          filters,
          sort
        }
      );

      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST search inventory by product
  searchInventoryByProduct = async (req: Request, res: Response) => {
    try {
      const productId = req.params.productId as string;
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "warehouse.name", order: "asc" }
      } = req.body;

      const result = await inventoryService.searchInventoryByProductService(
        productId,
        {
          search: String(search),
          currentPage: Number(currentPage),
          limit: Number(limit),
          filters,
          sort
        }
      );

      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST create/update inventory (upsert)
  upsertInventory = async (req: Request, res: Response) => {
    try {
      const inventory = await inventoryService.upsertInventoryService(req.body);
      res.status(201).json({ success: true, data: inventory });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // PUT update inventory quantity
  updateInventoryQuantity = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { quantity, action, notes } = req.body;
      
      const inventory = await inventoryService.updateInventoryQuantityService(
        id,
        Number(quantity),
        action,
        notes
      );
      
      res.json({ success: true, data: inventory });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // DELETE inventory record
  deleteInventory = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      await inventoryService.deleteInventoryService(id);
      res.json({ success: true, message: "Inventory record deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // POST bulk inventory update
  bulkUpdateInventory = async (req: Request, res: Response) => {
    try {
      const updates = req.body.updates;
      const results = await inventoryService.bulkUpdateInventoryService(updates);
      res.json({ success: true, data: results });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // GET inventory summary (dashboard stats)
  getInventorySummary = async (req: Request, res: Response) => {
    try {
      const summary = await inventoryService.getInventorySummaryService();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST inventory value report with filters
  getInventoryValueReport = async (req: Request, res: Response) => {
    try {
      const { filters = {} } = req.body;
      const report = await inventoryService.getInventoryValueReportService(filters);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}