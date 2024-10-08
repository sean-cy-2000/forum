import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    postOwnerId: { type: String, required: true }, // required 必填，如果填入 unique: true 即是唯一的意思(PK 就是 unique: true)
    title: { type: String, required: true },        // 標題
    content: { type: String, required: true },      // 內容
    createdAt: { type: Date, default: Date.now },   // 創建時間，default: Date.now 預設為現在
    updatedAt: { type: Date, default: Date.now },   // 更新時間，也是預設現在
    category: { type: String },     // 分類
    tags: [{ type: String }],       // 標籤，可以有多個
    replyCount: { type: Number, default: 0 },   // 回覆數，預設 0
    likeCount: { type: Number, default: 0 },    // 點贊數，預設 0
    status: { type: String, enum: ['public', 'deleted'], default: 'public' }    // 狀態，預設是public
});

export const postModel = mongoose.model('Post', postSchema);
