import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import dotenv from 'dotenv';

dotenv.config();

describe('登入功能測試', () => {
  it('應該成功登入並返回 token', async () => {
    const res = await request(app)
      .post('/user/login')
      .send({
        account: 'jack',
        password: 'jack'
      });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', '登錄成功');
    expect(res.body).to.have.property('token');
    expect(res.body.token).to.be.a('string');

    // 輸出完整的回應內容
    console.log('成功登入回應:', JSON.stringify(res.body, null, 2));
  });

  it('應該因為錯誤的密碼而登入失敗', async () => {
    const res = await request(app)
      .post('/user/login')
      .send({
        account: 'jack',
        password: 'wrongpassword'
      });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('message', '密碼錯誤');

    // 輸出完整的回應內容
    console.log('登入失敗回應:', JSON.stringify(res.body, null, 2));
  });

  // 新增一個測試案例：使用不存在的帳號登入
  it('應該因為帳號不存在而登入失敗', async () => {
    const res = await request(app)
      .post('/user/login')
      .send({
        account: 'nonexistentuser',
        password: 'anypassword'
      });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('message').that.includes('帳號不存在');

    // 輸出完整的回應內容
    console.log('帳號不存在回應:', JSON.stringify(res.body, null, 2));
  });
});