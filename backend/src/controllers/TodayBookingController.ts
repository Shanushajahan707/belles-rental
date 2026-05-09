import { Request, Response } from 'express';
import Booking from '../models/Booking';

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

    // Only send necessary fields, including itemCode
    const result = bookings.map((b: any) => ({
      _id: b._id,
      customerName: b.customerName,
      phone: b.phone,
      startDate: b.startDate,
      items: (b.items || []).map((i: any) => ({
        itemName: i.itemName,
        itemCode: i.itemCode,
      })),
    }));

    res.json({ bookings: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
