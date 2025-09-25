import mongoose, { Document, Schema } from 'mongoose';

export interface ICafe extends Document {
  cafename: string;
  vendorEmail: string;
  vendorPhone: string;
  cafeAddress: string;
  thumbnailImage: string;
  cafeImages: { url: string; fromDate: Date }[];
}

const cafeSchema = new Schema<ICafe>({
  cafename: { type: String, required: true },
  vendorEmail: { type: String, required: true },
  vendorPhone: { type: String, required: true },
  cafeAddress: { type: String, required: true },
  thumbnailImage: { type: String, required: true },
  cafeImages: [
    {
      url: { type: String, required: true },
      fromDate: { type: Date, required: true },
    },
  ],
});

export default mongoose.model<ICafe>('Cafe', cafeSchema);
