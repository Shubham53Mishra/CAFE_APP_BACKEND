import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  fullname: string;
  email: string;
  mobile: string;
  password: string;
  profileImage?: string;
}

const userSchema = new Schema<IUser>({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  profileImage: { type: String },
});

export default mongoose.model<IUser>('User', userSchema);
