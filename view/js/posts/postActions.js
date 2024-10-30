function createCommentElement(comment, allComments) {
    const commentElement = document.createElement('div');
    commentElement.className = `comment level-${comment.level}`;
    commentElement.innerHTML = `
        <p><strong>${comment.commenterId.account}</strong>: ${comment.content}</p>
        <small>${new Date(comment.createdAt).toLocaleString()}</small>
        ${comment.level < 3 ? `<button class="reply-button" data-comment-id="${comment._id}" data-level="${comment.level + 1}">回覆</button>` : ''}
    `;

    const childComments = allComments.filter(c => c.parentCommentId === comment._id);
    if (childComments.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'child-comments';
        childComments.forEach(childComment => {
            childrenContainer.appendChild(createCommentElement(childComment, allComments));
        });
        commentElement.appendChild(childrenContainer);
    }

    return commentElement;
}

async function toggleLike(postId) {
    await toggleAction(postId, 'addLike');
}

async function toggleCollect(postId) {
    await toggleAction(postId, 'addCollect');
}

async function toggleAction(postId, action) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('請先登入');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/post/${action}/${postId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        const data = await response.json();
        if (response.ok) {
            showPostDetail(postId);
        } else {
            alert(`操作失敗：${data.message}`);
        }
    } catch (error) {
        alert(`錯誤：${error.message}`);
    }
}

// 在這裡添加事件監聽器
document.getElementById('newPostForm').addEventListener('submit', createPost);