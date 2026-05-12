import { Request, Response } from 'express';
import Booking from '../models/Booking';
import RentalItem from '../models/RentalItem';

// GET /bookings/today-unchecked-in
export const getTodayUncheckedInBookings = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const bookings = await Booking.find({
      startDate: { $gte: today, $lt: tomorrow },
      checkedIn: false,
      status: { $in: ['booked', 'running'] },
    })
      .sort({ startDate: 1 })
      .lean();

    // Process bookings to ensure item details are included
    const result = await Promise.all(bookings.map(async (b: any) => {
      const items = await Promise.all((b.items || []).map(async (i: any) => {
        // If itemName and itemCode exist, use them
        if (i.itemName && i.itemCode) {
          return {
            itemName: i.itemName,
            itemCode: i.itemCode,
            priceType: i.priceType || 'full',
          };
        }

        // Otherwise, fetch the rental item details
        try {
          const rentalItem = await RentalItem.findById(i.itemId);
          return {
            itemName: rentalItem?.name || 'Unknown Item',
            itemCode: rentalItem?.itemCode || 'N/A',
            priceType: i.priceType || 'full',
          };
        } catch (error) {
          return {
            itemName: 'Unknown Item',
            itemCode: 'N/A',
            priceType: i.priceType || 'full',
          };
        }
      }));

      return {
        _id: b._id,
        customerName: b.customerName,
        phone: b.phone,
        startDate: b.startDate,
        items,
      };
    }));

    res.json({ bookings: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
