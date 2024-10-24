import mongoose from 'mongoose';
import { commentModel } from '../models/commentModel.js';
import { postModel } from '../models/postModel.js';

class Comment {

  // 更新祖先留言的 descendantsCount
  static async updateDescendants(commentId, change, session) {
    let currentId = commentId;

    try {
      while (currentId) {
        const currentComment = await commentModel.findById(currentId);
        if (!currentComment || !currentComment.parentCommentId) break;  // 當前留言或是它的父留言不存在

        await commentModel.findByIdAndUpdate(
          currentComment.parentCommentId,
          { $inc: { descendantsCount: change } },
          { session }
        );

        currentId = currentComment.parentCommentId;
        //將父留言id傳給當前留言，繼續執行while，直到上面的break
      }
    } catch {
      throw new Error;
    }
  }

  // 刪除子孫留言
  static async deleteDescendants(childIds, session) {
    try {
      for (const childId of childIds) {
        const child = await commentModel.findById(childId);
        if (child && child.childCommentId.length > 0) {   //如果子留言陣列中的某的元素的子留言陣列程度大於0
          await this.deleteDescendants(child.childCommentId, session);
        }
        await commentModel.findByIdAndDelete(childId, { session });
      }
    } catch {
      throw new Error;
    }
  }

  static async create(postId, content, commenterId, parentId = null) {
    const post = await postModel.findById(postId);
    if (!post) {
      throw new Error('文章不存在');
    }

    let level = 0;
    if (parentId) {
      const parentComment = await commentModel.findById(parentId);
      if (!parentComment) {
        throw new Error('父留言不存在');
      }
      if (parentComment.level > 2) {
        throw new Error('超過最大嵌套層數');
      }
      level = parentComment.level + 1;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 建立新留言
      const comment = new commentModel({
        postId,
        content,
        commenterId,
        parentCommentId: parentId,
        level,
        childCommentId: [],
      });

      await comment.save({ session });

      // 更新文章留言數
      await postModel.findByIdAndUpdate(
        postId,
        { $inc: { commentsCount: 1 } },
        { session, runValidators: ture }
      );

      // 如果有父留言，更新資訊
      if (parentId) {
        await commentModel.findByIdAndUpdate(
          parentId,
          {
            $push: { childCommentId: comment._id },
            $inc: {
              childrenCount: 1,
              descendantsCount: 1
            }
          },
          { session }
        );

        // 更新所有上層留言的 descendantsCount
        await this.updateDescendants(parentId, 1, session);
      }

      await session.commitTransaction();
      return comment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // 刪除留言
  static async delete(commentId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const comment = await commentModel.findById(commentId);
      if (!comment) {
        throw new Error('留言不存在');
      }

      // 計算要刪除的留言總數（包括所有子孫）
      const totalDescendants = comment.descendantsCount + 1;

      // 刪除所有子孫留言
      await this.deleteDescendants(comment.childCommentId, session);

      // 刪除當前留言
      await commentModel.findByIdAndDelete(commentId, { session });

      // 更新文章的留言總數
      await postModel.findByIdAndUpdate(
        comment.postId,
        { $inc: { commentsCount: -totalDescendants } },
        { session }
      );

      // 如果有父留言，更新父留言的相關資訊
      if (comment.parentCommentId) {
        await commentModel.findByIdAndUpdate(
          comment.parentCommentId,
          {
            $pull: { childCommentId: commentId },
            $inc: {
              childrenCount: -1,
              descendantsCount: -totalDescendants
            }
          },
          { session }
        );

        // 更新所有上層留言的 descendantsCount
        await this.updateDescendants(
          comment.parentCommentId,
          -totalDescendants,
          session
        );
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }


  // 獲取留言樹
  static async getCommentTree(postId) {
    // 獲取所有相關留言
    const comments = await commentModel.find({ postId })
      .sort({ createdAt: -1 })
      .populate('commenterId', 'account')
      .lean();

    // 建立留言映射，用於快速查找
    const commentMap = new Map();
    comments.forEach(comment => {
      commentMap.set(comment._id.toString(), {
        ...comment,
        children: []
      });
    });

    // 建構樹狀結構
    const commentTree = [];
    comments.forEach(comment => {
      if (comment.parentCommentId) {
        const parentComment = commentMap.get(
          comment.parentCommentId.toString()
        );
        if (parentComment) {
          parentComment.children.push(
            commentMap.get(comment._id.toString())
          );
        }
      } else {
        commentTree.push(commentMap.get(comment._id.toString()));
      }
    });

    return commentTree;
  }

  // 修改留言
  static async edit(commentId, content) {
    try {
      const comment = await commentModel.findByIdAndUpdate(
        commentId,
        {
          content,
          editAt: new Date()
        },
        { new: true }
      );

      if (!comment) {
        throw new Error('留言不存在');
      }

      return comment;
    } catch (error) {
      throw error;
    }
  }

  // 點讚/取消點讚
  static async toggleLike(commentId, userId) {
    try {
      const comment = await commentModel.findById(commentId);
      if (!comment) {
        throw new Error('留言不存在');
      }

      if (comment.likers.includes(userId)) {
        // 取消點讚
        return await commentModel.findByIdAndUpdate(
          commentId,
          {
            $pull: { likers: userId },
            $inc: { likersCount: -1 }
          },
          { new: true }
        );
      } else {
        // 點讚
        return await commentModel.findByIdAndUpdate(
          commentId,
          {
            $push: { likers: userId },
            $inc: { likersCount: 1 }
          },
          { new: true }
        );
      }
    } catch (error) {
      throw error;
    }
  }
}

export default Comment;