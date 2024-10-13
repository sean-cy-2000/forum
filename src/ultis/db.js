import mongo from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { URI, DB_NAME } = process.env;

export async function connectDB() {
  console.log('資料庫連線中...');
  try {
    await mongo.connect(URI, {
      dbName: DB_NAME
    });
    console.log('連接 MongoDB 成功！');
  } catch (err) {
    console.error('連接 MongoDB 失敗：', err);
  }
}

export function closeDB() {
  return mongo.connection.close();
}

