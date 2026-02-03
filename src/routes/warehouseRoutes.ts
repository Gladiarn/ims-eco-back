import express from 'express';
const router = express.Router();
import WarehouseControllers from '../controllers/warehouseControllers';

const warehouseControllers = new WarehouseControllers();
// POST


// GET
router.get('/', warehouseControllers.getAllWarehouses) 


export default router;