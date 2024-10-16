import mongoose from 'mongoose';
const { Schema } = mongoose;

const postSchema = new Schema({
    postOwnerId: { type: Schema.Types.ObjectId, ref: 'user', required: true }, // required 必填，如果填入 unique: true 代表在該資料表中是唯一的(一篇文章只能有一個作者)
    title: { type: String, required: true },        // 標題
    content: { type: String, required: true },      // 內容
    category: { type: String },         // 分類
    tags: [{ type: String }],   // 標籤，可以有多個
    /* comments: [commentModel],  
    將原本的 comments: [ commentSchema ] 改成 comments: [commentModel]
    後又改成把 commentModel 獨立出去，而不再存在 postSchema 內，所以comments這個欄位就不需要了*/
    commentsCount: { type: Number, default: 0 },        // 留言數量
    likers: [{ type: Schema.Types.ObjectId, ref: 'user' }], // 按贊的人
    likersCount: { type: Number, default: 0 },            // 按贊的人數
    collectors: [{ type: Schema.Types.ObjectId, ref: 'user' }], // 收藏者
    collectorsCount: { type: Number, default: 0 },        // 收藏數量
    public: { type: Boolean, default: true },             // 公開
    editAt: { type: Date, default: null },      // 最後邊即時間
}, { timestamps: true });

export const postModel = mongoose.model('post', postSchema);
