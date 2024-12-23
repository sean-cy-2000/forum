import mongoose from 'mongoose';
import { postModel } from "../models/postModel.js"
import { commentModel } from "../models/commentModel.js"
import { userModel } from "../models/userModel.js"

// 獲取祖先留言
async function getAncestors(currentCommentId) {
    try {
        const allAncestors = await commentModel.aggregate([
            { $match: { _id: currentCommentId } },
            {
                $graphLookup: {
                    from: "comments",
                    startWith: "$parentCommentId",
                    connectFromField: "parentCommentId",
                    connectToField: "_id",
                    as: "ancestors"
                }
            },
            {
                $project: {
                    "ancestors._id": 1
                }
            },
            {
                $addFields: {
                    ancestors: "$ancestors._id"
                }
            }
        ]);
        return allAncestors[0] || null; // allAncestors 會是一個陣列，理論上只會有一個值，所以加上[0]
    } catch (err) {
        console.log("獲取祖先留言失敗:", err);
        throw err;
    }
}

// 獲取子孫留言
async function getDescendants(currentCommentId) {
    const currentComment = await commentModel.findById({ _id: currentCommentId });
    if (!currentComment) { console.log("沒有子孫留言"); return []; }

    try {
        const allDescendants = await commentModel.aggregate([
            { $match: { _id: currentComment._id } },
            {
                $graphLookup: {
                    from: "comments",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "parentCommentId",
                    as: "descendants",
                    maxDepth: 3,
                }
            },
            {
                $project: {
                    "descendants._id": 1
                }
            },  // 此時allDescendants: [{_id: "當前留言的id",descendants: [ { _id: id 1 }, {_id:id 2 }...]}] descendants陣列, 內部是物件
            {
                $addFields: {
                    descendants: "$descendants._id"  // $descendants._id 類似js中的 descendants.map(d => d._id)
                }
            }   // 輸出: [{_id: "當前留言的id",descendants: [ "id 1", "id 2" ]}]
        ]);
        const descendants = allDescendants[0]?.descendants || [];
        return { descendants, descendantsCount: descendants.length }    // 返回 ["id 1", "id 2",... ] 以及子孫數量
    } catch (err) {
        console.log("獲取子孫留言失敗:", err);
        throw err;
    }
}

// 刪除所有子孫留言
async function deleteDescendants(idsToDelete) {  // idsToDelete 是陣列，從getDescendants 中獲得
    if (!idsToDelete || idsToDelete.length === 0) return { deletedCount: 0 };
    const expecedCount = idsToDelete.length;    // 預期刪除的數量
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const deleteResult = await commentModel.deleteMany({ _id: { $in: idsToDelete } });
        if(deleteResult.deletedCount !== expecedCount) {
            throw new Error("刪除留言數量與預期不符");
        }
        await session.commitTransaction();
        return { deletedCount: deleteResult.deletedCount };

    } catch (err) {
        console.log("刪除子孫留言失敗:", err);
        await session.abortTransaction();
        throw err;
    }finally {
        await session.endSession();
    }
}

