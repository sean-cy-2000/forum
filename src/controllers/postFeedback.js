import { postModel } from "../models/postModel.js"
import { commentModel } from "../models/commentModel.js"

// 留言功能
export async function addComment(req, res) {
    let { postId, parentCommentId, level } = req.params;
    const { content } = req.body;
    const commenterId = req.userInfo.userId;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "評論內容不能為空" });
    }
    const post = await postModel.findById(postId);
    if (!post) {
        return res.status(404).json({ message: "文章不存在" });
    }

    parentCommentId = parentCommentId === '0' ? null : (isNaN(parseInt(parentCommentId)) ? null : parentCommentId);
    level = isNaN(parseInt(level)) ? 0 : parseInt(level);

    if (level > 3) {
        return res.status(400).json({ message: "無法再嵌套留言" });
    }

    try {
        const newComment = new commentModel({ postId, parentCommentId, level, content, commenterId });
        if (level > 0) {
            await commentModel.findByIdAndUpdate(parentCommentId, { $inc: { childrenCount: 1 } }, { new: true, runValidators: true });
        }

        await postModel.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }, { new: true, runValidators: true });

        const newCommentInDb = await newComment.save();
        return res.json({ message: "留言成功", newCommentInDb });
    } catch (err) {
        res.status(500).json({ message: "留言失敗", error: err.message });
    }
}

// 點贊功能
export async function addLike(req, res) {
    const { postId } = req.params;
    const userId = req.userInfo.userId;

    try {
        const like = await postModel.findOneAndUpdate(
            { _id: postId, likers: { $ne: userId } },
            { $addToSet: { likers: userId }, $inc: { likersCount: 1 } },
            { new: true, runValidators: true }
        );

        if (like) return res.json({ message: "點贊成功", like });

        const unlike = await postModel.findOneAndUpdate(
            { _id: postId, likers: userId },
            { $pull: { likers: userId }, $inc: { likersCount: -1 } },
            { new: true, runValidators: true }
        );

        if (unlike) return res.json({ message: "取消點贊", unlike });

        return res.status(404).json({ message: "文章不存在" });
    } catch (err) {
        return res.status(500).json({ message: "點讚錯誤", error: err.message });
    }
}

// 收藏功能
export async function addCollect(req, res) {
    const { postId } = req.params;
    const userId = req.userInfo.userId;

    try {
        const collect = await postModel.findOneAndUpdate(
            { _id: postId, collectors: { $ne: userId } },
            { $addToSet: { collectors: userId }, $inc: { collectorsCount: 1 } },
            { new: true, runValidators: true }
        );

        if (collect) return res.json({ message: "收藏成功", collect });

        const uncollect = await postModel.findOneAndUpdate(
            { _id: postId, collectors: userId },
            { $pull: { collectors: userId }, $inc: { collectorsCount: -1 } },
            { new: true, runValidators: true }
        );

        if (uncollect) return res.json({ message: "取消收藏", uncollect });

        return res.status(404).json({ message: "文章不存在" });
    } catch (err) {
        return res.status(500).json({ message: "收藏錯誤", error: err.message });
    }
}
