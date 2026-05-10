import { Request, Response } from 'express';
import { IInvoice } from '../models/Invoice';
import { InvoiceService } from '../services/InvoiceService';

export class InvoiceController {
  constructor(private invoiceService: InvoiceService) { }

  async generateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        res.status(400).json({ error: 'Booking ID is required' });
        return;
      }

      // Get booking details to generate invoice
      const Booking = (await import('../models/Booking')).default;
      const booking = await Booking.findById(bookingId).populate('items.itemId');

      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      const invoice = await this.invoiceService.generateInvoice(booking);
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInvoiceByBookingId(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const invoice = await this.invoiceService.getInvoiceByBookingId(bookingId);

      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInvoiceByNumber(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceNumber } = req.params;
      const invoice = await this.invoiceService.getInvoiceByNumber(invoiceNumber);

      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllInvoices(req: Request, res: Response): Promise<void> {
    try {
      const invoices = await this.invoiceService.getAllInvoices();
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async downloadInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceNumber } = req.params;
      const invoice = await this.invoiceService.getInvoiceByNumber(invoiceNumber);

      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      // Generate PDF invoice (only option)
      const pdfContent = await this.invoiceService.generatePDFInvoice(invoiceNumber);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
      res.send(pdfContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private async generateInvoicePDF(invoice: IInvoice): Promise<Buffer> {
    try {
      // In production, use a proper PDF library like puppeteer or jsPDF
      // For now, using a simple PDF generation approach
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF();

      // Add shop header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${invoice.shopName}`, 105, 20, { align: 'center' });
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('INVOICE', 105, 30, { align: 'center' });

      // Add invoice details
      doc.setFontSize(12);
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, 50);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);

      // Add customer info
      doc.text('Customer Information:', 20, 80);
      doc.text(`Name: ${invoice.customerName}`, 20, 90);
      doc.text(`Phone: ${invoice.customerPhone}`, 20, 100);
      doc.text(`Address: ${invoice.customerAddress}`, 20, 110);

      // Add rental period
      doc.text('Rental Period:', 20, 130);
      doc.text(`Start Date: ${new Date(invoice.startDate).toLocaleDateString()}`, 20, 140);
      doc.text(`Return Date: ${new Date(invoice.returnDate).toLocaleDateString()}`, 20, 150);

      // Add items table
      let yPosition = 170;
      doc.text('Items:', 20, yPosition);
      yPosition += 10;

      // Table headers
      doc.setFont('helvetica', 'bold');
      doc.text('Item Name', 30, yPosition);
      doc.text('Item Code', 100, yPosition);
      doc.text('Rent Price', 150, yPosition);
      doc.text('Deposit', 200, yPosition);
      doc.text('Quantity', 250, yPosition);

      yPosition += 10;
      doc.setFont('helvetica', 'normal');

      // Table rows
      invoice.items.forEach(item => {
        doc.text(item.itemName, 30, yPosition);
        doc.text(item.itemCode, 100, yPosition);
        doc.text(`₹${item.rentPrice}`, 150, yPosition);
        doc.text(`₹${item.deposit}`, 200, yPosition);
        doc.text(item.quantity.toString(), 250, yPosition);
        yPosition += 10;
      });

      // Add totals
      yPosition += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('Totals:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Rent: ₹${invoice.totalRent}`, 20, yPosition + 10);
      doc.text(`Total Deposit: ₹${invoice.totalDeposit}`, 20, yPosition + 20);

      if (invoice.discount > 0) {
        doc.text(`Discount: -₹${invoice.discount}`, 20, yPosition + 30);
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`Total Amount: ₹${invoice.totalAmount}`, 20, yPosition + 40);

      // Add footer
      yPosition = 280;
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for your business!', 105, yPosition, { align: 'center' });
      doc.text('For any questions, please contact us:', 105, yPosition + 10, { align: 'center' });
      doc.text(`${invoice.shopName}`, 105, yPosition + 20, { align: 'center' });
      doc.text(`Phone: ${invoice.shopPhone}`, 105, yPosition + 30, { align: 'center' });
      doc.text(`Email: ${invoice.shopEmail}`, 105, yPosition + 40, { align: 'center' });

      const pdfBlob = doc.output('blob');
      return Buffer.from(await pdfBlob.arrayBuffer());
    } catch (error: any) {
      throw new Error(`Error generating PDF: ${error.message}`);
    }
  }
}
