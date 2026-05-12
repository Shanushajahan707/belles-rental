import { Request, Response } from 'express';
import { IInvoice } from '../models/Invoice';
import { InvoiceService } from '../services/InvoiceService';

export class InvoiceController {
  constructor(private invoiceService: InvoiceService) { }

  async generateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.body;
      console.log('here on controller', bookingId);

      if (!bookingId) {
        res.status(400).json({ error: 'Booking ID is required' });
        return;
      }
      console.log('Looking for booking with number:', bookingId);

      // Get booking details to generate invoice
      const Booking = (await import('../models/Booking')).default;

      // Always search by booking number (not ObjectId)
      const booking = await Booking.findOne({ bookingNumber: bookingId }).populate('items.itemId');

      console.log('Found booking:', booking);

      if (!booking) {
        // Debug: Check what bookings exist
        const allBookings = await Booking.find({});
        console.log('All bookings in database:', allBookings.map(b => ({ id: b._id, number: b.bookingNumber })));

        res.status(404).json({ error: 'Booking number not found', bookingId, availableBookings: allBookings.map(b => ({ id: b._id, number: b.bookingNumber })) });
        return;
      }

      // Check if invoice already exists for this booking
      const existingInvoice = await this.invoiceService.getInvoiceByBookingId(booking._id.toString());
      console.log('existing invoice', existingInvoice);
      if (existingInvoice) {
        res.status(400).json({ error: 'Invoice already exists for this booking', invoice: existingInvoice });
        return;
      }

      const invoice = await this.invoiceService.generateInvoice(booking);
      console.log('invoice', invoice);
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
