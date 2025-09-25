import mongoose, { Document, Schema } from 'mongoose';

export interface IItem extends Document {
  name: string;
  price: number;
  image: string;
  cafeId: string;
  vendorEmail: string;
}

const itemSchema = new Schema<IItem>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  cafeId: { type: String, required: true },
  vendorEmail: { type: String, required: true },
});

export default mongoose.model<IItem>('Item', itemSchema);
