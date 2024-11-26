import { postModel } from "../models/postModel.js"
import { commentModel } from "../models/commentModel.js";

// 建立新文章
export async function createPost(req, res) {
    const { title, content, category, tags } = req.body;
    const postOwnerId = req.userInfo.userId;

    try {
        const newPost = new postModel({ postOwnerId, title, content, category, tags });
        const newPostInDb = await newPost.save();

        return res.json({ message: "以成功創建新文章", newPostInDb, createPostTest: true });
    } catch (err) {
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

        return res.json({ message: "文章已成功更新", postWToEdit, editPostTest: true });
    } catch (err) {
        return res.status(500).json({ message: "更新文章時發生錯誤", error: err.message });
    }
}

// 刪除文章
export async function deletePost(req, res) {
    const { postId } = req.params;

    if (!req.postAccess) return res.status(403).json({ message: "權限不足" });

    try {
        const dieComment = await commentModel.deleteMany(postId);
        if (!dieComment) {
            return res.status(404).json({ message: "刪除文章的留言失敗" });
        }
        const postWToDelete = await postModel.findByIdAndDelete(postId);
        if (!postWToDelete) {
            return res.status(404).json({ message: "找不到指定的文章" });
        }
        return res.json({ message: "文章已成功刪除", postWToDelete, deletePostTest: true });
    } catch (err) {
        return res.status(500).json({ message: "刪除文章時發生錯誤", error: err.message });
    }
}

// 取得所有文章
export async function getAllPosts(req, res) {
    try {
        const allPosts = await postModel.find({});
        res.json({ message: "已成功取得所有文章", allPosts });
    } catch (err) {
        res.status(500).json({ message: "無法取得文章", error: err.message });
    }
}

export async function getPostInfo(req, res) {
    const { postId } = req.params;
    const post = await postModel.findById(postId);
    if (!post) {
        return res.status(404).json({ message: "文章不存在" });
    }
    try {
        res.json({
            message: "成功獲取文章資訊",
            post: {
                title: post.title,
                content: post.content,
                category: post.category,
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

export async function getComments(req, res) {
    const { postId } = req.params;
    const comments = commentModel.findById(postId)
}