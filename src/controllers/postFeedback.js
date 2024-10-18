import { postModel } from "../models/postModel.js"
import { commentModel } from "../models/commentModel.js"


// 留言功能
export async function addComment(req, res) {
    let { postId, parentCommentId, level } = req.params;
    const { content } = req.body;
    const commenterId = req.userInfo.userId; //來自loginCheck

    if (!content || content.trim().length === 0) {      // trim() 去除頭尾空格
        return res.status(400).json({ message: "評論內容不能為空" });
    }
    const post = await postModel.findById(postId);
    if (!post) {
        console.log("addComment.js 中的 try{} 中的 if (!post)");
        return res.status(404).json({ message: "文章不存在" });
    }

    //整理路由參數 (express 路由參數育社會以str傳遞)
    parentCommentId = parentCommentId === '0' ? null :
        (isNaN(parseInt(parentCommentId)) ? null : parentCommentId);
    level = isNaN(parseInt(level)) ? 0 : parseInt(level);

    if (level > 3) {  //應該不會遇到，會在前端就擋下來
        console.log("嵌套次數大於3, 無法再嵌套留言");
        return res.status(400).json({ message: "無法再嵌套留言" });
    }

    const Change = { comment: false, post: false };    //之後會用到
    try {
        const newComment = new commentModel({ postId, parentCommentId, level, content, commenterId });
        if (level > 0) {
            await commentModel.findByIdAndUpdate(
                parentCommentId,
                { $inc: { childrenCount: 1, } },
                { new: true, runValidators: true }
            )
        }

        // 更新文章的總留言數
        await postModel.findByIdAndUpdate(
            postId,
            { $inc: { commentsCount: 1 } },
            { new: true, runValidators: true }
        );

        const newCommentInDb = await newComment.save();
        return res.json({ message: "留言成功", newCommentInDb });
    } catch (err) {
        console.error(`addComment 發生錯誤：${err}`);
        res.status(500).json({ message: "留言失敗", error: err.message });
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
