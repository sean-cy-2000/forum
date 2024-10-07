import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import { connectDB, closeDB } from './ultis/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/user', userRoutes);

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`正在執行： http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('連接伺服器失敗:', err);
  }
})();