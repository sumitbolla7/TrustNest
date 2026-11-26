import { Schema, model, models } from 'mongoose';

const schema = new Schema({
  _id: String,
  count: Number,
  expiresAt: { type: Date, expires: 0 },
});

export default models.WriteLimit || model('WriteLimit', schema);
