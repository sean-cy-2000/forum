import express from 'express';
import {
    registerUser, loginUser, getUserInfo, deleteUser, getUserAccount,
    getMyPosts, getMyCollects
} from '../controllers/userController.js';
import { loginCheck } from '../middlewares/loginCheck.js';

const router = express.Router();

router.get('/ec2', (req, res) => {
    res.json({ message: 'ec2測試成功' });
})

router.post('/register', registerUser);
router.post('/login', loginUser);
//當客户端發送一個 POST 請求到 /register 或 /login 時，就會執行後面的程式

router.delete('/delete', loginCheck, deleteUser);

router.get('/getUserInfo', loginCheck, getUserInfo);
router.get('/getMyPosts', loginCheck, getMyPosts);
router.get('/getMyCollects', loginCheck, getMyCollects);


router.get('/getUserAccount/:userId', getUserAccount);

export default router;  //用defalt，這樣import時就不用加花括號