const API_URL = 'http://localhost:3000';
const navButtons = document.getElementById('nav-buttons');
const loginBtn = document.getElementById('loginBtn');
const registBtn = document.getElementById('registBtn');
const loginDialog = document.getElementById('loginDialog');
const registDialog = document.getElementById('registDialog');
const newPostDialog = document.getElementById('newPostDialog');
const content = document.getElementById('content');

loginBtn.addEventListener('click', () => loginDialog.showModal());
registBtn.addEventListener('click', () => registDialog.showModal());

function updateNavBar() {
    const token = localStorage.getItem('token');
    if (token) {
        navButtons.innerHTML = `
            <button id="newPostBtn">新增文章</button>
            <button id="getUserInfoBtn">獲取用戶信息</button>
            <button id="logoutBtn">登出</button>
        `;
        document.getElementById('getUserInfoBtn').addEventListener('click', getUserInfo);
        document.getElementById('logoutBtn').addEventListener('click', logout);
        document.getElementById('newPostBtn').addEventListener('click', () => newPostDialog.showModal());
    } else {
        navButtons.innerHTML = `
            <button id="loginBtn">登入</button>
            <button id="registBtn">註冊</button>
        `;
        document.getElementById('loginBtn').addEventListener('click', () => loginDialog.showModal());
        document.getElementById('registBtn').addEventListener('click', () => registDialog.showModal());
    }
}

function getUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId;
}

document.addEventListener('DOMContentLoaded', function() {
    updateNavBar();
    showPosts();
});