import { postModel } from "../models/postModel.js"
import { commentModel } from "../models/commentModel.js";
import { userModel } from "../models/userModel.js";

// 建立新文章
export async function createPost(req, res) {
    const { title, content, category, tags } = req.body;
    const postOwnerId = req.userInfo.userId;

    try {
        const newPost = new postModel({ postOwnerId, title, content, category, tags });
        const newPostInDb = await newPost.save();
        const newPostOwner = await userModel.findByIdAndUpdate(
            postOwnerId,
            { $addToSet: { allPost: newPostInDb._id } },
            { new: true }
        );

        return res.json({ message: "成功創建新文章", newPostInDb, creator: newPostOwner.account, test: true });
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: "建立新文章時發生錯誤", error: err.message });
    }
}

// 修改文章
export async function editPost(req, res) {
    const { postId } = req.params;
    const { title, content, category, tags } = req.body;

    if (!req.postAccess) return res.status(403).json({ message: "權限不足" });

    try {
        const postWToEdit = await postModel.findByIdAndUpdate(postId, { title, content, category, tags }, { new: true, runValidators: true });

        if (!postWToEdit) {
            return res.status(404).json({ message: "找不到指定的文章" });
        }

        return res.json({ message: "文章已成功更新", postWToEdit, test: true });
    } catch (err) {
        return res.status(500).json({ message: "更新文章時發生錯誤", error: err.message });
    }
}

// 刪除文章
export async function deletePost(req, res) {
    const { postId } = req.params;

    if (!req.postAccess) return res.status(403).json({ message: "權限不足" });

    try {
        const dieComment = await commentModel.deleteOne({ postId });
        if (!dieComment) {
            return res.status(404).json({ message: "刪除文章的留言失敗" });
        }
        const postWToDelete = await postModel.findByIdAndDelete(postId);
        if (!postWToDelete) {
            return res.status(404).json({ message: "找不到指定的文章" });
        }
        return res.json({ message: "文章已成功刪除", postWToDelete, test: true });
    } catch (err) {
        return res.status(500).json({ message: "刪除文章時發生錯誤", error: err.message });
    }
}

// 取得文章數量(首頁)
export async function getPostsCount(req, res) {
    let { tags } = req.params;
    let searchTags = tags ? tags.split(',') : null;

    try {
        const count = await postModel.countDocuments(
            searchTags?.length ? {
                tags: { $in: searchTags }
            } : {}
        );
        res.json({ message: "已成功取得文章數量", count });
    } catch (err) {
        res.status(500).json({ message: "無法取得文章數量", error: err.message });
    }
}

// 取得所有文章以及分頁(首頁)
export async function getPosts(req, res) {
    let { sortBy, limitSize, direction, tags, page } = req.params;
    let searchTags = tags ? tags.split(',') : null;
    page = Math.round(Number(page)) || 1;           // 預設為第 1 頁
    limitSize = Math.round(Number(limitSize)) || 10;    // 預設一頁 10 篇文章 
    direction = Number(direction);
    if ((direction !== 1 && direction !== -1) || !limitSize || limitSize <= 0)
        return res.status(403).json({ message: 'direction 或 limitSize 錯誤' });
    const sorByRange = ['commentsCount', 'createdAt', 'likersCount', 'collectorsCount'];
    if (!sorByRange.includes(sortBy)) {
        return res.status(403).json({ message: 'sortBy 錯誤' });
    }
    const sortFunction = { [sortBy]: direction };

    try {
        const posts = await postModel.find(
            searchTags?.length ? {
                tags: { $in: searchTags }
            } : {}
        )
            .select('_id postOwnerId title commentsCount likersCount collectorsCount createdAt')
            .populate('postOwnerId', 'account')
            .sort(sortFunction)
            .skip((page - 1) * limitSize)
            .limit(limitSize);
        res.json({ message: "已成功取得所有文章", posts });
    } catch (err) {
        res.status(500).json({ message: "無法取得文章", error: err.message });
    }
}

// 獲取文章資訊(點入某篇文章時使用)
export async function getPostInfo(req, res) {
    const { postId } = req.params;
    const post = await postModel.findById(postId).populate('postOwnerId', 'account');
    if (!post) {
        return res.status(404).json({ message: "文章不存在" });
    }
    try {
        res.json({
            message: "成功獲取文章資訊",
            post: {
                postOwnerId: post.postOwnerId,
                postOwnerAccount: post.postOwnerId.account,
                title: post.title,
                content: post.content,
                tags: post.tags,
                commentsCount: post.commentsCount,
                likersCount: post.likersCount,
                collectorsCount: post.collectorsCount,
                editAt: post.editAt,
                createdAt: post.createdAt
            }
        });
    } catch (err) {
        console.log("getPostInfo失敗:", err);
        res.status(500).json({ message: "無法獲取文章資訊", error: err.message });
    }
}

// 獲取level 0留言(點入某篇文章時使用)
export async function getLevel_0_Comments(req, res) {
    const { postId } = req.params;

    try {
        const level0Comments = await commentModel
            .find({ postId, level: 0 })
            .populate('commenterId', 'account')
            .select('content likersCount editAt createdAt')
            .lean();

        const formattedComments = level0Comments.map(comment => ({
            id: comment._id,
            content: comment.content,
            commenterAccount: comment.commenterId.account,
            likesCount: comment.likersCount,
            editAt: comment.editAt,
            createdAt: comment.createdAt,
            childrenCount: comment.childrenCount,
            descendantsCount: comment.descendantsCount
        }));

        res.json({
            message: "成功獲取頂層留言",
            comments: formattedComments
        });
    } catch (err) {
        res.status(500).json({ message: "無法獲取留言", error: err.message });
    }
}

// 獲取特定留言的所有子留言
export async function getChildrenComments(req, res) {
    const { commentId } = req.params;

    try {
        const descendants = await commentModel
            .find({ parentCommentId: commentId })
            .populate('commenterId', 'account')
            .select('content level parentCommentId childrenId likersCount editAt createdAt')
            .lean();

        res.json({
            message: "成功獲取子留言",
            descendants: descendants
        });
    } catch (err) {
        res.status(500).json({ message: "無法獲取子留言", error: err.message });
    }
}