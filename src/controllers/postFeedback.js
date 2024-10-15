import { postModel } from "../models/postModel.js"


// 留言功能
export async function addComment(req, res) {
    const { postId, parentCommentId } = req.params;
    const { content } = req.body;
    const userId = req.userInfo.userId; //來自loginCheck.js

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "評論內容不能為空" });
    }

    try {
        const post = await postModel.findById(postId);
        let newComment;

        if (!parentCommentId) { //parentCommentId 不存在，所以是一般留言
            newComment = {
                commenter: userId,
                content,
                isChild: false,
                parentComment: null
            }
            post.comments.push(newComment);
            post.commentsCount += 1;

        } else {                //parentCommentId 存在，所以是子留言
            newComment = {
                commenter: userId,
                content,
                isChild: true,
                parentComment: parentCommentId,
                order: post.comments.find(a => a._id.toString() === parentCommentId).order + 1
            }
            post.comments.push(newComment);
            post.commentsCount += 1;
            post.comments.find(a => a._id.toString() === parentCommentId).clildCount += 1;

        }

        await post.save();
        return res.json({
            message: "留言成功",
            文章標題: post.title,
            留言資訊: {
                留言者: newComment.commenter.account,
                留言內容: newComment.content,
                父留言內容: parentCommentId ? post.comments.find(a => a._id.toString() === parentCommentId).content : null,
                是否為子評論: newComment.isChild,
                留言時間: newComment.createdAt
            }
        });
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
