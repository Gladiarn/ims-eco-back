import express from "express";
const router = express.Router();
import UserController from "../controllers/userControllers";
// import { authenticate } from "../middleware/auth"; // Will enable once middleware is ready

const userController = new UserController();

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

export default router;
