import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingItem {
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  itemCode: string;
  rentPrice: number;
  security: number;
  priceType?: 'full' | 'half';
}

export interface IBooking extends Document {
  bookingNumber: string;
  customerName: string;
  phone: string;
  address: string;
  items: IBookingItem[];
  startDate: Date;
  returnDate: Date;
  actualReturnDate?: Date;
  rentDiscount: number;
  securityDiscount: number;
  advancePayment: number;
  additionalCharges?: number; // Additional charges for extra days beyond standard period
  totalAmount: number;
  balanceAmount: number;
  status: 'booked' | 'running' | 'completed' | 'overdue';
  createdBy: string; // Admin user who created the booking
  createdAt: Date;
  updatedAt: Date;
  checkedIn?: boolean;
  note?: string; // Admin-only note for additional booking information
}

const BookingItemSchema: Schema = new Schema({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'RentalItem',
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  itemCode: {
    type: String,
    required: true,
  },
  rentPrice: {
    type: Number,
    required: true,
  },
  security: {
    type: Number,
    required: true,
  },
  priceType: {
    type: String,
    enum: ['full', 'half'],
    default: 'full',
  },
});

const BookingSchema: Schema = new Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [BookingItemSchema],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      required: true,
    },
    actualReturnDate: {
      type: Date,
    },
    rentDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    securityDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    advancePayment: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['booked', 'running', 'completed', 'overdue'],
      default: 'booked',
    },
    createdBy: {
      type: String,
      required: true,
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      trim: true,
    },
    additionalCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBooking>('Booking', BookingSchema);
