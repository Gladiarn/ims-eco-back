import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import warehouseRoutes from './routes/warehouseRoutes.js'

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




export default app