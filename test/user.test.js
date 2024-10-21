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
  let comments = {
    a: [],
    b: [],
    c: []
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

    it('獲取所有文章', async () => {
      const res = await request(app).get('/post/getAllPosts');
      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal("已成功取得所有文章");
      expect(res.body.allPosts).to.be.an('array').that.has.lengthOf(3);
      res.body.allPosts.forEach(post => {
        expect(post).to.have.property('_id');
        expect(post).to.have.property('title');
        expect(post).to.have.property('content');
      });
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

    it('檢查所有文章的點贊和收藏數', async () => {
      for (let user of ['a', 'b']) {
        for (let postId of posts[user]) {
          const res = await request(app).get(`/post/getPostInfo/${postId}`);
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('title');
          expect(res.body).to.have.property('content');
          expect(res.body).to.have.property('likersCount', 1);
          expect(res.body).to.have.property('collectorsCount', 1);
        }
      }
    });
  });

  describe('添加評論和嵌套留言', () => {
    it('用戶對每篇文章添加評論', async () => {
      for (let user of ['a', 'b', 'c']) {
        for (let postId of [...posts.a, ...posts.b]) {
          const res = await request(app)
            .post(`/post/addComment/${postId}/0/0`)
            .set('Authorization', `Bearer ${tokens[user]}`)
            .send({ content: `${user}的測試評論` });
          expect(res.status).to.equal(200);
          expect(res.body.message).to.equal("留言成功");
          expect(res.body.newCommentInDb).to.have.property('content', `${user}的測試評論`);
          comments[user].push(res.body.newCommentInDb._id);
        }
      }
    });

    it('用戶互相嵌套留言', async () => {
      const userOrder = ['a', 'b', 'c'];
      for (let i = 0; i < 3; i++) {
        const user = userOrder[i];
        const nextUser = userOrder[(i + 1) % 3];
        const parentCommentId = comments[user][0];
        const res = await request(app)
          .post(`/post/addComment/${posts.a[0]}/${parentCommentId}/1`)
          .set('Authorization', `Bearer ${tokens[nextUser]}`)
          .send({ content: `${nextUser}對${user}的嵌套留言` });
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal("留言成功");
      }
    });

    it('檢查所有文章的評論數', async () => {
      for (let user of ['a', 'b']) {
        for (let postId of posts[user]) {
          const res = await request(app).get(`/post/getPostInfo/${postId}`);
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('commentsCount');
          if (postId === posts.a[0]) {
            expect(res.body.commentsCount).to.equal(6);  // 3個主評論 + 3個嵌套評論
          } else {
            expect(res.body.commentsCount).to.equal(3);  // 3個主評論
          }
        }
      }
    });

    it('用戶互相對留言按贊', async () => {
      for (let user of ['a', 'b', 'c']) {
        for (let commentId of comments[user]) {
          const res = await request(app)
            .post(`/post/addLike/${commentId}`)
            .set('Authorization', `Bearer ${tokens[user === 'a' ? 'b' : 'a']}`);
          expect(res.status).to.equal(200);
          expect(res.body.message).to.equal("點贊成功");
        }
      }
    });

    it('嘗試添加空評論（預期失敗）', async () => {
      const res = await request(app)
        .post(`/post/addComment/${posts.a[0]}/0/0`)
        .set('Authorization', `Bearer ${tokens.c}`)
        .send({ content: '' });
      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal("評論內容不能為空");
    });

    it('嘗試對不存在的文章添加評論（預期失敗）', async () => {
      const fakePostId = '000000000000000000000000';
      const res = await request(app)
        .post(`/post/addComment/${fakePostId}/0/0`)
        .set('Authorization', `Bearer ${tokens.c}`)
        .send({ content: '這是一條測試評論' });
      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal("文章不存在");
    });
  });
});