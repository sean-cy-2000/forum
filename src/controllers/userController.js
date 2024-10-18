import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/userModel.js';

// 註冊方法
export async function registUser(req, res) {
  const { account, password } = req.body;

  try {
    // 檢查是否存在
    const exist = await userModel.findOne({ account });  // { account:account }
    if (exist) return res.json({ message: '用戶名已存在' });

    // 創建新用戶
    const password_hash = await bcrypt.hash(password, 5);
    const newUser = new userModel({ account, password_hash });
    await newUser.save();

    res.status(201).json({ message: '用戶註冊成功', test: true });
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

    res.json({ message: '登錄成功', token, test: true });
  } catch (err) {
    console.error('登錄時發生錯誤:', err);
    res.status(403).json({ message: '登入失敗' });
  }
}

export async function getUserInfo(req, res) {
  // req.userInfo 是在 loginCheck 中間件設為解密後的 token，也就是{ userId: user._id, account: user.account }
  try {
    const { userId, account } = req.userInfo;
    const userInfo = await userModel.findOne({ _id: userId, account }).select('-password_hash');
    if (!userInfo) return res.status(404).json({ message: '用戶不存在' });
    return res.json({ message: "已獲取個人資料", userInfo, test: true });
  } catch (err) {
    console.error("getUserInfo 發生錯誤:", err);
    return res.status(500).json({ message: "伺服器錯誤" });
  }
}

// 獲取權限
export async function checkAccess(req, res) {
  const { access } = req;
  if (access) return res.json({ access });
  return res.json({ access: false, test: true });
}

export async function deleteUser(req, res) {
  const { userId } = req.userInfo;
  try {
    await userModel.deleteOne({ _id: userId });
    res.json({ message: '刪除成功', test: true });
  } catch (err) {
    console.error('刪除用戶時發生錯誤:', err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
}