"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const categoryServices_1 = __importDefault(require("../services/categoryServices"));
const categoryService = new categoryServices_1.default();
class CategoryController {
    // POST search categories with pagination
    searchCategories = async (req, res) => {
        try {
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "name", order: "asc" } } = req.body;
            const result = await categoryService.searchCategoriesService({
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET category by ID
    getCategoryById = async (req, res) => {
        try {
            const id = req.params.id;
            const category = await categoryService.getCategoryByIdService(id);
            res.json({ success: true, data: category });
        }
        catch (error) {
            if (error.message === "Category not found") {
                res.status(404).json({ success: false, error: error.message });
            }
            else {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    };
    // GET full category tree
    getCategoryTree = async (req, res) => {
        try {
            const tree = await categoryService.getCategoryTreeService();
            res.json({ success: true, data: tree });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // GET subcategories by parent ID
    getSubcategories = async (req, res) => {
        try {
            const parentId = req.params.parentId;
            const subcategories = await categoryService.getSubcategoriesService(parentId);
            res.json({ success: true, data: subcategories });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST products by category with pagination
    getProductsByCategory = async (req, res) => {
        try {
            const categoryId = req.params.categoryId;
            const { search = "", currentPage = 1, limit = 10, filters = {}, sort = { field: "name", order: "asc" } } = req.body;
            const result = await categoryService.getProductsByCategoryService(categoryId, {
                search: String(search),
                currentPage: Number(currentPage),
                limit: Number(limit),
                filters,
                sort
            });
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // POST create category
    createCategory = async (req, res) => {
        try {
            const category = await categoryService.createCategoryService(req.body);
            res.status(201).json({ success: true, data: category });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // PUT update category
    updateCategory = async (req, res) => {
        try {
            const id = req.params.id;
            const category = await categoryService.updateCategoryService(id, req.body);
            res.json({ success: true, data: category });
        }
        catch (error) {
            if (error.message === "Category not found") {
                res.status(404).json({ success: false, error: error.message });
            }
            else {
                res.status(400).json({ success: false, error: error.message });
            }
        }
    };
    // DELETE category
    deleteCategory = async (req, res) => {
        try {
            const id = req.params.id;
            const result = await categoryService.deleteCategoryService(id);
            res.json({ success: true, message: result.message });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    };
    // GET category statistics
    getCategoryStatistics = async (req, res) => {
        try {
            const statistics = await categoryService.getCategoryStatisticsService();
            res.json({ success: true, data: statistics });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.default = CategoryController;
