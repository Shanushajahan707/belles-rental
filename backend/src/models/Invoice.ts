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
    security: number;
    quantity: number;
    priceType?: 'full' | 'half';
  }[];
  bookingNumber: string;
  startDate: string;
  returnDate: string;
  totalRent: number;
  totalSecurity: number;
  rentDiscount: number;
  securityDiscount: number;
  advancePayment: number;
  totalAmount: number;
  balanceAmount: number;
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
  security: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  priceType: {
    type: String,
    enum: ['full', 'half'],
    default: 'full',
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
    totalSecurity: {
      type: Number,
      required: true,
      min: 0,
    },
    rentDiscount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    securityDiscount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    advancePayment: {
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
    balanceAmount: {
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
