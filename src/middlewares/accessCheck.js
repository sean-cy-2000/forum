import { commentModel } from '../models/commentModel.js';
import { postModel } from '../models/postModel.js';

export async function accessCheck(req, res, next) {
    const { userId } = req.userInfo;
    const { postId, commentId } = req.params;

    try {
        if (postId) {
            req.postAccess = await postCheck(userId, postId);
        }
        if (commentId) {
            req.commentAccess = await commentCheck(userId, commentId);
        }
        next();
    } catch (err) {
        res.status(500).json({ message: "權限不足", error: err.message });
    }
}

async function postCheck(uid, pid) {
    const post = await postModel.findById(pid);
    return post && post.postOwnerId.toString() === uid;
}

async function commentCheck(uid, cid) {
    const comment = await commentModel.findById(cid);
    return comment && comment.commenterId.toString() === uid;
}