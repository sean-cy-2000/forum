import { postModel } from '../models/postModel.js';
import mongoose from 'mongoose';

export const postOwnerCheck = async (req, res, next) => {
    const { postId } = req.params;
    const { userId } = req.userInfo;

    if (!userId) {
        console.log("找不到該使用者 id (這部份在postOwnerCheck.js中)");
        return res.status(401).json({ message: "使用者身份錯誤" });
    }
    if (!postId) {
        console.log("找不到該貼文 id (這部份在postOwnerCheck.js中)");
        return res.status(404).json({ message: "該貼文不存在" });
    }

    try {
        const post = await postModel.findById(postId);
        // select 會返回 mongoose document，可以用 lean() 將其改成 js 物件。
        if (!post) {
            console.log("找不到該貼文 (這部份在postOwnerCheck.js中)");
            return res.status(404).json({ message: "該貼文不存在" });
        }

        if (post.postOwnerId.toString() !== userId.toString()) {
            console.log("使用者id與貼文擁有者id不符 (這部份在postOwnerCheck.js中)");
            return res.status(403).json({ message: "權限不足" });
        }

        req.post = post;  // 將找到的 post 附加到 req 對象，以便後續使用
        next();
    } catch (err) {
        console.error("postOwnerCheck 發生錯誤:", err);
        return res.status(500).json({ message: "伺服器錯誤" });
    }
};