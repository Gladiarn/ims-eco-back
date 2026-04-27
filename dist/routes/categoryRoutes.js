"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const categoryControllers_1 = __importDefault(require("../controllers/categoryControllers"));
const categoryController = new categoryControllers_1.default();
// =================== SEARCH & QUERY OPERATIONS ===================
// POST search categories with pagination/filters
router.post("/search", categoryController.searchCategories);
// GET full category tree (hierarchical)
router.get("/tree", categoryController.getCategoryTree);
// GET subcategories by parent ID
router.get("/parent/:parentId/subcategories", categoryController.getSubcategories);
// POST products by category with pagination
router.post("/:categoryId/products", categoryController.getProductsByCategory);
// =================== SINGLE RECORD OPERATIONS ===================
// GET category by ID
router.get("/:id", categoryController.getCategoryById);
// POST create new category
router.post("/", categoryController.createCategory);
// PUT update category
router.put("/:id", categoryController.updateCategory);
// DELETE category
router.delete("/:id", categoryController.deleteCategory);
// =================== STATISTICS ===================
// GET category statistics
router.get("/statistics/dashboard", categoryController.getCategoryStatistics);
exports.default = router;
