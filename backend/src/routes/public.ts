import { Router } from 'express';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import Booking from '../models/Booking';
import RentalItem from '../models/RentalItem';

const router = Router();

// Public endpoints (no authentication required)
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date() });
});

router.get('/health', (req: Request, res: Response) => {
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = mongoose.connection?.readyState ?? 0;
  res.json({
    status: 'ok',
    backend: 'connected',
    database: stateMap[dbState] || 'unknown',
    uptimeSeconds: process.uptime(),
    timestamp: new Date(),
  });
});

// Public route to view booking details by invoice number
router.get('/booking/:invoiceNumber', async (req: Request, res: Response) => {
  try {
    const { invoiceNumber } = req.params;

    // Find invoice by invoice number
    const invoice = await Invoice.findOne({ invoiceNumber }).populate('bookingId');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get booking details
    const booking = await Booking.findById(invoice.bookingId).populate('items.itemId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Fetch rental items to get current details
    const itemCodes = invoice.items.map(item => item.itemCode);
    const rentalItems = await RentalItem.find({ itemCode: { $in: itemCodes } });
    const rentalItemMap = rentalItems.reduce((map: any, item: any) => {
      map[item.itemCode] = item;
      return map;
    }, {});

    // Enhance invoice items with current details from rental items
    const enhancedItems = invoice.items.map(item => {
      const rentalItem = rentalItemMap[item.itemCode];
      return {
        itemName: rentalItem?.name || item.itemName || 'Unknown Jewellery',
        itemCode: rentalItem?.itemCode || item.itemCode || 'N/A',
        rentPrice: rentalItem?.rentPrice || item.rentPrice || 0,
        security: rentalItem?.security || item.security || 0,
        quantity: item.quantity || 1,
        priceType: rentalItem?.priceType || item.priceType || 'full',
        image: rentalItem?.image || item.image || '',
      };
    });

    // Return booking and invoice details
    res.json({
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        customerAddress: invoice.customerAddress,
        items: enhancedItems,
        bookingNumber: invoice.bookingNumber,
        startDate: invoice.startDate,
        returnDate: invoice.returnDate,
        totalRent: invoice.totalRent,
        totalSecurity: invoice.totalSecurity,
        rentDiscount: invoice.rentDiscount,
        securityDiscount: invoice.securityDiscount,
        advancePayment: invoice.advancePayment,
        additionalCharges: invoice.additionalCharges,
        totalAmount: invoice.totalAmount,
        balanceAmount: invoice.balanceAmount,
        shopName: invoice.shopName,
        shopAddress: invoice.shopAddress,
        shopPhone: invoice.shopPhone,
        shopEmail: invoice.shopEmail,
        createdAt: invoice.createdAt,
      },
      booking: {
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        phone: booking.phone,
        address: booking.address,
        items: booking.items,
        startDate: booking.startDate,
        returnDate: booking.returnDate,
        actualReturnDate: booking.actualReturnDate,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching public booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
});

export default router;
