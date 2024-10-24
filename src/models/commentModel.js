import mongoose from 'mongoose';
const { Schema } = mongoose;

const commentSchema = new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'post', required: true },   //在哪篇文章底下
    commenterId: { type: Schema.Types.ObjectId, ref: 'user', required: true },//留言者
    level: { type: Number, default: 0, enum: [0, 1, 2, 3] },       //層數，最多嵌套三次
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'comment', default: null },   //父留言(如果是null代表是一般留言)
    childCommentId: [{ type: Schema.Types.ObjectId, ref: 'comment', default: null }],
    childrenCount: { type: Number, default: 0 },    //子留言數
    descendantsCount: { type: Number, default: 0 },  //所有後代
    order: { type: Number, default: 0 },        //在子留言中的排行
    content: { type: String, required: true },
    likers: [{ type: Schema.Types.ObjectId, ref: 'user' }], //按贊的人
    likersCount: { type: Number, default: 0 },            //按贊的人數
    editAt: { type: Date, default: null },      //最後邊即時間
}, { timestamps: true });

export const commentModel = mongoose.model('comment', commentSchema);