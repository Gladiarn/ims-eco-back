import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import warehouseRoutes from './routes/warehouseRoutes.js'
import inventoryRoutes from './routes/inventoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.json({
    status: '✅ EcoCycle IMS Backend Running',
    timestamp: new Date().toISOString()
  });
});

app.use('/warehouses', warehouseRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/products', productRoutes);
app.use('/category', categoryRoutes);


export default app