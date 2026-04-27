"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const userControllers_1 = __importDefault(require("../controllers/userControllers"));
// import { authenticate } from "../middleware/auth"; // Will enable once middleware is ready
const userController = new userControllers_1.default();
// Current user profile
router.get("/me", userController.getCurrentUser);
// Search users
router.post("/search", userController.searchUsers);
// Active users list (for selects)
router.get("/active/list", userController.getActiveUsers);
// Single user operations
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
exports.default = router;
