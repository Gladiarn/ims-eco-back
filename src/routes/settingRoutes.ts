import express from "express";
const router = express.Router();
import SettingController from "../controllers/settingControllers";
// import { authenticate, authorize } from "../middleware/auth";

const settingController = new SettingController();

// Get all settings
router.get("/", settingController.getAllSettings);

// Get specific setting
router.get("/:key", settingController.getSettingByKey);

// Update single setting
router.post("/", settingController.updateSetting);

// Bulk update settings
router.put("/bulk", settingController.bulkUpdateSettings);

export default router;
