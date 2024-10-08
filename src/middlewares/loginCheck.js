import jwt from 'jsonwebtoken';

export async function loginCheck(req, res, next) {
  try {
    const header = req.headers['authorization'];  //請求中的 headers 可能不只 authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: '身份驗證錯誤:headers 錯誤' });
    }

    const token = header.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '份驗證錯誤:token 錯誤' });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    /* verify 的語法是 jwt.verify(token, jwt_key, [options, callback])
    decoded 代表解碼後的資料，對應 loginUser 中寫入的：
    { userId: userInDB._id, account: userInDB.account }
    */

    req.userInfo = decoded;

    next();

  } catch (err) {
    return res.status(403).json({ message: 'Token 驗證錯誤：', err });
  }
}