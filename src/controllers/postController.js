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
        /* newPostInDb 是 newPost 所除存的值，例如：{
            _id: ObjectId("5f8a7b234d9f3a2b5c7d8e9f"),
            postOwnerId: "87878",
            title: "aaa",
            content: "bbb",
            category: "ccc",
            tags: ["eee", "fff"],
            createdAt: ISODate("2023-10-08T12:00:00Z"),
            updatedAt: ISODate("2023-10-08T12:00:00Z"),
            replyCount: 0,
            likeCount: 0,
            status: "public"
            } */
    } catch (err) {
        console.error(`createPost 函數發生錯誤:${err}`);
        return res.status(500).json({ message: "建立新文章時發生錯誤", error: err.message });
    }
}


// 修改文章
export async function editPost(req, res) {
    const { postId } = req.params;    //通常 id 類的東西會放在 url 中
    const { title, content, category, tags } = req.body;

    const postWToEdit = await postModel.findById(postId);
    if (!postWToEdit) {
        return res.status(404).json({ message: "找不到指定的文章" });
    }

    try {
        if (title) postWToEdit.title = title;
        if (content) postWToEdit.content = content;
        if (category) postWToEdit.category = category;
        if (tags) postWToEdit.tags = tags;
        postWToEdit.updatedAt = new Date();

        const updatedPost = await postWToEdit.save();

        return res.json({
            message: "文章已成功更新",
            updatedPost
        })
    } catch (err) {
        console.error(`更新文章時發生錯誤：${err}`);
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

// 取得文章資訊
export async function getPostInfo(req, res) {
    const { postId } = req.params;

    try {
        const postInfo = await postModel.findById(postId);
        if (!postInfo) {
            console.log("getPostInfo 錯誤, (在postController.js中)");
            return res.status(404).json({ message: "找不到指定的文章" });
        }
        return res.json({ message: "已獲取文章資訊", postInfo });
    } catch (err) {}
}

// 獲取文章列表
export async function getPostList(req, res) {
    
}