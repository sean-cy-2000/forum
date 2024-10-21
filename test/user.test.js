import request from 'supertest';
import { expect } from 'chai';
import app from '../src/app.js';

function generateRandomString(length) {
  return Math.random().toString(36).substring(2, length + 2);
}

describe('測試 user 和 post 相關功能', () => {
  const users = {
    a: { account: generateRandomString(8), password: generateRandomString(8) },
    b: { account: generateRandomString(8), password: generateRandomString(8) },
    c: { account: generateRandomString(8), password: generateRandomString(8) }
  };
  let tokens = {};
  let posts = {
    a: [],
    b: []
  };

  describe('用戶註冊和登錄', () => {
    Object.entries(users).forEach(([key, user]) => {
      it(`創建新用戶 ${key}`, async () => {
        const res = await request(app).post('/user/regist')
          .send({ account: user.account, password: user.password });
        expect(res.status).to.equal(201);
        expect(res.body.message).to.equal('用戶註冊成功');
      });

      it(`用戶 ${key} 登錄`, async () => {
        const res = await request(app).post('/user/login')
          .send({ account: user.account, password: user.password });
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal('登錄成功');
        tokens[key] = res.body.token;
      });
    });
  });

  describe('創建文章', () => {
    it('用戶 a 創建兩篇文章', async () => {
      for (let i = 0; i < 2; i++) {
        const res = await request(app)
          .post('/post/createPost')
          .set('Authorization', `Bearer ${tokens.a}`)
          .send({ title: `用戶a的第${i+1}篇文章`, content: `這是內容${i+1}` });
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal("以成功創建新文章");
        posts.a.push(res.body.newPostInDb._id);
      }
    });

    it('用戶 b 創建一篇文章', async () => {
      const res = await request(app)
        .post('/post/createPost')
        .set('Authorization', `Bearer ${tokens.b}`)
        .send({ title: '用戶b的文章', content: '這是內容' });
      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal("以成功創建新文章");
      posts.b.push(res.body.newPostInDb._id);
    });
  });

  describe('收藏和點贊文章', () => {
    it('用戶 c 收藏所有文章', async () => {
      for (let user of ['a', 'b']) {
        for (let postId of posts[user]) {
          const res = await request(app)
            .post(`/post/addCollect/${postId}`)
            .set('Authorization', `Bearer ${tokens.c}`);
          expect(res.status).to.equal(200);
          expect(res.body.message).to.equal("收藏成功");
        }
      }
    });

    it('用戶 c 點贊所有文章', async () => {
      for (let user of ['a', 'b']) {
        for (let postId of posts[user]) {
          const res = await request(app)
            .post(`/post/addLike/${postId}`)
            .set('Authorization', `Bearer ${tokens.c}`);
          expect(res.status).to.equal(200);
          expect(res.body.message).to.equal("點贊成功");
        }
      }
    });
  });

  describe('刪除文章', () => {
    it('用戶 c 嘗試刪除文章（預期失敗）', async () => {
      const res = await request(app)
        .delete(`/post/deletePost/${posts.a[0]}`)
        .set('Authorization', `Bearer ${tokens.c}`);
      expect(res.status).to.equal(403);
      expect(res.body.message).to.equal("權限不足");
    });

    it('用戶 a 和 b 刪除自己的文章', async () => {
      for (let user of ['a', 'b']) {
        for (let postId of posts[user]) {
          const res = await request(app)
            .delete(`/post/deletePost/${postId}`)
            .set('Authorization', `Bearer ${tokens[user]}`);
          expect(res.status).to.equal(200);
          expect(res.body.message).to.equal("文章已成功刪除");
        }
      }
    });
  });

  describe('刪除用戶帳號', () => {
    Object.keys(users).forEach(key => {
      it(`刪除用戶 ${key}`, async () => {
        const res = await request(app)
          .delete('/user/delete')
          .set('Authorization', `Bearer ${tokens[key]}`);
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal("刪除成功");
      });
    });
  });
});