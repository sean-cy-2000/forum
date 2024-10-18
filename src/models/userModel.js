import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema({
  account: { type: String, required: true, unique: true }, //required 必填，unique 唯一
  password_hash: { type: String, required: true },
  allPost: [{ type: Schema.Types.ObjectId, ref: 'post' }],
  allCollect: [{ type: Schema.Types.ObjectId, ref: 'post' }],
  introduce: { type: String, default: "這人很懶，啥也沒寫～" },
}, { timestamps: true });

export const userModel = mongoose.model('user', userSchema);