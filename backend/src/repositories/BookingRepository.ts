import mongoose from 'mongoose';
import Booking, { IBooking } from '../models/Booking';

export class BookingRepository {
  async findAll(): Promise<IBooking[]> {
    return Booking.find().sort({ createdAt: -1 }).populate('items.itemId');
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
    return Booking.findOne({ bookingNumber }).populate('items.itemId');
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
    return Booking.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: 1 });
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
}
