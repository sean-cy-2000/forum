import { postModel } from "../models/postModel.js"
import { commentModel } from "../models/commentModel.js";

// 建立新文章
export async function createPost(req, res) {
    const { title, content, category, tags } = req.body;
    const postOwnerId = req.userInfo.userId;

    try {
        const newPost = new postModel({ postOwnerId, title, content, category, tags });
        const newPostInDb = await newPost.save();

        return res.json({ message: "以成功創建新文章", newPostInDb, test: true });
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

// 取得所有文章(首頁)
export async function getPosts(req, res) {
    let { sortBy, limitSize, direction, tags } = req.params;
    let searchTags = tags ? tags.split(',') : null;
    limitSize = Math.round(Number(limitSize));
    direction = Number(direction);
    if ((direction !== 1 && direction !== -1) || !limitSize || limitSize <= 0)
        return res.status(403).json({ message: 'direction 或 limitSize 錯誤' });
    const sorByRange = ['commentsCount', 'createAt', 'likersCount', 'collectorsCount'];
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
            .select('_id title commentsCount likersCount collectorsCount createAt')
            .sort(sortFunction)
            .limit(limitSize);
        res.json({ message: "已成功取得所有文章", posts });
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