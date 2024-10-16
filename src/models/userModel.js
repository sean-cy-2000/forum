import mongo from 'mongoose';

const userSchema = new mongo.Schema({
  account: { type: String, required: true, unique: true }, //required 必填，unique 唯一
  password_hash: { type: String, required: true },
  allPost: [{ type: mongo.Schema.Types.ObjectId, ref: 'post' }],
  allCollect: [{ type: mongo.Schema.Types.ObjectId, ref: 'post' }],
});

export const userModel = mongo.model('user', userSchema);