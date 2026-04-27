"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const settingControllers_1 = __importDefault(require("../controllers/settingControllers"));
// import { authenticate, authorize } from "../middleware/auth";
const settingController = new settingControllers_1.default();
// Get all settings
router.get("/", settingController.getAllSettings);
// Get specific setting
router.get("/:key", settingController.getSettingByKey);
// Update single setting
router.post("/", settingController.updateSetting);
// Bulk update settings
router.put("/bulk", settingController.bulkUpdateSettings);
exports.default = router;
