import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

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

export default app