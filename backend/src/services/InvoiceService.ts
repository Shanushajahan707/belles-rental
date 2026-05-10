import mongoose from 'mongoose';
import Invoice, { IInvoice } from '../models/Invoice';

export class InvoiceService {
  async generateInvoice(bookingData: any): Promise<IInvoice> {
    try {
      // If bookingData is just an ID, fetch full booking data
      let fullBookingData = bookingData;
      if (typeof bookingData === 'string' || bookingData.bookingId) {
        const bookingId = typeof bookingData === 'string' ? bookingData : bookingData.bookingId;
        const Booking = (await import('../models/Booking')).default;
        fullBookingData = await Booking.findById(bookingId).populate('items.itemId');

        if (!fullBookingData) {
          throw new Error('Booking not found');
        }
      }
      try {
        // Generate unique invoice number
        const invoiceNumber = await this.generateInvoiceNumber();

        // Calculate totals
        const totalRent = fullBookingData.items.reduce((sum: number, item: any) => sum + item.rentPrice, 0);
        const totalDeposit = fullBookingData.items.reduce((sum: number, item: any) => sum + (item.deposit || 0), 0);
        const discount = fullBookingData.discount || 0;
        const totalAmount = totalRent + totalDeposit - discount;

        const invoice = new Invoice({
          invoiceNumber,
          bookingId: fullBookingData._id,
          customerName: fullBookingData.customerName,
          customerPhone: fullBookingData.phone,
          customerAddress: fullBookingData.address,
          items: fullBookingData.items.map((item: any) => ({
            itemName: item.itemName || item.itemId?.name,
            itemCode: item.itemCode || item.itemId?.itemCode,
            rentPrice: item.rentPrice,
            deposit: item.deposit || 0,
            quantity: 1,
          })),
          bookingNumber: fullBookingData.bookingNumber,
          startDate: fullBookingData.startDate,
          returnDate: fullBookingData.returnDate,
          totalRent,
          totalDeposit,
          discount,
          totalAmount,
          shopName: 'Belles Beauty Hub',
          shopAddress: 'Belles Avenue, Punalur, Kerala',
          shopPhone: '+91 70250 00970',
          shopEmail: 'avenuesbeautyhub@gmail.com',
        });

        return await invoice.save();
      } catch (error: any) {
        throw new Error(`Error generating invoice: ${error.message}`);
      }
    } catch (error: any) {
      throw new Error(`Error generating invoice: ${error.message}`);
    }
  }

  async getInvoiceByBookingId(bookingId: string): Promise<IInvoice | null> {
    try {
      return await Invoice.findOne({ bookingId }).populate('bookingId');
    } catch (error: any) {
      throw new Error(`Error fetching invoice: ${error.message}`);
    }
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<IInvoice | null> {
    try {
      return await Invoice.findOne({ invoiceNumber }).populate('bookingId');
    } catch (error: any) {
      throw new Error(`Error fetching invoice: ${error.message}`);
    }
  }

  async getAllInvoices(): Promise<IInvoice[]> {
    try {
      return await Invoice.find().sort({ createdAt: -1 }).populate('bookingId');
    } catch (error: any) {
      throw new Error(`Error fetching invoices: ${error.message}`);
    }
  }

  async generatePDFInvoice(invoiceNumber: string): Promise<Buffer> {
    try {
      const invoice = await this.getInvoiceByNumber(invoiceNumber);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Generate PDF content (simplified version)
      const pdfContent = this.generatePDFContent(invoice);

      return Buffer.from(pdfContent, 'utf-8');
    } catch (error: any) {
      throw new Error(`Error generating PDF: ${error.message}`);
    }
  }

  private generatePDFContent(invoice: IInvoice): string {
    // This is a simplified PDF generation
    // In production, you'd use a proper PDF library like puppeteer or jsPDF
    return `
INVOICE: ${invoice.invoiceNumber}
DATE: ${new Date().toLocaleDateString()}

BILL TO:
${invoice.customerName}
${invoice.customerAddress}
${invoice.customerPhone}

ITEMS:
${invoice.items.map(item =>
      `${item.itemName} (${item.itemCode})
  Rent: ₹${item.rentPrice}
  Deposit: ₹${item.deposit}
  Qty: ${item.quantity}
  Total: ₹${item.rentPrice * item.quantity}`
    ).join('\n')}

SUBTOTAL: ₹${invoice.totalRent}
DEPOSIT: ₹${invoice.totalDeposit}
DISCOUNT: -₹${invoice.discount}
TOTAL: ₹${invoice.totalAmount}

${invoice.shopName}
${invoice.shopAddress}
${invoice.shopPhone}
${invoice.shopEmail}
    `;
  }

  private async generateInvoiceNumber(): Promise<string> {
    try {
      const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
      const lastNumber = lastInvoice?.invoiceNumber || 'INV0000';
      const numericPart = parseInt(lastNumber.replace('INV', '')) + 1;
      return `INV${numericPart.toString().padStart(4, '0')}`;
    } catch (error: any) {
      return `INV${Date.now().toString().slice(-4)}`;
    }
  }
}
