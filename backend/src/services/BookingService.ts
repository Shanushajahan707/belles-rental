import { BookingRepository } from '../repositories/BookingRepository';
import { RentalItemRepository } from '../repositories/RentalItemRepository';
import { IBooking, IBookingItem } from '../models/Booking';
import { IRentalItem } from '../models/RentalItem';

export class BookingService {
  private bookingRepository: BookingRepository;
  private rentalItemRepository: RentalItemRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
    this.rentalItemRepository = new RentalItemRepository();
  }

  async getAllBookings(): Promise<IBooking[]> {
    return this.bookingRepository.findAll();
  }

  async getBookingById(id: string): Promise<IBooking | null> {
    return this.bookingRepository.findById(id);
  }

  async getBookingHistoryByItemId(itemId: string): Promise<IBooking[]> {
    return this.bookingRepository.findByItemId(itemId);
  }

  async createBooking(bookingData: {
    customerName: string;
    phone: string;
    address: string;
    items: { itemId: string; rentPrice: number; deposit: number }[];
    startDate: Date;
    returnDate: Date;
    discount: number;
    bookingNumber?: string; // Optional - admin can provide manual booking number
    createdBy: string; // Admin user who created the booking
  }): Promise<IBooking> {
    const bookingItems: IBookingItem[] = [];
    const newStartDate = new Date(bookingData.startDate);
    const newReturnDate = new Date(bookingData.returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use manual booking number if provided, otherwise generate one
    const bookingNumber = bookingData.bookingNumber || await this.generateBookingNumber();

    // Validate date ranges
    if (isNaN(newStartDate.getTime()) || isNaN(newReturnDate.getTime())) {
      throw new Error('Invalid date format. Please use valid dates.');
    }

    if (newStartDate > newReturnDate) {
      throw new Error('Start date cannot be after return date.');
    }

    if (newStartDate < today) {
      throw new Error('Start date cannot be in the past.');
    }

    // Validate customer information
    if (!bookingData.customerName || bookingData.customerName.trim().length < 2) {
      throw new Error('Customer name must be at least 2 characters long.');
    }

    if (!bookingData.phone || bookingData.phone.trim().length < 10) {
      throw new Error('Phone number must be at least 10 digits long.');
    }

    // Validate items
    if (!bookingData.items || bookingData.items.length === 0) {
      throw new Error('At least one item must be selected for booking.');
    }

    // Validate each item exists, is available, and check for date overlaps
    for (const item of bookingData.items) {
      // Check if item exists
      const rentalItem = await this.rentalItemRepository.findById(item.itemId);
      if (!rentalItem) {
        throw new Error(`Item with ID ${item.itemId} not found`);
      }

      // Check for date overlaps with existing bookings
      const existingBookings = await this.bookingRepository.findByItemId(item.itemId);
      for (const existingBooking of existingBookings) {
        if (existingBooking.status === 'booked' || existingBooking.status === 'running') {
          const existingStartDate = new Date(existingBooking.startDate);
          const existingReturnDate = new Date(existingBooking.returnDate);

          console.log('Checking against existing booking:', existingBooking.status, existingBooking.startDate, 'to', existingBooking.returnDate);

          // Normalize dates to compare only the date part (not time)
          // Ensure consistent timezone handling by using UTC dates
          const newStart = new Date(Date.UTC(newStartDate.getFullYear(), newStartDate.getMonth(), newStartDate.getDate()));
          const newEnd = new Date(Date.UTC(newReturnDate.getFullYear(), newReturnDate.getMonth(), newReturnDate.getDate()));
          const existingStart = new Date(Date.UTC(existingStartDate.getFullYear(), existingStartDate.getMonth(), existingStartDate.getDate()));
          const existingEnd = new Date(Date.UTC(existingReturnDate.getFullYear(), existingReturnDate.getMonth(), existingReturnDate.getDate()));

          // Allow back-to-back bookings: newStart >= existingEnd (no overlap)
          // Overlap only if newStart < existingEnd && newEnd > existingStart
          console.log('Date overlap check:', newStart, '<', existingEnd, '&&', newEnd, '>', existingStart, '=', newStart < existingEnd && newEnd > existingStart);

          if (newStart < existingEnd && newEnd > existingStart) {
            // Only prevent same user from booking exact same dates
            if (existingBooking.customerName === bookingData.customerName && existingBooking.phone === bookingData.phone) {
              throw new Error(`You have already booked item ${rentalItem.itemCode} from ${existingBooking.startDate} to ${existingBooking.returnDate}`);
            } else {
              throw new Error(`Item ${rentalItem.itemCode} is already booked from ${existingBooking.startDate} to ${existingBooking.returnDate}`);
            }
          }
        }
      }

      bookingItems.push({
        itemId: rentalItem._id,
        itemName: rentalItem.name,
        itemCode: rentalItem.itemCode,
        rentPrice: item.rentPrice,
        deposit: item.deposit,
      });
    }

    const totalRent = bookingItems.reduce((sum, item) => sum + item.rentPrice, 0);
    const totalDeposit = bookingItems.reduce((sum, item) => sum + item.deposit, 0);
    const totalAmount = totalRent + totalDeposit - bookingData.discount;

    const booking = await this.bookingRepository.create({
      bookingNumber: bookingNumber,
      customerName: bookingData.customerName,
      phone: bookingData.phone,
      address: bookingData.address,
      items: bookingItems,
      startDate: bookingData.startDate,
      returnDate: bookingData.returnDate,
      discount: bookingData.discount,
      totalAmount,
      status: 'booked',
      createdBy: bookingData.createdBy,
    });

    for (const item of bookingItems) {
      await this.rentalItemRepository.updateStatus(item.itemId.toString(), 'booked');
    }

    return booking;
  }

  async updateBooking(id: string, bookingData: Partial<IBooking>): Promise<IBooking | null> {
    return this.bookingRepository.update(id, bookingData);
  }

  async deleteBooking(id: string): Promise<IBooking | null> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Only allow deletion of bookings with 'booked' status
    if (booking.status !== 'booked') {
      throw new Error('Can only delete bookings with "booked" status');
    }

    // Update item statuses back to 'available'
    for (const item of booking.items) {
      try {
        let itemId: string;
        if (typeof item.itemId === 'string') {
          itemId = item.itemId;
        } else if (item.itemId && typeof item.itemId === 'object' && item.itemId._id) {
          itemId = item.itemId._id.toString();
        } else if (item.itemId && typeof item.itemId.toString === 'function') {
          itemId = item.itemId.toString();
        } else {
          throw new Error(`Invalid itemId structure for item ${item.itemCode}`);
        }

        await this.rentalItemRepository.updateStatus(itemId, 'available');
      } catch (error) {
        console.error('Error updating item status:', error);
        throw new Error(`Failed to update item ${item.itemCode} status to available`);
      }
    }

    return this.bookingRepository.delete(id);
  }

  async getItems(): Promise<IRentalItem[]> {
    return this.rentalItemRepository.findAll();
  }

  async startRental(bookingId: string): Promise<IBooking | null> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    for (const item of booking.items) {
      try {
        // Extract the itemId properly - handle different possible structures
        let itemId: string;
        if (typeof item.itemId === 'string') {
          itemId = item.itemId;
        } else if (item.itemId && typeof item.itemId === 'object' && item.itemId._id) {
          itemId = item.itemId._id.toString();
        } else if (item.itemId && typeof item.itemId.toString === 'function') {
          itemId = item.itemId.toString();
        } else {
          throw new Error(`Invalid itemId structure for item ${item.itemCode}`);
        }

        await this.rentalItemRepository.updateStatus(itemId, 'running');
      } catch (error) {
        console.error('Error updating item status:', error);
        throw new Error(`Failed to update item ${item.itemCode} status to running`);
      }
    }

    // Also set checkedIn to true when status is set to running
    return this.bookingRepository.update(bookingId, { status: 'running', checkedIn: true });
  }

  async completeRental(bookingId: string, actualReturnDate: Date): Promise<IBooking | null> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    for (const item of booking.items) {
      try {
        // Extract the itemId properly - handle different possible structures
        let itemId: string;
        if (typeof item.itemId === 'string') {
          itemId = item.itemId;
        } else if (item.itemId && typeof item.itemId === 'object' && item.itemId._id) {
          itemId = item.itemId._id.toString();
        } else if (item.itemId && typeof item.itemId.toString === 'function') {
          itemId = item.itemId.toString();
        } else {
          throw new Error(`Invalid itemId structure for item ${item.itemCode}`);
        }

        await this.rentalItemRepository.updateStatus(itemId, 'available');
      } catch (error) {
        console.error('Error updating item status:', error);
        throw new Error(`Failed to update item ${item.itemCode} status to available`);
      }
    }

    return this.bookingRepository.update(bookingId, {
      actualReturnDate,
      status: 'completed',
    });
  }

  async getDashboardStats(): Promise<{
    totalEarnings: number;
    totalBookings: number;
    activeRentals: number;
    dueToday: number;
    overdue: number;
    dueTodayBookings: IBooking[];
    overdueBookings: IBooking[];
  }> {
    const stats = await this.bookingRepository.getStats();
    const dueTodayBookings = await this.bookingRepository.findDueToday();
    const overdueBookings = await this.bookingRepository.findOverdue();

    return {
      ...stats,
      dueTodayBookings,
      overdueBookings,
    };
  }

  async checkAndUpdateOverdueBookings(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const runningBookings = await this.bookingRepository.findAll();

    for (const booking of runningBookings) {
      if (booking.status === 'running' || booking.status === 'booked') {
        const returnDate = new Date(booking.returnDate);
        returnDate.setHours(0, 0, 0, 0);

        if (returnDate < today) {
          await this.bookingRepository.updateStatus(booking._id.toString(), 'overdue');
        }
      }
    }
  }

  private async generateBookingNumber(): Promise<string> {
    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Get today's bookings count
    const todayBookings = await this.bookingRepository.findByDateRange(
      new Date(year, now.getMonth(), 1),
      new Date(year, now.getMonth(), 31)
    );

    // Generate sequential number for today
    const todayCount = todayBookings.length + 1;
    const bookingNumber = `BK${year}${month}${String(todayCount).padStart(4, '0')}`;

    return bookingNumber;
  }

  async getItemStats(itemId: string): Promise<{
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    overdueBookings: number;
  }> {
    const bookings = await this.bookingRepository.findByItemId(itemId);

    return {
      totalBookings: bookings.length,
      activeBookings: bookings.filter(b => b.status === 'running').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      overdueBookings: bookings.filter(b => b.status === 'overdue').length,
    };
  }

  async getBookingByNumber(bookingNumber: string): Promise<IBooking | null> {
    try {
      return await this.bookingRepository.findByBookingNumber(bookingNumber);
    } catch (error: any) {
      throw new Error(`Error fetching booking by number: ${error.message}`);
    }
  }
}
