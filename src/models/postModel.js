import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    posterId: { type: String, required: true, unique: true }, // required 必填，unique 唯一
    title: { type: String, required: true },        // 標題
    content: { type: String, required: true },      // 內容
    createdAt: { type: Date, default: Date.now },   // 創建時間，default: Date.now 預設為現在
    updatedAt: { type: Date, default: Date.now },   // 更新時間
    category: { type: String },     // 分類
    tags: [{ type: String }],       // 標籤，可以有多個
    replyCount: { type: Number, default: 0 },   // 回覆數，預設 0
    likeCount: { type: Number, default: 0 },    // 點贊數，預設 0
    status: { type: String, enum: ['public', 'deleted'], default: 'public' }    // 狀態
});

export const postModel = mongoose.model('Post', postSchema);
