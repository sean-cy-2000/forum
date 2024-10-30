const loginForm = document.getElementById('loginForm');
const registForm = document.getElementById('registForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const account = document.getElementById('loginAccount').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            alert('登入成功！');
            updateNavBar();
            loginDialog.close();
        } else {
            alert(`登入失敗：${data.message}`);
        }
    } catch (error) {
        alert(`錯誤：${error.message}`);
    }
});

registForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const account = document.getElementById('registAccount').value;
    const password = document.getElementById('registPassword').value;

    try {
        const response = await fetch(`${API_URL}/user/regist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('註冊成功！請登入');
            registDialog.close();
        } else {
            alert(`註冊失敗：${data.message}`);
        }
    } catch (error) {
        alert(`錯誤：${error.message}`);
    }
});

async function getUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('請先登入');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/user/userInfo`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        alert(`用戶信息：${JSON.stringify(data.userInfo)}`);
    } catch (error) {
        console.error('獲取用戶信息時出錯：', error);
        alert(`獲取用戶信息失敗：${error.message}`);
    }
}

function logout() {
    localStorage.removeItem('token');
    alert('已登出');
    updateNavBar();
    showPosts();
}