export async function deleteComment(req, res) {
    const { commentId } = req.params;
    const currentComment = await commentModel.findById(commentId);
    if (!currentComment) return res.status(404).json({ message: "留言不存在" });
    if (!req.commentAccess) return res.status(403).json({ message: "權限不足" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const ancestors = await getAncestors(commentId);        // 獲取祖先留言
        const descendantIds = await getDescendants(commentId);  // 子勳留言的陣列

        const totalDeleteCount = descendantIds.length + 1;      // 子孫數量加上當前留言

        // 更新祖先的子孫數量
        if (ancestors?.ancestors?.length > 0) {
            await commentModel.updateMany(
                { _id: { $in: ancestors.ancestors } },
                { $inc: { descendantsCount: -totalDeleteCount } },
                { session }
            );
        }

        // 如果有父留言，更新父留言的子留言資訊
        if (currentComment.parentCommentId) {
            await commentModel.findByIdAndUpdate(
                currentComment.parentCommentId,
                {
                    $pull: { childrenId: commentId },
                    $inc: { childrenCount: -1 }
                },
                { session }
            );
        }

        // 刪除所有子孫留言
        if (descendantIds.length > 0) {
            const deleteResult = await deleteDescendants(descendantIds);
            if (deleteResult.deletedCount !== descendantIds.length) {
                throw new Error("子孫留言刪除數量與預期不符");
            }
        }

        // 刪除當前留言
        await commentModel.deleteOne(
            { _id: commentId },
            { session }
        );

        // 更新文章的留言總數
        await postModel.findByIdAndUpdate(
            currentComment.postId,
            { $inc: { commentsCount: -totalDeleteCount } },
            { session }
        );

        await session.commitTransaction();        
        return res.json({
            message: `留言id:${commentId} 已成功刪除, 加上其子孫留言總共刪除${totalDeleteCount}個`
        });

    } catch (err) {
        await session.abortTransaction();
        console.error("刪除留言失敗:", err);
        res.status(500).json({ message: "刪除留言失敗", error: err.message });
    } finally {
        await session.endSession();
    }
}

// 修改祖先留言的子孫數量
async function updateAllAncestors(currentCommentId, descendantsChange) {
    try {
        const arr = await getAncestors(currentCommentId);
        if (!arr || !arr.ancestors || arr.ancestors.length === 0) { //本身不存在或是沒有祖先
            return { modifiedCount: 0 };
        }

        const updateResult = await commentModel.updateMany(
            { _id: { $in: arr.ancestors } },
            { $inc: { descendantsCount: descendantsChange } },
            { new: true }
        );

        return { modifiedCount: updateResult.modifiedCount };   //modifiedCount 是 mongodb內建的方法
    } catch (err) {
        console.log("更新祖先留言數量失敗:", err);
        throw err;
    }
}

// 新增留言
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

    if (parentCommentId) {  // 確認留言的層級
        parentComment = await commentModel.findById(parentCommentId);
        if (!parentComment) {
            return res.status(404).json({ message: "父評論不存在" });   // 請求中有父留言，但是實際上該父留言不存在
        }
        if (parentComment.level > 2) {
            return res.status(400).json({ message: "無法再嵌套留言" });
        }
        level = parentComment.level + 1;
    }

    try {
        const newComment = await commentModel.create({
            postId,
            parentCommentId,
            level,
            content,
            commenterId
        });
        const updateResult = await updateAllAncestors(newComment._id, 1);    //使用上面的函數
        if (updateResult.modifiedCount !== level) throw new Error("實際更新的祖先留言數量跟當前留言的level不符");

        // 如果父留言存在, 就把新增的留言增加到父留言的子留言陣列中, 並把childrenCount +1
        if (parentCommentId) {
            await commentModel.findByIdAndUpdate(

                parentCommentId,
                {
                    $addToSet: { childrenId: newComment._id },
                    $inc: { childrenCount: 1 }
                },
                { new: true }
            );
        }

        await postModel.findByIdAndUpdate(
            postId, //  把所屬文章的總留言數 + 1
            { $inc: { commentsCount: 1 } },
            { new: true }
        );

        return res.json({ message: "留言成功", newComment });
    } catch (err) {
        res.status(500).json({ message: "留言失敗", error: err.message });
    }
}

// 點贊功能
export async function addLike(req, res) {
    const { idType, id } = req.params;
    const userId = req.userInfo.userId;

    // lookup(查找) 語法
    const model = {
        'post': postModel,
        'comment': commentModel
    }[idType];

    if (!model) {
        return res.status(400).json({ message: "點贊型態錯誤" });
    }

    try {
        const like = await model.findOneAndUpdate(
            { _id: id, likers: { $ne: userId } },   // $ne: not equal的意思, userId不存在於likers. 多個變數的版本: %nin(not in)
            { $addToSet: { likers: userId }, $inc: { likersCount: 1 } },    // $addToset 不會讓原俗重複出現，pusj會
            { new: true, runValidators: true }
        );

        if (like) return res.json({ message: "點贊成功", like });

        // 如果已經點過贊，則取消點贊
        const unlike = await model.findOneAndUpdate(
            { _id: id, likers: { $in: [userId] } },
            { $pull: { likers: userId }, $inc: { likersCount: -1 } },
            { new: true, runValidators: true }
        );

        if (unlike) return res.json({ message: "取消點贊", unlike });

        // 如果找不目標
        return res.status(404).json({
            message: `${idType === 'post' ? '文章' : '留言'}不存在`
        });

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
            { _id: postId, collectors: { $ne: [userId] } },
            { $addToSet: { collectors: userId }, $inc: { collectorsCount: 1 } },
            { new: true, runValidators: true }
        );
        const userCollect = await userModel.findOneAndUpdate(
            { _id: userId },
            { $addToSet: { allCollect: postId } },
            { new: true, runValidators: true }
        );

        if (collect) return res.json({ message: "收藏成功", collect, collector: userCollect.account });

        const uncollect = await postModel.findOneAndUpdate(
            { _id: postId, collectors: { $in: [userId] } },
            { $pull: { collectors: userId }, $inc: { collectorsCount: -1 } },
            { new: true, runValidators: true }
        );
        const userUncollect = await userModel.findOneAndUpdate(
            { _id: userId },
            { $pull: { allCollect: postId } },
            { new: true, runValidators: true }
        );

        if (uncollect) return res.json({ message: "取消收藏", uncollect, collector: userUncollect.account });

        return res.status(404).json({ message: "文章不存在" });
    } catch (err) {
        return res.status(500).json({ message: "收藏錯誤", error: err.message });
    }
}

//修改留言內容
export async function editComment(req, res) {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!req.commentAccess) return res.status(403).json({ message: "權限不足" });

    try {
        const editedComment = await commentModel.findOneAndUpdate(
            { _id: commentId },
            { content, editAt: new Date() },
            { new: true, runValidators: true });

        if (!editedComment) {
            return res.status(404).json({ message: "找不到指定的留言" });
        }

        return res.json({ message: "留言已成功更新", editedComment });
    } catch (err) {
        return res.status(500).json({ message: "更新留言時發生錯誤", error: err.message });
    }
}

