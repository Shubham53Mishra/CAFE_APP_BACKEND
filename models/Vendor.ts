import mongoose, { Document, Schema } from 'mongoose';

export interface IVendor extends Document {
  fullname: string;
  email: string;
  mobile: string;
  password: string;
}

const vendorSchema = new Schema<IVendor>({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
});

export default mongoose.model<IVendor>('Vendor', vendorSchema);
