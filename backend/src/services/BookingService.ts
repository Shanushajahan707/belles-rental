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

  async getAllBookings(startDate?: Date, endDate?: Date): Promise<IBooking[]> {
    if (startDate && endDate) {
      return this.bookingRepository.findByDateRange(startDate, endDate);
    }
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
    items: { itemId: string; rentPrice: number; security: number }[];
    startDate: Date;
    returnDate: Date;
    rentDiscount: number;
    securityDiscount: number;
    advancePayment: number;
    bookingNumber?: string; // Optional - admin can provide manual booking number
    createdBy: string; // Admin user who created the booking
    note?: string; // Admin-only note for additional booking information
    additionalCharges?: number; // Additional charges for extra days beyond standard period
  }): Promise<IBooking> {
    const bookingItems: IBookingItem[] = [];
    const newStartDate = new Date(bookingData.startDate);
    const newReturnDate = new Date(bookingData.returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use manual booking number if provided, otherwise generate one
    let bookingNumber: string;
    if (bookingData.bookingNumber) {
      // Check if booking number already exists
      const existingBooking = await this.bookingRepository.findByBookingNumber(bookingData.bookingNumber);
      if (existingBooking) {
        throw new Error(`Booking number ${bookingData.bookingNumber} already exists. Please use a different number or leave empty to auto-generate.`);
      }
      bookingNumber = bookingData.bookingNumber;
    } else {
      bookingNumber = await this.generateBookingNumber();
    }

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
            // Check if this is the same pricing type or if item doesn't support both pricing types
            const existingItem = existingBooking.items.find((existingItem: any) =>
              (existingItem.itemId?.toString() === item.itemId.toString()) ||
              (existingItem.itemId?._id?.toString() === item.itemId.toString())
            );

            const existingPriceType = existingItem?.priceType || 'full';
            const newPriceType = (item as any).priceType || 'full';

            // If the item doesn't support half pricing, use the original logic
            if (!rentalItem.supportsHalfPricing) {
              if (existingBooking.customerName === bookingData.customerName && existingBooking.phone === bookingData.phone) {
                const priceTypeText = existingPriceType === 'half' ? ' at half price' : ' at full price';
                throw new Error(`You have already booked item ${rentalItem.itemCode}${priceTypeText} from ${existingBooking.startDate} to ${existingBooking.returnDate}`);
              } else {
                const priceTypeText = existingPriceType === 'half' ? ' at half price' : ' at full price';
                throw new Error(`Item ${rentalItem.itemCode}${priceTypeText} is already booked from ${existingBooking.startDate} to ${existingBooking.returnDate}`);
              }
            }

            // For items that support half pricing, check inventory logic
            // Calculate total units booked during the overlapping period
            let totalUnitsBooked = 0;
            const overlappingBookings = existingBookings.filter(booking => {
              if (booking.status !== 'booked' && booking.status !== 'running') return false;

              const bookingStart = new Date(Date.UTC(
                new Date(booking.startDate).getFullYear(),
                new Date(booking.startDate).getMonth(),
                new Date(booking.startDate).getDate()
              ));
              const bookingEnd = new Date(Date.UTC(
                new Date(booking.returnDate).getFullYear(),
                new Date(booking.returnDate).getMonth(),
                new Date(booking.returnDate).getDate()
              ));

              return newStart < bookingEnd && newEnd > bookingStart;
            });

            // Calculate units needed for existing overlapping bookings
            console.log(`Checking inventory for item ${rentalItem.itemCode}, new booking: ${newPriceType}`);
            console.log('Existing overlapping bookings:', overlappingBookings.map(b => ({
              bookingNumber: b.bookingNumber,
              customerName: b.customerName,
              items: b.items.map(i => ({ priceType: i.priceType }))
            })));

            for (const overlappingBooking of overlappingBookings) {
              const overlappingItem = overlappingBooking.items.find((overlappingItem: any) =>
                (overlappingItem.itemId?.toString() === item.itemId.toString()) ||
                (overlappingItem.itemId?._id?.toString() === item.itemId.toString())
              );

              if (overlappingItem) {
                const overlappingPriceType = overlappingItem?.priceType || 'full';
                const unitsToAdd = overlappingPriceType === 'full' ? 2 : 1;
                totalUnitsBooked += unitsToAdd;
                console.log(`Found overlapping booking: ${overlappingBooking.bookingNumber}, item: ${rentalItem.itemCode}, type: ${overlappingPriceType}, units: ${unitsToAdd}, total so far: ${totalUnitsBooked}`);
              }
            }

            // Calculate units needed for new booking
            const newUnitsNeeded = newPriceType === 'full' ? 2 : 1;

            console.log(`Final calculation - Total units booked: ${totalUnitsBooked}, New units needed: ${newUnitsNeeded}, Available: ${2 - totalUnitsBooked}`);

            // Check if enough units are available (total units = 2 for items supporting half pricing)
            if (totalUnitsBooked + newUnitsNeeded > 2) {
              // Check if it's the same customer trying to double-book
              const sameCustomerBooking = overlappingBookings.find(booking =>
                booking.customerName === bookingData.customerName &&
                booking.phone === bookingData.phone
              );

              if (sameCustomerBooking) {
                const priceTypeText = newPriceType === 'half' ? ' at half price' : ' at full price';
                throw new Error(`You have already booked item ${rentalItem.itemCode}${priceTypeText} from ${sameCustomerBooking.startDate} to ${sameCustomerBooking.returnDate}`);
              } else {
                // Determine what's actually available
                const availableUnits = 2 - totalUnitsBooked;
                let availableText = '';
                if (availableUnits === 0) {
                  availableText = 'This item is completely booked';
                } else if (availableUnits === 1) {
                  availableText = 'Only one part of this item is available';
                }

                const requestedText = newPriceType === 'half' ? 'one part' : 'the complete item';
                throw new Error(`Cannot book ${rentalItem.itemCode}. ${availableText} for these dates, but you tried to book ${requestedText}.`);
              }
            }
          }
        }
      }

      bookingItems.push({
        itemId: rentalItem._id,
        itemName: rentalItem.name,
        itemCode: rentalItem.itemCode,
        rentPrice: item.rentPrice,
        security: item.security,
        priceType: (item as any).priceType || 'full',
      });
    }

    // Validate advance payment requirement
    if (!bookingData.advancePayment || bookingData.advancePayment <= 0) {
      throw new Error('Advance payment is required to create a booking. Please enter an advance payment amount.');
    }

    const totalRent = bookingItems.reduce((sum, item) => sum + item.rentPrice, 0);
    const totalSecurity = bookingItems.reduce((sum, item) => sum + item.security, 0);
    const rentDiscount = bookingData.rentDiscount || 0;
    const securityDiscount = bookingData.securityDiscount || 0;
    const advancePayment = bookingData.advancePayment || 0;
    const additionalCharges = bookingData.additionalCharges || 0;
    const totalRentAfterDiscount = totalRent - rentDiscount;
    const totalSecurityAfterDiscount = totalSecurity - securityDiscount;
    const totalAmount = totalRentAfterDiscount + totalSecurityAfterDiscount + additionalCharges;
    const balanceAmount = totalAmount - advancePayment;

    const booking = await this.bookingRepository.create({
      bookingNumber: bookingNumber,
      customerName: bookingData.customerName,
      phone: bookingData.phone,
      address: bookingData.address,
      items: bookingItems,
      startDate: bookingData.startDate,
      returnDate: bookingData.returnDate,
      rentDiscount,
      securityDiscount,
      advancePayment,
      additionalCharges,
      totalAmount,
      balanceAmount,
      status: 'booked',
      createdBy: bookingData.createdBy,
      note: bookingData.note,
    });

    console.log(`Created booking ${bookingNumber} with items:`, JSON.stringify(bookingItems, null, 2));
    console.log(`Saved booking data:`, JSON.stringify(booking.items, null, 2));

    for (const item of bookingItems) {
      try {
        await this.rentalItemRepository.updateStatus(item.itemId.toString(), 'booked');
        console.log(`Set item ${item.itemCode} (ID: ${item.itemId}) status to 'booked' for booking ${bookingNumber}`);
      } catch (error) {
        console.error(`Failed to update item ${item.itemCode} status to 'booked':`, error);
        throw new Error(`Failed to set item ${item.itemCode} to booked status`);
      }
    }

    return booking;
  }

  async updateBooking(id: string, bookingData: Partial<IBooking>): Promise<IBooking | null> {
    // Get the existing booking
    const existingBooking = await this.bookingRepository.findById(id);
    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    // If updating items, dates, or priceType, run inventory validation
    if (bookingData.items || bookingData.startDate || bookingData.returnDate) {
      const updatedStartDate = new Date(bookingData.startDate || existingBooking.startDate);
      const updatedReturnDate = new Date(bookingData.returnDate || existingBooking.returnDate);
      const updatedItems = bookingData.items || existingBooking.items;

      // Validate date ranges
      if (isNaN(updatedStartDate.getTime()) || isNaN(updatedReturnDate.getTime())) {
        throw new Error('Invalid date format. Please use valid dates.');
      }

      if (updatedStartDate > updatedReturnDate) {
        throw new Error('Start date cannot be after return date.');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (updatedStartDate < today) {
        throw new Error('Start date cannot be in the past.');
      }

      // Check inventory conflicts for each item
      for (const item of updatedItems) {
        const rentalItem = await this.rentalItemRepository.findById(item.itemId.toString());
        if (!rentalItem) {
          throw new Error(`Item with ID ${item.itemId} not found`);
        }

        // Check for date overlaps with existing bookings (excluding current booking)
        const existingBookings = await this.bookingRepository.findByItemId(item.itemId.toString());
        const otherBookings = existingBookings.filter(booking =>
          booking._id.toString() !== id &&
          (booking.status === 'booked' || booking.status === 'running')
        );

        // Get the current booking's original item details to compare pricing types
        const originalItem = existingBooking.items.find((originalItem: any) =>
          (originalItem.itemId?.toString() === item.itemId.toString()) ||
          (originalItem.itemId?._id?.toString() === item.itemId.toString())
        );
        const originalPriceType = originalItem?.priceType || 'full';
        const newPriceType = (item as any).priceType || 'full';

        for (const otherBooking of otherBookings) {
          const otherStartDate = new Date(otherBooking.startDate);
          const otherReturnDate = new Date(otherBooking.returnDate);

          const newStart = new Date(Date.UTC(updatedStartDate.getFullYear(), updatedStartDate.getMonth(), updatedStartDate.getDate()));
          const newEnd = new Date(Date.UTC(updatedReturnDate.getFullYear(), updatedReturnDate.getMonth(), updatedReturnDate.getDate()));
          const otherStart = new Date(Date.UTC(otherStartDate.getFullYear(), otherStartDate.getMonth(), otherStartDate.getDate()));
          const otherEnd = new Date(Date.UTC(otherReturnDate.getFullYear(), otherReturnDate.getMonth(), otherReturnDate.getDate()));

          if (newStart < otherEnd && newEnd > otherStart) {
            const otherItem = otherBooking.items.find((otherItem: any) =>
              (otherItem.itemId?.toString() === item.itemId.toString()) ||
              (otherItem.itemId?._id?.toString() === item.itemId.toString())
            );

            const otherPriceType = otherItem?.priceType || 'full';

            // If the item doesn't support half pricing, use the original logic
            if (!rentalItem.supportsHalfPricing) {
              throw new Error(`Item ${rentalItem.itemCode} at ${newPriceType} price conflicts with existing booking from ${otherBooking.startDate} to ${otherBooking.returnDate}`);
            }

            // For items supporting half pricing, check inventory
            let totalUnitsBooked = 0;
            const overlappingBookings = otherBookings.filter(booking => {
              const bookingStart = new Date(Date.UTC(
                new Date(booking.startDate).getFullYear(),
                new Date(booking.startDate).getMonth(),
                new Date(booking.startDate).getDate()
              ));
              const bookingEnd = new Date(Date.UTC(
                new Date(booking.returnDate).getFullYear(),
                new Date(booking.returnDate).getMonth(),
                new Date(booking.returnDate).getDate()
              ));
              return newStart < bookingEnd && newEnd > bookingStart;
            });

            for (const overlappingBooking of overlappingBookings) {
              const overlappingItem = overlappingBooking.items.find((overlappingItem: any) =>
                (overlappingItem.itemId?.toString() === item.itemId.toString()) ||
                (overlappingItem.itemId?._id?.toString() === item.itemId.toString())
              );
              if (overlappingItem) {
                const overlappingPriceType = overlappingItem?.priceType || 'full';
                totalUnitsBooked += overlappingPriceType === 'full' ? 2 : 1;
              }
            }

            const newUnitsNeeded = newPriceType === 'full' ? 2 : 1;
            if (totalUnitsBooked + newUnitsNeeded > 2) {
              throw new Error(`Cannot update booking for ${rentalItem.itemCode}. Insufficient inventory available for the selected dates.`);
            }
          }
        }
      }
    }

    // Recalculate totals whenever any booking pricing or payment details change
    if (
      bookingData.items ||
      bookingData.rentDiscount !== undefined ||
      bookingData.securityDiscount !== undefined ||
      bookingData.advancePayment !== undefined ||
      bookingData.additionalCharges !== undefined
    ) {
      const updatedItems = bookingData.items || existingBooking.items;
      const totalRent = updatedItems.reduce((sum, item) => sum + (item.rentPrice || 0), 0);
      const totalSecurity = updatedItems.reduce((sum, item) => sum + (item.security || 0), 0);
      const rentDiscount = bookingData.rentDiscount !== undefined ? bookingData.rentDiscount : existingBooking.rentDiscount || 0;
      const securityDiscount = bookingData.securityDiscount !== undefined ? bookingData.securityDiscount : existingBooking.securityDiscount || 0;
      const advancePayment = bookingData.advancePayment !== undefined ? bookingData.advancePayment : existingBooking.advancePayment || 0;
      const additionalCharges = bookingData.additionalCharges !== undefined ? bookingData.additionalCharges : existingBooking.additionalCharges || 0;

      const totalRentAfterDiscount = totalRent - rentDiscount;
      const totalSecurityAfterDiscount = totalSecurity - securityDiscount;
      const totalAmount = totalRentAfterDiscount + totalSecurityAfterDiscount + additionalCharges;
      const balanceAmount = totalAmount - advancePayment;

      bookingData.totalAmount = totalAmount;
      bookingData.balanceAmount = balanceAmount;
    }

    // Proceed with the update
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
        console.log(`Set item ${item.itemCode} (ID: ${itemId}) status to 'available' - booking ${booking._id} deleted`);
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
        console.log(`Set item ${item.itemCode} (ID: ${itemId}) status to 'running' for booking ${booking._id}`);
      } catch (error) {
        console.error(`Error updating item ${item.itemCode} status to running:`, error);
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
    
    const itemErrors: Error[] = [];

    // Try to update item statuses to available/booked before marking booking complete.
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
          console.error(`Invalid itemId structure for item ${item.itemCode}`);
          continue; // Skip this item but don't fail the entire operation
        }

        // Check if item exists and is in 'running' status
        const rentalItem = await this.rentalItemRepository.findById(itemId);
        if (!rentalItem) {
          console.error(`Rental item ${item.itemCode} not found`);
          continue;
        }

        if (rentalItem.status !== 'running') {
          console.log(`Item ${item.itemCode} is not in 'running' status. Current status: ${rentalItem.status}. Skipping status update.`);
          continue;
        }

        const activeBookings = await this.bookingRepository.findByItemId(itemId);
        const otherActiveBookings = activeBookings.filter(b =>
          b._id.toString() !== booking._id.toString() &&
          ['booked', 'running'].includes(b.status) &&
          (b.status === 'running' || (b.status === 'booked' && new Date(b.returnDate) >= new Date()))
        );

        if (otherActiveBookings.length > 0) {
          console.log(`Item ${item.itemCode} has ${otherActiveBookings.length} other conflicting active bookings. Cannot set to available:`, otherActiveBookings.map(b => ({
            id: b._id,
            status: b.status,
            returnDate: b.returnDate,
            startDate: b.startDate
          })));
          await this.rentalItemRepository.updateStatus(itemId, 'booked');
          continue;
        }

        await this.rentalItemRepository.updateStatus(itemId, 'available');
        console.log(`Set item ${item.itemCode} (ID: ${itemId}) status to 'available' - booking ${booking._id} completed. Previous status: ${rentalItem.status}`);
      } catch (error: any) {
        itemErrors.push(error);
        console.error(`Error updating item ${item.itemCode} status:`, error);
      }
    }

    const completedBooking = await this.bookingRepository.update(bookingId, {
      actualReturnDate,
      status: 'completed',
    });

    if (itemErrors.length > 0) {
      console.error(`Completed booking ${bookingId} with item status update errors:`, itemErrors.map(e => e.message));
    }

    return completedBooking;
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
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const monthStart = new Date(year, now.getMonth(), 1);
    const monthEnd = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthBookings = await this.bookingRepository.findByDateRange(monthStart, monthEnd);

    const sequence = monthBookings.length + 1;
    const bookingNumber = `BK${year}${month}${String(sequence).padStart(4, '0')}`;

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

  async getItemEarnings(itemId: string): Promise<number> {
    const bookings = await this.bookingRepository.findByItemId(itemId);

    return bookings
      .filter(booking => booking.status === 'completed')
      .reduce((total, booking) => {
        // Find this specific item in the booking
        const bookingItem = booking.items?.find(item => {
          const itemItemId = typeof item.itemId === 'string'
            ? item.itemId
            : item.itemId?._id?.toString() || item.itemId?.toString();
          return itemItemId === itemId;
        });

        if (!bookingItem) return total;

        // Calculate individual item earnings: item rent - proportionate discount
        const itemRent = bookingItem.rentPrice || 0;
        const itemTotal = itemRent + (bookingItem.security || 0);

        // Calculate proportionate discount for this item
        const bookingTotalWithoutDiscount = booking.totalAmount + booking.rentDiscount + booking.securityDiscount;
        const totalDiscount = booking.rentDiscount + booking.securityDiscount;
        const discountProportion = bookingTotalWithoutDiscount > 0
          ? (itemTotal / bookingTotalWithoutDiscount) * totalDiscount
          : 0;

        // Individual earnings: rent - proportionate discount
        const individualEarnings = itemRent - discountProportion;
        return total + Math.max(0, individualEarnings); // Ensure non-negative
      }, 0);
  }
}
