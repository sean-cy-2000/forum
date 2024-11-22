import express from 'express';
import dotenv from 'dotenv';
import { connectDB, closeDB } from './ultis/db.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());  //  允許所有請求
app.use(express.json());      //  解析 Content-Type: application/json
app.use(express.urlencoded({ extended: true }));  // 解析前端的 form 需要用到的

app.use('/user', userRoutes);
app.use('/post', postRoutes); // post指的是文章相關的路由，不是 POST 方法

// 錯誤處理的全局中間件，如果 app.use 有四個參數，就會列為錯誤處理中間件。
// 如果在處理 err 時使用 next(err)，就會觸發這個中間件。
app.use((err, req, res, next) => {
  console.error(`err的內容:\n${err}\n\nerr.stack的內容:\n${err.stack}`);
  res.status(500).json({ message: '伺服器錯誤' });
});

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

export default app;