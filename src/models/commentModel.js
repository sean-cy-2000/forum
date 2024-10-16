import mongoose from 'mongoose';
const { Schema } = mongoose;

const commentSchema = new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'post', required: true },   //在哪篇文章底下
    commenterId: { type: Schema.Types.ObjectId, ref: 'user', required: true },//留言者
    level: { type: Number, default: 0, enum: [0, 1, 2] },       //層數，最多嵌套兩次
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'comment',default: null },   //父留言(如果是null代表是一般留言)
    childCount: { type: Number, default: 0 },   //子留言數
    order: { type: Number, default: 0 },        //在子留言中的排行
    content: { type: String, required: true },  
    likers: [{ type: Schema.Types.ObjectId, ref: 'user' }], //按贊的人
    likersCount: { type: Number, default: 0 },            //按贊的人數
    editAt: { type: Date, default: null },      //最後邊即時間
}, { timestamps: true });

/*
{ timestamps: true } 可以自動加上 createdAt 和 updatedAt 但只能在Schema最後面加，
不能加在別的schema內部（原本我想把 comment 以物件的形式放在 postSchema 內部）

Schema.Types.ObjectId 這是一種 mognodb 專屬的資料型態
不屬於 js, ts 中的 number 或 string ，賦值時不須加上引號
ref: 'user', 類似外鍵，可以在查詢時使用 populate() 方法，將 user 資料表的內容抓出來

populate 的第一個參數必須是 Schema.Types.ObjectId 型態，第二個是要查訊的欄位名 
會將欄位中查詢到的資料表的內容抓出來，併入 Schema.Types.ObjectId 中
變成物件的形式，例如： { ObjectId: "ObjectId", account: "account" } 
*/

export const commentModel = mongoose.model('comment', commentSchema);
