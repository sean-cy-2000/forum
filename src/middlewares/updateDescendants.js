// 更新所有祖先評論的 descendantsCount 這一屬性
async function updateDescendantsCount(req, res) {
    try {
      const { parentCommentId, change } = req.descendantsCountUpdate || {};
      if (parentCommentId && change) {
        await updateParentDescendantsCount(parentCommentId, change);
      }
      next();
    } catch (error) {
      next(error);
    }
  }
  
  async function updateParentDescendantsCount(parentId, change) {
    if (!parentId) return;
    
    const parentComment = await commentModel.findByIdAndUpdate(
      parentId,
      { $inc: { descendantsCount: change } },
      { new: true }
    );
  
    if (parentComment && parentComment.parentCommentId) {
      await updateParentDescendantsCount(parentComment.parentCommentId, change);
    }
  }