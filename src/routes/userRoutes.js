import express from 'express';
import { registUser, loginUser, getUserNmae, deleteUser } from '../controllers/userController.js';
import { loginCheck } from '../middlewares/loginCheck.js';

const router = express.Router();

router.post('/regist', registUser);
router.post('/login', loginUser);
//當客户端發送一個 POST 請求到 /register 或 /login 時，就會執行後面的程式

router.delete('/delete', loginCheck, deleteUser);
router.get('/userInfo', loginCheck, getUserNmae);

export default router;  //用defalt，這樣import時就不用加花括號