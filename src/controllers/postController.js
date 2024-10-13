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
    } catch (err) {
        console.error(`function getPostInfo 發生錯誤：${err}`);
        return res.status(500).json({ message: "刪除文章時發生錯誤", error: err.message });
    }
}

// 留言功能
export async function addComment(req, res) {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.userInfo.userId; //來自loginCheck.js

    try {
        const post = await postModel.findByIdAndUpdate(
            postId,
            {
                $push: { comments: { commenter: userId, content } },
                $inc: { commentsCount: 1 }  // $inc 用來增加指定欄位的數字
            },
            { new: true, runValidators: true }
        ).populate("comments.commenter", "account");

        /* populate 的第一個參數必須是 Schema.Types.ObjectId 型態，第二個是要查訊的欄位名 
        comments.commenter 原本的型態可能是 ObjectId('亂數id')
        .populate("comments.commenter", "account") 
        會將 findByIdAndUpdate 查詢的這筆資料中的 comments.commenter 抓出來
        再根據再去它所連結的資料表(也就是 user ，因為在 userSchema 中設定了 ref)中抓出 account
        在將 account 加入 populate 中，變成物件的形式 { ObjectId: "ObjectId", account: "account" } 
        */

        if (!post) {
            return res.status(404).json({ message: "找不到指定的文章(addComment)" });
        }

        const newComment = post.comments[post.comments.length - 1];
        // 此時 post 是物件，其中的 comments 是陣列，用 [post.comments.length - 1] 取得最新一筆留言

        return res.json({
            message: "留言成功",
            文章標題: post.title,
            留言資訊: {
                留言者: newComment.commenter.account,
                留言內容: newComment.content,
                留言時間: newComment.createdAt
            }
        });
    } catch (err) {
        console.error(`addComment 發生錯誤：${err}`);
        return res.status(500).json({ message: "留言時發生錯誤", error: err.message });
    }
}

// 點贊
export async function addLike(req, res) {
    const { postId } = req.params;
    const userId = req.userInfo.userId;

    try {
        const like = await postModel.findOneAndUpdate(
            { _id: postId, likers: { $ne: userId } },  // 確保用戶還沒有點贊
            {
                $addToSet: { likers: userId },
                $inc: { likersCount: 1 }
            },
            { new: true, runValidators: true }
        );

        if (like) return res.json({ message: "點贊成功", like });

        const unlike = await postModel.findOneAndUpdate(
            { _id: postId, likers: userId },
            {
                $pull: { likers: userId },
                $inc: { likersCount: -1 }
            },
            { new: true, runValidators: true }
        );

        if (unlike) return res.json({ message: "取消點贊", unlike });

        console.log("既沒有點贊也沒有取消點贊，大概是因為找不到指定的文章");
        return res.status(404).json({ message: "文章不存在" });

    } catch (err) {
        console.error(`addLike 發生錯誤：${err}`);
        return res.status(500).json({ message: "點讚錯誤", error: err.message });
    }
}

// 收藏
export async function addCollect(req, res) {
    const { postId } = req.params;
    const userId = req.userInfo.userId;

    try {
        const collect = await postModel.findOneAndUpdate(
            { _id: postId, collectors: { $ne: userId } },  // 確保用戶還沒有收藏
            {
                $addToSet: { collectors: userId },
                $inc: { collectorsCount: 1 }
            },
            { new: true, runValidators: true }
        );

        if (collect) return res.json({ message: "收藏成功", collect });


        const uncollect = await postModel.findOneAndUpdate(
            { _id: postId, collectors: userId },
            {
                $pull: { collectors: userId },
                $inc: { collectorsCount: -1 }
            },
            { new: true, runValidators: true }
        );

        if (uncollect) return res.json({ message: "取消收藏", uncollect });

        console.log("既沒有收藏也沒有取消收藏，大概是因為找不到指定的文章");
        return res.status(404).json({ message: "文章不存在" });

    } catch (err) {
        console.error(`addCollect 發生錯誤：${err}`);
        return res.status(500).json({ message: "收藏錯誤", error: err.message });
    }
}