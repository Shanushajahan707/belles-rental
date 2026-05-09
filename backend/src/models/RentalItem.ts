import mongoose, { Document, Schema } from 'mongoose';

export interface IRentalItem extends Document {
  itemCode: string;
  name: string;
  category: string;
  image: string;
  rentPrice: number;
  securityDeposit: number;
  status: 'available' | 'booked' | 'running';
  createdAt: Date;
  updatedAt: Date;
}

const RentalItemSchema: Schema = new Schema(
  {
    itemCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    rentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    securityDeposit: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'running'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRentalItem>('RentalItem', RentalItemSchema);
