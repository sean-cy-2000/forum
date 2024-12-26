import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { URI, DB_NAME } = process.env;

export async function connectDB() {
  try {
    await mongoose.connect(URI, {
      dbName: DB_NAME
    });
  } catch (err) {
    console.error('連接 MongoDB 失敗：', err.message);
  }
}