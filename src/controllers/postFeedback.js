import { postModel } from "../models/postModel.js"
import { commentModel } from "../models/commentModel.js"

// 留言功能
export async function addComment(req, res) {
    let { postId, parentCommentId } = req.params;
    const { content } = req.body;
    const commenterId = req.userInfo.userId;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "評論內容不能為空" });
    }
    const post = await postModel.findById(postId);
    if (!post) {
        return res.status(404).json({ message: "文章不存在" });
    }

    parentCommentId = (parentCommentId === '0' || parentCommentId === undefined) ? null : parentCommentId;  //把0以及undefined改為null
    let parentComment = null, level = 0;

    if (parentCommentId) {
        parentComment = await commentModel.findById(parentCommentId);
        if (!parentComment) {
            return res.status(404).json({ message: "父評論不存在" });
        }
        if (parentComment.level > 2) {
            return res.status(400).json({ message: "無法再嵌套留言" });
        }
        level = parentComment.level + 1;
    }

    try {
        const newComment = new commentModel({ postId, parentCommentId, level, content, commenterId });
        const newCommentInDb = await newComment.save();
        if (parentComment) {
            await commentModel.findByIdAndUpdate(
                parentCommentId,
                {
                    $inc: { childrenCount: 1 },
                    $push: { childrenId: newCommentInDb._id }
                },
                { new: true, runValidators: true }
            );
        }

        await postModel.findByIdAndUpdate(postId,
            { $inc: { commentsCount: 1 } },
            { new: true, runValidators: true }
        );

        await updateAncestorDescendants(newComment._id, 1);

        return res.json({ message: "留言成功", newCommentInDb });
    } catch (err) {
        res.status(500).json({ message: "留言失敗", error: err.message });
    }
}

//更新所有祖先的後代數量
async function updateAncestorDescendants(commentId, change) {
    try {
        let currentComment = await commentModel.findById(commentId);
        if (!currentComment || !currentComment.parentCommentId) return;
        const allAncestorId = [];
        while (currentComment.parentCommentId) {
            allAncestorId.push(currentComment.parentCommentId);
            currentComment = await commentModel.findById(currentComment.parentCommentId);
        }

        if (allAncestorId.length > 0) {
            await commentModel.updateMany(
                { _id: { $in: allAncestorId } },
                { $inc: { descendantsCount: change } },
                { new: true }
            );
        }
    } catch (err) {
        console.log("更新祖先的後代數量失敗：", err);
        throw err;
    }
}

export async function deleteComment(req, res) {
    const { postId, commentId } = req.params;
    const { commentAccess } = req;
    if (!postId || !commentId) return res.status(404).json({ message: "文章或留言不存在" });
    if (!commentAccess) return res.status(403).json({ message: "權限不足" });

    try {
        const comment = await commentModel.findById(commentId);

        if (!comment) return res.status(404).json({ message: "留言不存在" });

        const descendantsId = await getArrWTDelete(comment);  //從下面的getArrWTDelete獲取要山除的id的陣列
        if (descendantsId.length !== comment.descendantsCount) {
            console.log("得到的子孫數量跟資料庫中的紀錄不符(來自deleteComment函數)");
            return res.status(500).json({ message: "伺服器錯誤" });
        }
        descendantsId.push(commentId);          //把自己加入要刪除的陣列中

        // 更新文章的評論數
        await postModel.findByIdAndUpdate(
            postId,
            { $inc: { commentsCount: -descendantsId.length } },
            { new: true }
        );

        // 更新父評論的子評論數
        if (comment.parentCommentId) {
            await commentModel.findByIdAndUpdate(
                comment.parentCommentId,
                {
                    $inc: { childrenCount: -1 },  // 更新子評論數量
                    $pull: { childrenId: commentId }  // 從childrenId數組中移除被刪除的評論ID
                },
                { new: true }
            );
        }

        await updateAncestorDescendants(commentId, -descendantsId.length);  //來自上方，更改祖先留言的後代數量
        await commentModel.deleteMany({ _id: { $in: descendantsId } });     //db.comments.deleteMany({ _id: { $in: [ObjectId("id1"), ObjectId("id2"), ObjectId("id3")] } })

        return res.json({ message: "刪除成功" })
    } catch (err) {
        console.log("刪除失敗:", err);
        return res.status(500).json({ message: "刪除失敗", error: err });
    }
}

//在deleteComment中獲取需要刪除的留言id的陣列
async function getArrWTDelete(comment) {
    let currentComment = comment;
    const allChildren = [];

    async function getAllChildren(theComment) {
        if (!theComment) return;
        try {
            for (let childId of theComment?.childrenId ?? []) {    //childrenId陣列中的元素命名為childId，其中 ?. 以及 ?? 
                if (!childId) continue;
                allChildren.push(childId);

                const childComment = await commentModel.findById(childId);  //搜尋子評論的childrenId陣列

                if (childComment?.childrenId?.length > 0) await getAllChildren(childComment);
            }
        } catch (err) {
            console.log("getArrWTDelete時發生錯誤:", err);
            throw err;
        }
    }

    await getAllChildren(currentComment);   //執行上面的 getAllChildren

    return allChildren;
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