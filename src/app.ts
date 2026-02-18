import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import warehouseRoutes from './routes/warehouseRoutes.js'
import inventoryRoutes from './routes/inventoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import transferRoutes from './routes/transferRoutes.js'
import sustainabilityRoutes from './routes/sustainabilityRoutes.js'

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

// warehouse starting route
app.use('/warehouses', warehouseRoutes);
// inventory starting route
app.use('/inventory', inventoryRoutes);
// products starting route
app.use('/products', productRoutes);
// category starting route
app.use('/category', categoryRoutes);
// transactions starting route
app.use('/transactions', transactionRoutes);
// orders starting route
app.use('/orders',orderRoutes);
// transfers starting route
app.use('/transfers', transferRoutes);

app.use('/sustainability', sustainabilityRoutes);
export default app