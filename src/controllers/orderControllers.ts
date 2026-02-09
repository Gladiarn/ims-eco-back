import { Request, Response } from "express";
import OrderServices from "../services/orderServices";

const orderService = new OrderServices();

export default class OrderController {
  // POST search orders with pagination
  searchOrders = async (req: Request, res: Response) => {
    try {
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "orderDate", order: "desc" }
      } = req.body;

      // ✅ FIXED: Method name matches service
      const result = await orderService.searchOrdersService({
        search: String(search),
        currentPage: Number(currentPage),
        limit: Number(limit),
        filters,
        sort
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET order by ID
  getOrderById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      // ✅ FIXED: Method name matches service
      const order = await orderService.getOrderByIdService(id);

      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }

      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST create order
  createOrder = async (req: Request, res: Response) => {
    try {
      // ✅ FIXED: Method name matches service
      const order = await orderService.createOrderService(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // PUT update order
  updateOrder = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      // ✅ FIXED: Method name matches service
      const order = await orderService.updateOrderService(id, req.body);
      
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // POST search orders by status
  searchOrdersByStatus = async (req: Request, res: Response) => {
    try {
      const status = req.params.status as string;
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "orderDate", order: "desc" }
      } = req.body;

      // ✅ FIXED: Method name matches service
      const result = await orderService.searchOrdersByStatusService(status, {
        search: String(search),
        currentPage: Number(currentPage),
        limit: Number(limit),
        filters,
        sort
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST search orders to fulfill (NEW, PROCESSING, PICKING)
  searchOrdersToFulfill = async (req: Request, res: Response) => {
    try {
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "orderDate", order: "asc" }
      } = req.body;

      // ✅ FIXED: Method name matches service
      const result = await orderService.searchOrdersToFulfillService({
        search: String(search),
        currentPage: Number(currentPage),
        limit: Number(limit),
        filters,
        sort
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET order statistics
  getOrderStatistics = async (req: Request, res: Response) => {
    try {
      // ✅ FIXED: Method name matches service
      const statistics = await orderService.getOrderStatisticsService();
      res.json({ success: true, data: statistics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}