import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  bookingId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    itemName: string;
    itemCode: string;
    rentPrice: number;
    deposit: number;
    quantity: number;
  }[];
  bookingNumber: string;
  startDate: string;
  returnDate: string;
  totalRent: number;
  totalDeposit: number;
  discount: number;
  totalAmount: number;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema: Schema = new Schema({
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
  deposit: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
});

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerAddress: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [InvoiceItemSchema],
      required: true,
    },
    bookingNumber: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    returnDate: {
      type: String,
      required: true,
    },
    totalRent: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDeposit: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shopName: {
      type: String,
      required: true,
      trim: true,
      default: 'Belles Avenue',
    },
    shopAddress: {
      type: String,
      required: true,
      trim: true,
      default: '123 Main Street, City',
    },
    shopPhone: {
      type: String,
      required: true,
      trim: true,
      default: '+91 98765 43210',
    },
    shopEmail: {
      type: String,
      required: true,
      trim: true,
      default: 'contact@bellesavenue.com',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
