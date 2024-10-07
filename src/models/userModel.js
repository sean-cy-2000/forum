import mongo from 'mongoose';

const userSchema = new mongo.Schema({
  account: { type: String, required: true, unique: true }, //required 必填，unique 唯一
  password_hash: { type: String, required: true }
});

export const userModel = mongo.model('user', userSchema);