import mongoose, { Document, Schema } from 'mongoose';

export interface IRentalItem extends Document {
  itemCode: string;
  barcode: string;
  name: string;
  category: string;
  image: string;
  rentPrice: number;
  halfRentPrice: number;
  securityDeposit: number;
  halfSecurityDeposit: number;
  purchasePrice: number;
  oldEarnings: number;
  supportsHalfPricing: boolean;
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
    barcode: {
      type: String,
      required: true,
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
    oldEarnings: {
      type: Number,
      default: 0,
    },
    rentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    halfRentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    securityDeposit: {
      type: Number,
      required: true,
      min: 0,
    },
    halfSecurityDeposit: {
      type: Number,
      required: true,
      min: 0,
    },
    supportsHalfPricing: {
      type: Boolean,
      required: true,
      default: false,
    },
    purchasePrice: {
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
