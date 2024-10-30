function displayComments(comments) {
    const commentMap = new Map();
    comments.forEach(comment => {
        commentMap.set(comment._id, {
            ...comment,
            childrenId: comment.childrenId || [],
            childrenCount: comment.childrenCount || 0,
            descendantsCount: comment.descendantsCount || 0
        });
    });

    const rootComments = comments.filter(c => !c.parentCommentId);
    return rootComments.map(comment => createCommentHTML(comment, commentMap)).join('');
}

function displayChildComments(allComments, parentId) {
    const childComments = allComments
        .filter(comment => comment.parentComment && comment.parentComment.toString() === parentId.toString())
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return childComments.map(comment => `
        <div class="comment child-comment">
            <p><strong>${comment.commenter?.account || '匿名用戶'}</strong>: ${comment.content}</p>
            <small>${new Date(comment.createdAt).toLocaleString()}</small>
        </div>
    `).join('');
}

function createCommentHTML(comment, commentMap, level = 0) {
    const commentElement = `
        <div class="comment level-${level}">
            <p><strong>${comment.commenterId?.account || '匿名用戶'}</strong>: ${comment.content}</p>
            <small>${new Date(comment.createdAt).toLocaleString()}</small>
            ${level < 3 ? `<a href="#" class="reply-link" data-comment-id="${comment._id}">回覆</a>` : ''}
            <small>子評論數: ${comment.childrenCount}, 後代數: ${comment.descendantsCount}</small>
            <div class="child-comments">
                ${comment.childrenId.map(childId => {
                    const childComment = commentMap.get(childId);
                    return childComment ? createCommentHTML(childComment, commentMap, level + 1) : '';
                }).join('')}
            </div>
        </div>
    `;
    return commentElement;
}

async function addComment(postId, parentCommentId, content) {
    try {
        const url = `${API_URL}/post/addComment/${postId}/${parentCommentId || '0'}`;  // 更改為新的 API 路徑格式
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('評論成功');
            showPostDetail(postId);
        } else {
            alert(`評論失敗：${data.message}`);
        }
    } catch (error) {
        alert(`錯誤：${error.message}`);
    }
}

function setupReplyButtons() {
    document.querySelectorAll('.reply-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const parentCommentId = e.target.dataset.commentId;
            const replyForm = document.createElement('form');
            replyForm.innerHTML = `
                <textarea placeholder="回覆評論" required></textarea>
                <button type="submit">發送</button>
            `;
            replyForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const content = event.target.querySelector('textarea').value;
                addComment(getCurrentPostId(), parentCommentId, content);
            });
            e.target.parentNode.appendChild(replyForm);
            e.target.style.display = 'none';
        });
    });
}

function getCurrentPostId() {
    // 這個函數需要你根據你的應用邏輯來實現
    // 它應該返回當前正在查看的文章的ID
}