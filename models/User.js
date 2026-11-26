import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: [true, 'Email already exists'],
      required: [true, 'Email is required'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
    },
    role: { type: String, enum: ['tenant', 'landlord', 'admin'], default: 'tenant' },
    passwordHash: { type: String, select: false },
    emailVerified: { type: Boolean, default: false },
    suspended: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    sessionVersion: { type: Number, default: 0 },
    notificationsEnabled: { type: Boolean, default: true },
    landlordVerification: String,
    resetLink: { type: new Schema({ hash: String, expires: Date }, { _id: false }), select: false },
    verifyLink: { type: new Schema({ hash: String, expires: Date }, { _id: false }), select: false },
    image: {
      type: String,
    },
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Property',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = models.User || model('User', UserSchema);

export default User;
