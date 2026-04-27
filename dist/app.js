"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const warehouseRoutes_js_1 = __importDefault(require("./routes/warehouseRoutes.js"));
const inventoryRoutes_js_1 = __importDefault(require("./routes/inventoryRoutes.js"));
const productRoutes_js_1 = __importDefault(require("./routes/productRoutes.js"));
const categoryRoutes_js_1 = __importDefault(require("./routes/categoryRoutes.js"));
const transactionRoutes_js_1 = __importDefault(require("./routes/transactionRoutes.js"));
const orderRoutes_js_1 = __importDefault(require("./routes/orderRoutes.js"));
const transferRoutes_js_1 = __importDefault(require("./routes/transferRoutes.js"));
const sustainabilityRoutes_js_1 = __importDefault(require("./routes/sustainabilityRoutes.js"));
const userRoutes_js_1 = __importDefault(require("./routes/userRoutes.js"));
const settingRoutes_js_1 = __importDefault(require("./routes/settingRoutes.js"));
const auditRoutes_js_1 = __importDefault(require("./routes/auditRoutes.js"));
const analyticsRoutes_js_1 = __importDefault(require("./routes/analyticsRoutes.js"));
const app = (0, express_1.default)();
const PORT = process.env.PORT;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.json({
        status: '✅ EcoCycle IMS Backend Running',
        timestamp: new Date().toISOString()
    });
});
// warehouse starting route
app.use('/warehouses', warehouseRoutes_js_1.default);
// inventory starting route
app.use('/inventory', inventoryRoutes_js_1.default);
// products starting route
app.use('/products', productRoutes_js_1.default);
// category starting route
app.use('/category', categoryRoutes_js_1.default);
// transactions starting route
app.use('/transactions', transactionRoutes_js_1.default);
// orders starting route
app.use('/orders', orderRoutes_js_1.default);
// transfers starting route
app.use('/transfers', transferRoutes_js_1.default);
app.use('/sustainability', sustainabilityRoutes_js_1.default);
// users starting route
app.use('/users', userRoutes_js_1.default);
// settings starting route
app.use('/settings', settingRoutes_js_1.default);
// audit logs starting route
app.use('/audit', auditRoutes_js_1.default);
// analytics starting route
app.use('/analytics', analyticsRoutes_js_1.default);
exports.default = app;
