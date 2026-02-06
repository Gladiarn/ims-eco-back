import { Request, Response } from "express";
import CategoryServices from "../services/categoryServices";

const categoryService = new CategoryServices();

export default class CategoryController {
  // POST search categories with pagination
  searchCategories = async (req: Request, res: Response) => {
    try {
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "name", order: "asc" }
      } = req.body;

      const result = await categoryService.searchCategoriesService({
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

  // GET category by ID
  getCategoryById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const category = await categoryService.getCategoryByIdService(id);

      res.json({ success: true, data: category });
    } catch (error: any) {
      if (error.message === "Category not found") {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  };

  // GET full category tree
  getCategoryTree = async (req: Request, res: Response) => {
    try {
      const tree = await categoryService.getCategoryTreeService();
      res.json({ success: true, data: tree });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // GET subcategories by parent ID
  getSubcategories = async (req: Request, res: Response) => {
    try {
      const parentId = req.params.parentId as string;
      const subcategories = await categoryService.getSubcategoriesService(parentId);
      
      res.json({ success: true, data: subcategories });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // POST products by category with pagination
  getProductsByCategory = async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.categoryId as string;
      const {
        search = "",
        currentPage = 1,
        limit = 10,
        filters = {},
        sort = { field: "name", order: "asc" }
      } = req.body;

      const result = await categoryService.getProductsByCategoryService(categoryId, {
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

  // POST create category
  createCategory = async (req: Request, res: Response) => {
    try {
      const category = await categoryService.createCategoryService(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // PUT update category
  updateCategory = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const category = await categoryService.updateCategoryService(id, req.body);
      
      res.json({ success: true, data: category });
    } catch (error: any) {
      if (error.message === "Category not found") {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(400).json({ success: false, error: error.message });
      }
    }
  };

  // DELETE category
  deleteCategory = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await categoryService.deleteCategoryService(id);
      
      res.json({ success: true, message: result.message });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  // GET category statistics
  getCategoryStatistics = async (req: Request, res: Response) => {
    try {
      const statistics = await categoryService.getCategoryStatisticsService();
      res.json({ success: true, data: statistics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}