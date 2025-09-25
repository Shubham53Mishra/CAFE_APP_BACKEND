import mongoose, { Document, Schema } from 'mongoose';

export interface ICafe extends Document {
  cafename: string;
  vendorEmail: string;
  vendorPhone: string;
  cafeAddress: string;
  thumbnailImage: string;
  cafeImages: string[];
}

const cafeSchema = new Schema<ICafe>({
  cafename: { type: String, required: true },
  vendorEmail: { type: String, required: true },
  vendorPhone: { type: String, required: true },
  cafeAddress: { type: String, required: true },
  thumbnailImage: { type: String, required: true },
  cafeImages: { type: [String], required: true },
});

export default mongoose.model<ICafe>('Cafe', cafeSchema);
