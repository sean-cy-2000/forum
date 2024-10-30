// js/posts/postDetail.js

const API_URL = 'http://localhost:3000';

async function showPostDetail(postId) {
    try {
        const response = await fetch(`${API_URL}/post/getPostInfo/${postId}`);
        const data = await response.json();
        if (response.ok) {
            displayPostDetail(data.post);
        } else {
            alert(`獲取文章詳情失敗：${data.message}`);
        }
    } catch (error) {
        alert(`錯誤：${error.message}`);
    }
}

function displayPostDetail(post) {
    content.innerHTML = `
        <div class="post-detail">
            <h2>${post.title}</h2>
            <p>${post.content}</p>
            <p>分類：${post.category || '無'}</p>
            <p>標籤：${post.tags?.join(', ') || '無'}</p>
            <p>評論數：${post.commentsCount}</p>
            <p>點贊數：${post.likersCount}</p>
            <p>收藏數：${post.collectorsCount}</p>
            <div class="action-buttons">
                <button id="likeBtn">點贊</button>
                <button id="collectBtn">收藏</button>
            </div>
            <div class="comments">
                <h3>評論</h3>
                <form id="commentForm">
                    <textarea required></textarea>
                    <button type="submit">發表評論</button>
                </form>
                <div id="commentsList"></div>
            </div>
        </div>
    `;
}

function buildCommentTree(comments) {
    const commentMap = new Map(comments.map(c => [c._id, { ...c, children: [] }]));
    
    const rootComments = [];
    for (const comment of commentMap.values()) {
        if (comment.parentCommentId) {
            const parent = commentMap.get(comment.parentCommentId);
            if (parent) {
                parent.children.push(comment);
            }
        } else {
            rootComments.push(comment);
        }
    }

    function generateCommentHtml(comment, level = 0) {
        const indent = '    '.repeat(level);
        let html = `
${indent}<div class="comment level-${level}">
${indent}    <p><strong>${comment.commenterId.account}</strong>: ${comment.content}</p>
${indent}    <small>${new Date(comment.createdAt).toLocaleString()}</small>
${indent}    ${level < 3 ? `<a href="#" class="reply-link" data-comment-id="${comment._id}" data-level="${level + 1}">回覆</a>` : ''}
`;

        if (comment.children.length > 0) {
            html += `${indent}    <div class="child-comments">
`;
            for (const child of comment.children) {
                html += generateCommentHtml(child, level + 1);
            }
            html += `${indent}    </div>
`;
        }

        html += `${indent}</div>
`;

        return html;
    }

    return rootComments.map(comment => generateCommentHtml(comment)).join('');
}

function createReplyForm(postId, parentCommentId, level) {
    const form = document.createElement('form');
    form.className = 'reply-form';
    form.innerHTML = `
        <textarea placeholder="回覆評論" required></textarea>
        <button type="submit">發送</button>
    `;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = e.target.querySelector('textarea').value;
        addComment(postId, parentCommentId, content, level);
        form.remove();
    });
    return form;
}

async function addComment(postId, parentCommentId, content, level) {
    try {
        const url = `${API_URL}/post/addComment/${postId}/${parentCommentId || 0}/${level}`;
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
            showPostDetail(postId);  // 重新加載文章詳情以顯示新評論
        } else {
            alert(`評論失敗：${data.message}`);
        }
    } catch (error) {
        alert(`錯誤：${error.message}`);
    }
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

function getUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId;
}

function showEditPostDialog(post) {
    const editPostDialog = document.getElementById('editPostDialog');
    const editPostForm = document.getElementById('editPostForm');

    document.getElementById('editPostTitle').value = post.title;
    document.getElementById('editPostContent').value = post.content;
    document.getElementById('editPostCategory').value = post.category || '';
    document.getElementById('editPostTags').value = post.tags ? post.tags.join(', ') : '';

    editPostForm.onsubmit = (e) => {
        e.preventDefault();
        editPost(post._id);
    };

    editPostDialog.showModal();
}

async function editPost(postId) {
    const title = document.getElementById('editPostTitle').value;
    const content = document.getElementById('editPostContent').value;
    const category = document.getElementById('editPostCategory').value;
    const tags = document.getElementById('editPostTags').value.split(',').map(tag => tag.trim());

    try {
        const response = await fetch(`${API_URL}/post/editPost/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, content, category, tags }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('文章更新成功！');
            document.getElementById('editPostDialog').close();
            showPostDetail(postId);
        } else {
            alert(`文章更新失敗：${data.message}`);
        }
    } catch (error) {
        alert(`錯誤：${error.message}`);
    }
}

async function deletePost(postId) {
    if (!confirm('確定要刪除這篇文章嗎？')) return;

    try {
        const response = await fetch(`${API_URL}/post/deletePost/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        const data = await response.json();
        if (response.ok) {
            alert('文章已成功刪除');
            // 這裡應該導航回文章列表頁面
            // 假設有一個 showPosts 函數用於顯示文章列表
            showPosts();
        } else {
            alert(`刪除文章失敗：${data.message}`);
        }
    } catch (error) {
        alert(`錯誤：${error.message}`);
    }
}

export { showPostDetail };