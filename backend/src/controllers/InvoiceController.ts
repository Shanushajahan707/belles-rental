import { Request, Response } from 'express';
import { IInvoice } from '../models/Invoice';
import { InvoiceService } from '../services/InvoiceService';

export class InvoiceController {
  constructor(private invoiceService: InvoiceService) { }

  async generateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId, bookingNumber } = req.body;

      if (!bookingId && !bookingNumber) {
        res.status(400).json({ error: 'Booking ID or booking number is required' });
        return;
      }

      const Booking = (await import('../models/Booking')).default;
      let booking: any | null = null;

      if (bookingId) {
        booking = await Booking.findById(bookingId).populate('items.itemId');
      } else if (bookingNumber) {
        booking = await Booking.findOne({ bookingNumber }).populate('items.itemId');
      }

      if (!booking) {
        res.status(404).json({
          error: bookingId ? 'Booking ID not found' : 'Booking number not found',
          bookingId,
          bookingNumber,
        });
        return;
      }

      const existingInvoice = await this.invoiceService.getInvoiceByBookingId(booking._id.toString());
      if (existingInvoice) {
        res.status(400).json({ error: 'Invoice already exists for this booking', invoice: existingInvoice });
        return;
      }

      const invoice = await this.invoiceService.generateInvoice(booking);
      res.status(201).json(invoice);
    } catch (error: any) {
      console.error('Error in generateInvoice:', error);
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

      // Generate proper PDF invoice
      const pdfBuffer = await this.invoiceService.getPDFInvoice(invoiceNumber);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
