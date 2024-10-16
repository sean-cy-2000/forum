import { postModel } from "../models/postModel.js"

// 建立新文章
export async function createPost(req, res) {
    // 預計前端會送來 { postOwnerId, title, content, category, tags }，而 postId 則會由資料庫自動生成
    const { title, content, category, tags } = req.body;
    const postOwnerId = req.userInfo.userId;

    try {
        const newPost = new postModel({ postOwnerId, title, content, category, tags });
        const newPostInDb = await newPost.save();

        return res.json({
            message: "以成功創建新文章",
            newPostInDb // newPostInDb : newPostInDb
        })
    } catch (err) {
        console.error(`createPost 函數發生錯誤:${err}`);
        return res.status(500).json({ message: "建立新文章時發生錯誤", error: err.message });
    }
}


// 修改文章
export async function editPost(req, res) {
    const { postId } = req.params;    //會放在 url 中
    const { title, content, category, tags } = req.body;

    try {
        const postWToEdit = await postModel.findByIdAndUpdate(
            postId,
            { title: title, content: content, category: category, tags: tags }, // 要改動的欄位
            { new: true, runValidators: true }
        );
        // 用 findByIdAndUpdate 取代 findById + 改動 + save
        // findByIdAndUpdate 的第一個參數是文章 id，第二個是要改動的欄位
        // 第三個是配置，new: true 會把更新後的資料回傳 postWToEdit，runValidators: true 會根據 postModel 的規則來驗證

        if (!postWToEdit) {
            return res.status(404).json({ message: "找不到指定的文章" });
        }

        return res.json({
            message: "文章已成功更新",
            postWToEdit: postWToEdit //可簡化
        });
    } catch (err) {
        console.error(`postController.js 中的 editPost 發生錯誤：${err}`);
        return res.status(500).json({ message: "更新文章時發生錯誤", error: err.message });
    }
}

// 刪除文章
export async function deletePost(req, res) {
    const { postId } = req.params;

    try {
        const postWToDelete = await postModel.findByIdAndDelete(postId);
        // 用 findByIdAndDelete 代替 findById在delete ，且 findByIdAndDelete 會回傳被刪除的資料
        if (!postWToDelete) {
            return res.status(404).json({ message: "找不到指定的文章" });
        }
        return res.json({ message: "文章已成功刪除", postWToDelete });
    } catch (err) {
        console.error(`刪除文章時發生錯誤：${err}`);
        return res.status(500).json({ message: "刪除文章時發生錯誤", error: err.message });
    }
}

// 取得一篇文章
export async function getOnePost(req, res) {
    const { postId } = req.params;

    try {
        const postInfo = await postModel.findById(postId)
            .populate('postOwnerId', 'account')
            .populate('comments.commenter', 'account');
        if (!postInfo) {
            console.log("getPostInfo 錯誤, (在postController.js中)");
            return res.status(404).json({ message: "找不到指定的文章" });
        }
        return res.json({ message: "已獲取文章資訊", postInfo });
    } catch (err) {
        console.error(`function getPostInfo 發生錯誤：${err}`);
        return res.status(500).json({ message: "獲取文章時發生錯誤", error: err.message });
    }
}

// get所有文章
export async function getAllPosts(req, res) {
    try {
        const posts = await postModel.find().sort({ createdAt: -1 }).limit(10);
        res.json(posts);
    } catch (err) {
        console.error(`getPosts 發生錯誤：${err}`);
        res.status(500).json({ message: "獲取文章失敗", error: err.message });
    }
}
