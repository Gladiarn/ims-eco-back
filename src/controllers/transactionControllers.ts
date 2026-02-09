import { Request, Response } from "express";
import TransactionService from "../services/transactionServices";

const transactionService = new TransactionService();

export default class TransactionController {
  // POST search transactions with pagination
  searchTransactions = async (req: Request, res: Response) => {
    try {
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "transactionDate", order: "desc" }
      } = req.body;

      const result = await transactionService.searchTransactionsService({
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

  // GET transaction by ID
  getTransactionById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const transaction = await transactionService.getTransactionByIdService(id);

      if (!transaction) {
        return res.status(404).json({ success: false, error: "Transaction not found" });
      }

      res.json({ success: true, data: transaction });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST create transaction
  createTransaction = async (req: Request, res: Response) => {
    try {
      const transaction = await transactionService.createTransactionService(req.body);
      res.status(201).json({ success: true, data: transaction });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // PUT update transaction
  updateTransaction = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const transaction = await transactionService.updateTransactionService(id, req.body);
      
      res.json({ success: true, data: transaction });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // DELETE transaction
  deleteTransaction = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await transactionService.deleteTransactionService(id);
      
      res.json({ success: true, message: result.message });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // GET transaction statistics
  getTransactionStatistics = async (req: Request, res: Response) => {
    try {
      const statistics = await transactionService.getTransactionStatisticsService();
      res.json({ success: true, data: statistics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST transactions by warehouse with pagination
  getTransactionsByWarehouse = async (req: Request, res: Response) => {
    try {
      const warehouseId = req.params.warehouseId as string;
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "transactionDate", order: "desc" }
      } = req.body;

      const result = await transactionService.getTransactionsByWarehouseService(warehouseId, {
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

  // POST stock in transaction
  createStockIn = async (req: Request, res: Response) => {
    try {
      const transactionData = {
        ...req.body,
        type: "STOCK_IN" as const
      };
      
      const transaction = await transactionService.createTransactionService(transactionData);
      res.status(201).json({ success: true, data: transaction });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // POST stock out transaction
  createStockOut = async (req: Request, res: Response) => {
    try {
      const transactionData = {
        ...req.body,
        type: "STOCK_OUT" as const
      };
      
      const transaction = await transactionService.createTransactionService(transactionData);
      res.status(201).json({ success: true, data: transaction });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // POST adjustment transaction
  createAdjustment = async (req: Request, res: Response) => {
    try {
      const transactionData = {
        ...req.body,
        type: "ADJUSTMENT" as const
      };
      
      const transaction = await transactionService.createTransactionService(transactionData);
      res.status(201).json({ success: true, data: transaction });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // POST waste/recycling transaction
  createWasteTransaction = async (req: Request, res: Response) => {
    try {
      const { wasteType = "WASTE", ...rest } = req.body;
      const transactionData = {
        ...rest,
        type: wasteType as "WASTE" | "RECYCLING"
      };
      
      const transaction = await transactionService.createTransactionService(transactionData);
      res.status(201).json({ success: true, data: transaction });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}