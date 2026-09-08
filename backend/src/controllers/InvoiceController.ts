import { Request, Response } from 'express';
import { InvoiceService } from '../services/InvoiceService';
import Booking from '../models/Booking';

export class InvoiceController {
  constructor(private invoiceService: InvoiceService) { }

  async generateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId, bookingNumber } = req.body;

      if (!bookingId && !bookingNumber) {
        res.status(400).json({ error: 'Booking ID or booking number is required' });
        return;
      }

      let booking: any | null = null;

      // Check if the input looks like a MongoDB ObjectId (24 character hex string)
      const isValidObjectId = (id: string) => {
        return /^[0-9a-fA-F]{24}$/.test(id);
      };

      // Prioritize booking number for manual invoice generation
      if (bookingNumber) {
        booking = await Booking.findOne({ bookingNumber }).populate('items.itemId');
      } else if (bookingId && isValidObjectId(bookingId)) {
        booking = await Booking.findById(bookingId).populate('items.itemId');
      } else if (bookingId) {
        // If bookingId is provided but not a valid ObjectId, treat it as booking number
        booking = await Booking.findOne({ bookingNumber: bookingId }).populate('items.itemId');
      }

      if (!booking) {
        res.status(404).json({
          error: 'Booking not found',
          bookingId,
          bookingNumber,
        });
        return;
      }

      const existingInvoice = await this.invoiceService.getInvoiceByBookingId(booking._id.toString());
      
      let invoice;
      if (existingInvoice) {
        // Update existing invoice with current booking data
        invoice = await this.invoiceService.updateInvoice(booking);
        res.status(200).json(invoice);
      } else {
        // Create new invoice
        invoice = await this.invoiceService.generateInvoice(booking);
        res.status(201).json(invoice);
      }
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
      const { page, limit, status, search } = req.query;
      const invoices = await this.invoiceService.getAllInvoices(
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 20,
        status as string,
        search as string
      );
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
