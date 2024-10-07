import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/userModel.js';

// 註冊方法
export async function registUser(req, res) {
  const { account, password } = req.body;

  try {
    // 檢查是否存在
    const existingUser = await userModel.findOne({ account });  // { account:account }
    if (existingUser) return res.json({ message: '用戶名已存在' });

    // 創建新用戶
    const password_hash = await bcrypt.hash(password, 5);
    const newUser = new userModel({ account, password_hash });
    await newUser.save();

    res.status(201).json({ message: '用戶註冊成功' });
  } catch (err) {
    console.error('註冊用戶時發生錯誤:', err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
}

// 登入方法
export async function loginUser(req, res) {
  const { account, password } = req.body;

  try {
    // 檢查帳號是否存在
    const userInDB = await userModel.findOne({ account });  // { account:account }
    if (!userInDB) return res.status(404).json({ message: '用戶不存在' });

    const isPasswordValid = await bcrypt.compare(password, userInDB.password_hash);
    // 驗證密碼，bcrypt.compare 會自動將第一參數轉為哈西然後跟第二參數鄉比較
    if (!isPasswordValid) return res.status(401).json({ message: '密碼錯誤' });

    // 生成 JWT
    const token = jwt.sign(
      { userId: userInDB._id, account: userInDB.account },
      process.env.JWT_KEY,
      { expiresIn: '1h' } //此 token 持續多久

    );

    res.json({ message: '登錄成功', token });
  } catch (err) {
    console.error('登錄時發生錯誤:', err);
    res.status(403).json({ message: '登入失敗' });
  }
}

export function getUserInfo(req, res) {
  // req.userInfo 是在 loginCheck 中間件設為解密後的 token，也就是{ userId: user._id, account: user.account }
  res.json({ message: "已獲取個人資料：", user: req.userInfo });
}