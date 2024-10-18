import { postModel } from '../models/postModel.js';

export const postOwnerCheck = async (req, res, next) => {
    const { postId } = req.params;
    const { userId } = req.userInfo;

    if (!userId) {
        console.log("postOwnerCheck.js 沒有拿到 userId");
        return res.status(401).json({ message: "使用者身份錯誤" });
    }
    if (!postId) {
        console.log("postOwnerCheck.js 沒有拿到 postId");
        return res.status(404).json({ message: "該貼文不存在" });
    }

    try {
        const post = await postModel.findById(postId);
        // findById 會返回 mongoose document，可以用 lean() 將其改成 js 物件。
        if (!post) {
            console.log("postOwnerCheck.js 中的 try{} 中的 if (!post)");
            return res.status(404).json({ message: "該貼文不存在" });
        }

        if (post.postOwnerId.toString() !== userId.toString()) {
            console.log("postOwnerCheck.js 中的 try{} 中的 if (post.postOwnerId.toString() !== userId.toString())");
            return res.status(403).json({ message: "權限不足" });
        }

        Object.assign(req, { post, access: true });
        next();
    } catch (err) {
        console.error("postOwnerCheck.js 發生錯誤:", err);
        return res.status(500).json({ message: "伺服器錯誤" });
    }
};