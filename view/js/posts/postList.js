import { showPostDetail } from './postDetail.js';
const API_URL = 'http://localhost:3000'; // 確保這個 URL 是正確的

export async function showPosts() {
    try {
        const response = await fetch(`${API_URL}/post/getPosts`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayPosts(data.posts);
    } catch (error) {
        console.error('獲取文章列表時出錯：', error);
        alert(`獲取文章列表失敗：${error.message}`);
    }
}

function displayPosts(posts) {
    const content = document.getElementById('content');
    if (!content) {
        console.error('找不到 content 元素');
        return;
    }
    
    if (!Array.isArray(posts) || posts.length === 0) {
        content.innerHTML = '<p>暫無文章</p>';
        return;
    }

    let postsHtml = '<div class="posts">';
    posts.forEach(post => {
        postsHtml += `
            <div class="post" data-post-id="${post._id}">
                <h3>${post.title}</h3>
                <p>${post.content.substring(0, 100)}...</p>
            </div>
        `;
    });
    postsHtml += '</div>';

    content.innerHTML = postsHtml;

    // 為每篇文章添加點擊事件
    document.querySelectorAll('.post').forEach(postElement => {
        postElement.addEventListener('click', () => {
            const postId = postElement.dataset.postId;
            showPostDetail(postId);
        });
    });
}
