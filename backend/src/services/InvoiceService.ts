import mongoose from 'mongoose';
import { jsPDF } from 'jspdf';
import Invoice, { IInvoice } from '../models/Invoice';
import RentalItem from '../models/RentalItem';
import Booking from '../models/Booking';

export class InvoiceService {
  async generateInvoice(bookingData: any): Promise<IInvoice> {
    try {
      // If bookingData is just an ID, fetch full booking data
      let fullBookingData = bookingData;
      if (typeof bookingData === 'string' || bookingData.bookingId) {
        const bookingId = typeof bookingData === 'string' ? bookingData : bookingData.bookingId;
        fullBookingData = await Booking.findById(bookingId).populate('items.itemId');

        if (!fullBookingData) {
          throw new Error('Booking not found');
        }
      }
      try {
        // Generate unique invoice number
        const invoiceNumber = await this.generateInvoiceNumber();

        // Calculate totals using stored booking data (not populated item data)
        const totalRent = fullBookingData.items.reduce((sum: number, item: any) => sum + (item.rentPrice || 0), 0);
        const totalSecurity = fullBookingData.items.reduce((sum: number, item: any) => sum + (item.security || 0), 0);
        const rentDiscount = fullBookingData.rentDiscount || 0;
        const securityDiscount = fullBookingData.securityDiscount || 0;
        const advancePayment = fullBookingData.advancePayment || 0;
        const additionalCharges = fullBookingData.additionalCharges || 0;
        const totalRentAfterDiscount = totalRent - rentDiscount;
        const totalSecurityAfterDiscount = totalSecurity - securityDiscount;
        const totalAmount = totalRentAfterDiscount + totalSecurityAfterDiscount + additionalCharges;
        const balanceAmount = totalAmount - advancePayment;

        const invoice = new Invoice({
          invoiceNumber,
          bookingId: fullBookingData._id,
          customerName: fullBookingData.customerName,
          customerPhone: fullBookingData.phone,
          customerAddress: fullBookingData.address,
          items: fullBookingData.items.map((item: any) => ({
            itemName: item.itemName || item.itemId?.name,
            itemCode: item.itemCode || item.itemId?.itemCode,
            rentPrice: item.rentPrice || 0, // Use stored booking price
            security: item.security || 0, // Use stored booking security
            quantity: 1,
            priceType: item.priceType || 'full',
          })),
          bookingNumber: fullBookingData.bookingNumber,
          startDate: fullBookingData.startDate,
          returnDate: fullBookingData.returnDate,
          totalRent,
          totalSecurity,
          rentDiscount,
          securityDiscount,
          advancePayment,
          additionalCharges,
          totalAmount,
          balanceAmount,
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

  async updateInvoice(bookingData: any): Promise<IInvoice> {
    try {
      // Find existing invoice for this booking
      const existingInvoice = await Invoice.findOne({ bookingId: bookingData._id });

      if (!existingInvoice) {
        // If no existing invoice, create a new one
        return await this.generateInvoice(bookingData);
      }

      // Update existing invoice with new booking data
      const totalRent = bookingData.items.reduce((sum: number, item: any) => sum + (item.rentPrice || 0), 0);
      const totalSecurity = bookingData.items.reduce((sum: number, item: any) => sum + (item.security || 0), 0);
      const rentDiscount = bookingData.rentDiscount || 0;
      const securityDiscount = bookingData.securityDiscount || 0;
      const advancePayment = bookingData.advancePayment || 0;
      const additionalCharges = bookingData.additionalCharges || 0;
      const totalRentAfterDiscount = totalRent - rentDiscount;
      const totalSecurityAfterDiscount = totalSecurity - securityDiscount;
      const totalAmount = totalRentAfterDiscount + totalSecurityAfterDiscount + additionalCharges;
      const balanceAmount = totalAmount - advancePayment;

      // Update existing invoice - fetch item details to get names and codes
      const itemIds = bookingData.items.map((item: any) => item.itemId);
      const rentalItems = await RentalItem.find({ _id: { $in: itemIds } });
      const rentalItemMap = rentalItems.reduce((map: any, item: any) => {
        map[item._id.toString()] = item;
        return map;
      }, {});

      existingInvoice.items = bookingData.items.map((item: any) => {
        const rentalItem = rentalItemMap[item.itemId];
        return {
          itemName: item.itemName || rentalItem?.name || 'Unknown Item',
          itemCode: item.itemCode || rentalItem?.itemCode || 'N/A',
          rentPrice: item.rentPrice || 0,
          security: item.security || 0,
          quantity: 1,
          priceType: item.priceType || 'full',
        };
      });
      existingInvoice.totalRent = totalRent;
      existingInvoice.totalSecurity = totalSecurity;
      existingInvoice.rentDiscount = rentDiscount;
      existingInvoice.securityDiscount = securityDiscount;
      existingInvoice.advancePayment = advancePayment;
      existingInvoice.additionalCharges = additionalCharges;
      existingInvoice.totalAmount = totalAmount;
      existingInvoice.balanceAmount = balanceAmount;

      return await existingInvoice.save();
    } catch (error: any) {
      throw new Error(`Error updating invoice: ${error.message}`);
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



  public async getTextInvoice(invoiceNumber: string): Promise<string> {
    try {
      const invoice = await this.getInvoiceByNumber(invoiceNumber);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      return this.generateTextInvoice(invoice);
    } catch (error: any) {
      throw new Error(`Error generating text invoice: ${error.message}`);
    }
  }

  public async getPDFInvoice(invoiceNumber: string): Promise<Buffer> {
    try {
      const invoice = await this.getInvoiceByNumber(invoiceNumber);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      return this.generatePDFInvoice(invoice);
    } catch (error: any) {
      throw new Error(`Error generating PDF invoice: ${error.message}`);
    }
  }

  private formatCurrency(value: any) {
    const num = Number(String(value).replace(/\s/g, '')); // remove spaces
    return `Rs. ${num}`; // Use Rs. instead of ₹ symbol to avoid font encoding issues
  }

  private async generatePDFInvoice(invoice: IInvoice): Promise<Buffer> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Belles Beauty Hub', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(22);
    doc.text('INVOICE', pageWidth / 2, 25, { align: 'center' });

    // Line
    doc.line(10, 30, pageWidth - 10, 30);

    // Invoice Details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 10, 40);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-GB')}`, pageWidth - 60, 40);

    doc.text(`Booking Number: ${invoice.bookingNumber}`, pageWidth - 60, 48);

    // Customer Info
    let y = 60;
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information:', 10, y);

    doc.setFont('helvetica', 'normal');
    y += 8;
    doc.text(`Name: ${invoice.customerName}`, 10, y);
    y += 6;
    doc.text(`Phone: ${invoice.customerPhone}`, 10, y);
    y += 6;
    doc.text(`Address: ${invoice.customerAddress}`, 10, y);

    // Rental Period
    y += 8;
    doc.text(`Start Date: ${new Date(invoice.startDate).toLocaleDateString('en-GB')}`, 10, y);
    y += 6;
    doc.text(`Return Date: ${new Date(invoice.returnDate).toLocaleDateString('en-GB')}`, 10, y);

    // Table Header
    y += 12;
    doc.setFont('helvetica', 'bold');

    doc.text('Item Name', 10, y);
    doc.text('Item Code', 70, y);
    doc.text('Item Type', 100, y);
    doc.text('Rent Price', 145, y, { align: 'right' });
    doc.text('Security', 175, y, { align: 'right' });

    // Line
    y += 3;
    doc.line(10, y, pageWidth - 10, y);

    // Items
    doc.setFont('helvetica', 'normal');
    y += 8;

    invoice.items.forEach((item) => {
      doc.text(item.itemName, 10, y);
      doc.text(item.itemCode, 70, y);
      doc.text(item.priceType === 'half' ? 'Half' : 'Full', 100, y);
      doc.text(this.formatCurrency(item.rentPrice), 145, y, { align: 'right' });
      doc.text(this.formatCurrency(item.security), 175, y, { align: 'right' });

      y += 8;
    });

    // Totals
    y += 10;

    // Use stored invoice totals instead of recalculating to ensure consistency
    doc.text(`Total Rent: ${this.formatCurrency(invoice.totalRent)}`, pageWidth - 80, y);
    y += 6;
    if (invoice.rentDiscount > 0) {
      doc.text(`Rent Discount: -${this.formatCurrency(invoice.rentDiscount)}`, pageWidth - 80, y);
      y += 6;
    }
    doc.text(`Total Security: ${this.formatCurrency(invoice.totalSecurity)}`, pageWidth - 80, y);
    y += 6;
    if (invoice.securityDiscount > 0) {
      doc.text(`Security Discount: -${this.formatCurrency(invoice.securityDiscount)}`, pageWidth - 80, y);
      y += 6;
    }
    if (invoice.advancePayment > 0) {
      doc.text(`Advance Payment: -${this.formatCurrency(invoice.advancePayment)}`, pageWidth - 80, y);
      y += 6;
    }
    if (invoice.additionalCharges && invoice.additionalCharges > 0) {
      doc.text(`Additional Charges: ${this.formatCurrency(invoice.additionalCharges)}`, pageWidth - 80, y);
      y += 6;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`Balance Amount: ${this.formatCurrency(invoice.balanceAmount)}`, pageWidth - 80, y);

    // Footer
    y += 15;
    doc.line(10, y, pageWidth - 10, y);

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', pageWidth / 2, y, { align: 'center' });

    y += 8;
    doc.text(invoice.shopName, pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.text(invoice.shopAddress, pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.text(`Phone: ${invoice.shopPhone}`, pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.text(`Email: ${invoice.shopEmail}`, pageWidth / 2, y, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
  }

  private generateTextInvoice(invoice: IInvoice): string {
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
  Item Type: ${item.priceType === 'half' ? 'Half' : 'Full'}
  Rent: ${this.formatCurrency(item.rentPrice)}
  Security: ${this.formatCurrency(item.security)}
  Qty: ${item.quantity}
  Total: ${this.formatCurrency(item.rentPrice * item.quantity)}`
    ).join('\n')}

SUBTOTAL: ${this.formatCurrency(invoice.totalRent)}
SECURITY: ${this.formatCurrency(invoice.totalSecurity)}
RENT DISCOUNT: -${this.formatCurrency(invoice.rentDiscount || 0)}
SECURITY DISCOUNT: -${this.formatCurrency(invoice.securityDiscount || 0)}
ADVANCE PAYMENT: -${this.formatCurrency(invoice.advancePayment || 0)}
BALANCE AMOUNT: ₹${invoice.balanceAmount}

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
      return `INV${Date.now().toString().slice(-4)} `;
    }
  }
}
