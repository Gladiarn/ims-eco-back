import { Request, Response } from "express";
import ProductServices from "../services/productServices";

const productService = new ProductServices();

export default class ProductController {
  // POST search products with pagination
  searchProducts = async (req: Request, res: Response) => {
    try {
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "createdAt", order: "desc" }
      } = req.body;

      const result = await productService.searchProductsService({
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

  // GET product by ID (single record)
  getProductById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const product = await productService.getProductByIdService(id);

      res.json({ success: true, data: product });
    } catch (error: any) {
      if (error.message === "Product not found") {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  };

  // POST search low stock products
  searchLowStockProducts = async (req: Request, res: Response) => {
    try {
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "totalAvailable", order: "asc" },
        threshold
      } = req.body;

      const result = await productService.searchLowStockProductsService({
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

  // POST search products by category
  searchProductsByCategory = async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.categoryId as string;
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "name", order: "asc" }
      } = req.body;

      const result = await productService.searchProductsByCategoryService(
        categoryId,
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

  // POST create/update product (upsert)
  upsertProduct = async (req: Request, res: Response) => {
    try {
      const product = await productService.upsertProductService(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // DELETE product
  deleteProduct = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      await productService.deleteProductService(id);
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // POST bulk products update
  bulkUpdateProducts = async (req: Request, res: Response) => {
    try {
      const updates = req.body.updates;
      const results = await productService.bulkUpdateProductsService(updates);
      res.json({ success: true, data: results });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // GET product inventory across warehouses
  getProductInventory = async (req: Request, res: Response) => {
    try {
      const productId = req.params.productId as string;
      const result = await productService.getProductInventoryService(productId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET product statistics (dashboard stats)
  getProductStatistics = async (req: Request, res: Response) => {
    try {
      const statistics = await productService.getProductStatisticsService();
      res.json({ success: true, data: statistics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getProductsDashboardSummary = async (req: Request, res: Response) => {
    try {
      const summary = await productService.getProductsDashboardSummaryService();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET product analytics
  getProductAnalytics = async (req: Request, res: Response) => {
    try {
      const { filters = {} } = req.body;
      const analytics = await productService.getProductAnalyticsService(filters);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET product turnover analytics
  getProductTurnover = async (req: Request, res: Response) => {
    try {
      const { period = "month" } = req.query;
      const turnover = await productService.getProductTurnoverService(period as string);
      res.json({ success: true, data: turnover });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET products by warehouse (for warehouse-view)
  getProductsByWarehouse = async (req: Request, res: Response) => {
    try {
      const warehouseId = req.params.warehouseId as string;
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "product.name", order: "asc" }
      } = req.body;

      const result = await productService.getProductsByWarehouseService(
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
}