import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/userModel.js';

// 註冊方法
export async function registUser(req, res) {
  const { account, password } = req.body;

  try {
    const exist = await userModel.findOne({ account });
    if (exist) return res.json({ message: '用戶名已存在' });

    const password_hash = await bcrypt.hash(password, 5);
    const newUser = new userModel({ account, password_hash });
    await newUser.save();

    res.status(201).json({ message: '用戶註冊成功', test: true });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
}

// 登入方法
export async function loginUser(req, res) {
  const { account, password } = req.body;

  try {
    const userInDB = await userModel.findOne({ account });
    if (!userInDB) return res.status(404).json({ message: '用戶不存在' });

    const isPasswordValid = await bcrypt.compare(password, userInDB.password_hash);
    if (!isPasswordValid) return res.status(401).json({ message: '密碼錯誤' });

    const token = jwt.sign({ userId: userInDB._id, account: userInDB.account }, process.env.JWT_KEY, { expiresIn: '1h' });

    res.json({ message: '登錄成功', token, test: true });
  } catch (err) {
    res.status(403).json({ message: '登入失敗' });
  }
}

// 獲取用戶資訊
export async function getUserInfo(req, res) {
  try {
    const { userId, account } = req.userInfo;
    const userInfo = await userModel.findOne({ _id: userId, account }).select('-password_hash');
    if (!userInfo) return res.status(404).json({ message: '用戶不存在' });
    return res.json({ message: "已獲取個人資料", userInfo, test: true });
  } catch (err) {
    return res.status(500).json({ message: "伺服器錯誤" });
  }
}

// 刪除用戶
export async function deleteUser(req, res) {
  const { userId } = req.userInfo;
  try {
    await userModel.deleteOne({ _id: userId });
    res.json({ message: '刪除成功', test: true });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
}
