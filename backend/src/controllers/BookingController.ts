import { Request, Response } from 'express';
import { BookingService } from '../services/BookingService';
import { IRentalItem } from '../models/RentalItem';

export class BookingController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  async getAllBookings(req: Request, res: Response): Promise<void> {
    try {
      const bookings = await this.bookingService.getAllBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }


  async getBookingById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.getBookingById(id);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBookingHistoryByItemId(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const bookings = await this.bookingService.getBookingHistoryByItemId(itemId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createBooking(req: Request, res: Response): Promise<void> {
    try {
      // Use the dealedStaff field from the form as createdBy
      // Fall back to authenticated user if not provided

      console.log('create booking fields', req.body);



      const bookingData = {
        ...req.body,
        createdBy: req.body.createdBy || (req as any).user?.username || 'admin'
      };

      const booking = await this.bookingService.createBooking(bookingData);

      // Automatically generate invoice for the new booking
      try {
        const { InvoiceService } = await import('../services/InvoiceService');
        const invoiceService = new InvoiceService();
        await invoiceService.generateInvoice(booking);
      } catch (invoiceError) {
        console.error('Error generating invoice:', invoiceError);
        // Don't fail the booking if invoice generation fails
      }

      res.status(201).json(booking);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateBooking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const bookingData = req.body;
      console.log('update booking fields', bookingData);
      const booking = await this.bookingService.updateBooking(id, bookingData);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      // Automatically regenerate invoice for the updated booking
      try {
        const { InvoiceService } = await import('../services/InvoiceService');
        const invoiceService = new InvoiceService();
        await invoiceService.updateInvoice(booking);
      } catch (invoiceError) {
        console.error('Error updating invoice:', invoiceError);
        // Don't fail the booking update if invoice update fails
      }

      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteBooking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.deleteBooking(id);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }
      res.json({ message: 'Booking deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async startRental(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.startRental(id);
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async completeRental(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { actualReturnDate } = req.body;
      const booking = await this.bookingService.completeRental(id, new Date(actualReturnDate));
      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.bookingService.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getItemStats(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const stats = await this.bookingService.getItemStats(itemId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  async getItems(req: Request, res: Response): Promise<void> {
    // console.log('getItems called', req);
    try {
      const items = await this.bookingService.getItems();
      console.log('items retrieved:', items?.length || 0);
      console.log('items data:', JSON.stringify(items, null, 2));
      res.json(items);
    } catch (error: any) {
      console.error('Error in getItems:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: error.message });
    }
  }

  async getBookingByNumber(req: Request, res: Response): Promise<void> {
    try {
      const { bookingNumber } = req.params;
      const booking = await this.bookingService.getBookingByNumber(bookingNumber);

      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getItemEarnings(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const earnings = await this.bookingService.getItemEarnings(itemId);
      res.json({ totalEarnings: earnings });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

