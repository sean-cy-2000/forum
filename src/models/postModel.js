import mongoose from 'mongoose';

const {Schema} = mongoose;

const commentSchema = new Schema({
    commenter: { type: Schema.Types.ObjectId, ref: 'user', required: true }, // 留言的人，引用User模型
    content: { type: String, required: true },          // 留言內容
}, { timestamps: true });
/*
{ timestamps: true } 可以自動加上 createdAt 和 updatedAt 但只能在Schema最後面加，
不能加在別的schema內部（原本我想把 comment 以物件的形式放在 postSchema 內部）

Schema.Types.ObjectId 這是一種 mognodb 專屬的資料型態
不屬於 js, ts 中的 number 或 string ，賦值時不須加上引號
ref: 'user', 類似外鍵，可以在查詢時使用 populate() 方法，將 user 資料表的內容抓出來
*/

const postSchema = new Schema({
    postOwnerId: { type: Schema.Types.ObjectId, ref: 'user', required: true }, // required 必填，如果填入 unique: true 代表在該資料表中是唯一的(一篇文章只能有一個作者)
    title: { type: String, required: true },        // 標題
    content: { type: String, required: true },      // 內容
    category: { type: String },         // 分類
    tags: [{ type: String }],   // 標籤，可以有多個
    comments: [commentSchema],  // 在上面設定了 commentSchema ，包含留言者、留言內容、留言時間
    commentsCount: { type: Number, default: 0 },        // 留言數量
    likers: [{ type: Schema.Types.ObjectId, ref: 'user' }], // 按贊的人
    likersCount: { type: Number, default: 0 },            // 按贊的人數
    collectors: [{ type: Schema.Types.ObjectId, ref: 'user' }], // 收藏者
    collectorsCount: { type: Number, default: 0 },        // 收藏數量
    status: { type: String, enum: ['public', 'hidden'], default: 'public' }  // 狀態，只能有公開、隱藏2種狀態，預設為公開

}, { timestamps: true });

export const postModel = mongoose.model('post', postSchema);
