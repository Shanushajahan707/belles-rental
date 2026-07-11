import mongoose from 'mongoose';
import Booking, { IBooking } from '../models/Booking';

export class BookingRepository {
  async findAll(): Promise<IBooking[]> {
    const bookings = await Booking.find().populate('items.itemId');

    // Sort by status: running first, then booked, then completed, then overdue
    const statusOrder = { running: 0, booked: 1, completed: 2, overdue: 3 };
    return bookings.sort((a, b) => {
      const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
      const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
      if (orderA !== orderB) return orderA - orderB;
      // If same status, sort by startDate
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }

  async findById(id: string): Promise<IBooking | null> {
    return Booking.findById(id).populate('items.itemId');
  }

  async findByItemCode(itemCode: string): Promise<IBooking[]> {
    return Booking.find({ 'items.itemCode': itemCode }).sort({ createdAt: -1 });
  }

  async findByItemId(itemId: string): Promise<IBooking[]> {
    return Booking.find({ 'items.itemId': new mongoose.Types.ObjectId(itemId) }).sort({ createdAt: -1 }).populate('items.itemId');
  }

  async findByBookingNumber(bookingNumber: string): Promise<IBooking | null> {
    const booking = await Booking.findOne({ bookingNumber }).populate('items.itemId');
    if (booking) {
      console.log(`Retrieved booking ${bookingNumber}:`, JSON.stringify(booking.items, null, 2));
    }
    return booking;
  }

  async create(bookingData: Partial<IBooking>): Promise<IBooking> {
    const booking = new Booking(bookingData);
    return booking.save();
  }

  async update(id: string, bookingData: Partial<IBooking>): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(id, bookingData, { new: true });
  }

  async updateStatus(id: string, status: string): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(id, { status }, { new: true });
  }

  async delete(id: string): Promise<IBooking | null> {
    return Booking.findByIdAndDelete(id);
  }

  async findActiveRentals(): Promise<IBooking[]> {
    return Booking.find({ status: 'running' }).populate('items.itemId');
  }

  async findDueToday(): Promise<IBooking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Booking.find({
      returnDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['running', 'booked'] },
    }).populate('items.itemId');
  }

  async findOverdue(): Promise<IBooking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Booking.find({
      returnDate: { $lt: today },
      status: { $in: ['running'] }
    }).populate('items.itemId');
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<IBooking[]> {
    // Normalize dates to UTC to avoid timezone issues
    const normalizedStart = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
    const normalizedEnd = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999));

    // Find bookings that overlap with the date range
    // A booking overlaps if: (booking.startDate <= range.endDate) AND (booking.returnDate >= range.startDate)
    const bookings = await Booking.find({
      startDate: { $lte: normalizedEnd },
      returnDate: { $gte: normalizedStart }
    }).populate('items.itemId');

    // Sort by status: running first, then booked, then completed, then overdue
    const statusOrder = { running: 0, booked: 1, completed: 2, overdue: 3 };
    return bookings.sort((a, b) => {
      const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
      const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
      if (orderA !== orderB) return orderA - orderB;
      // If same status, sort by startDate
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }

  async getStats(): Promise<{
    totalEarnings: number;
    totalBookings: number;
    activeRentals: number;
    dueToday: number;
    overdue: number;
  }> {
    const totalEarnings = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const totalBookings = await Booking.countDocuments();
    const activeRentals = await Booking.countDocuments({ status: 'running' });
    const dueToday = await this.findDueToday();
    const overdue = await this.findOverdue();

    return {
      totalEarnings: totalEarnings[0]?.total || 0,
      totalBookings,
      activeRentals,
      dueToday: dueToday.length,
      overdue: overdue.length,
    };
  }

  async getMonthlyEarnings(year: number, month: number): Promise<{
    totalRent: number;
    totalSecurity: number;
    totalRentDiscount: number;
    totalSecurityDiscount: number;
    netEarnings: number;
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    bookings: IBooking[];
  }> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const allBookings = await Booking.find({
      startDate: { $gte: monthStart, $lte: monthEnd }
    }).populate('items.itemId');

    const completedBookings = await Booking.find({
      startDate: { $gte: monthStart, $lte: monthEnd },
      status: 'completed'
    }).populate('items.itemId');

    const completedBookings = allBookings.filter(b => b.status === 'completed');
    const pendingBookings = allBookings.filter(b => ['booked', 'running'].includes(b.status));

    let totalRent = 0;
    let totalSecurity = 0;
    let totalRentDiscount = 0;
    let totalSecurityDiscount = 0;

    completedBookings.forEach(booking => {
      const bookingRent = booking.items.reduce((sum, item) => sum + (item.rentPrice || 0), 0);
      const bookingSecurity = booking.items.reduce((sum, item) => sum + (item.security || 0), 0);
      
      totalRent += bookingRent;
      totalSecurity += bookingSecurity;
      totalRentDiscount += booking.rentDiscount || 0;
      totalSecurityDiscount += booking.securityDiscount || 0;
    });

    const netEarnings = totalRent - totalRentDiscount;

    return {
      totalRent,
      totalSecurity,
      totalRentDiscount,
      totalSecurityDiscount,
      netEarnings,
      totalBookings: allBookings.length,
      completedBookings: completedBookings.length,
      pendingBookings: allBookings.length - completedBookings.length,
      bookings: allBookings
    };
  }
}
