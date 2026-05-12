'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, DollarSign, Calculator } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface RentalItem {
  _id: string;
  itemCode: string;
  name: string;
  category: string;
  rentPrice: number;
  halfRentPrice: number;
  securityDeposit: number;
  halfSecurityDeposit: number;
  supportsHalfPricing: boolean;
  status: 'available' | 'booked' | 'running';
}

interface BookingItem {
  itemId: string;
  itemName: string;
  itemCode: string;
  rentPrice: number;
  security: number;
  priceType?: 'full' | 'half';
}

interface Booking {
  _id: string;
  bookingNumber: string;
  customerName: string;
  phone: string;
  address: string;
  items: BookingItem[];
  startDate: string;
  returnDate: string;
  rentDiscount: number;
  securityDiscount: number;
  advancePayment: number;
  totalAmount: number;
  balanceAmount: number;
  status: string;
  createdBy: string;
  note?: string;
}

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [items, setItems] = useState<RentalItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<BookingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    startDate: '',
    returnDate: '',
    rentDiscount: '',
    securityDiscount: '',
    advancePayment: '',
    bookingNumber: '',
    dealedStaff: '',
    note: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchBooking();
    fetchAvailableItems();
  }, [params.id]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${params.id}`);
      const bookingData = response.data;
      setBooking(bookingData);

      // Debug: log the items structure
      console.log('Booking items:', bookingData.items);

      // Ensure selectedItems has the correct structure
      const mappedItems = bookingData.items.map((item: any) => ({
        itemId: typeof item.itemId === 'object' ? item.itemId._id : item.itemId,
        itemName: item.itemId?.name || item.itemName,
        itemCode: item.itemId?.itemCode || item.itemCode,
        rentPrice: item.rentPrice,
        security: item.security,
        priceType: item.priceType || 'full',
      }));

      console.log('Mapped items:', mappedItems);
      setSelectedItems(mappedItems);
      setFormData({
        customerName: bookingData.customerName,
        phone: bookingData.phone,
        address: bookingData.address,
        startDate: bookingData.startDate.split('T')[0],
        returnDate: bookingData.returnDate.split('T')[0],
        rentDiscount: bookingData.rentDiscount?.toString() || '',
        securityDiscount: bookingData.securityDiscount?.toString() || '',
        advancePayment: bookingData.advancePayment?.toString() || '',
        bookingNumber: bookingData.bookingNumber || '',
        dealedStaff: bookingData.createdBy,
        note: bookingData.note || ''
      });
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      if (error.response?.status === 404) {
        toast.addToast({
          message: 'Booking not found',
          type: 'error',
        });
        router.push('/admin/bookings');
      }
    }
  };

  const fetchAvailableItems = async () => {
    try {
      const response = await api.get('/bookings/fetchItems');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItemToBooking = (item: RentalItem, priceType?: 'full' | 'half') => {
    if (selectedItems.find(si => si.itemId === item._id)) return;

    // Auto-determine price type based on item support
    const selectedPriceType = priceType || (item.supportsHalfPricing ? 'half' : 'full');

    setSelectedItems([
      ...selectedItems,
      {
        itemId: item._id,
        itemName: item.name,
        itemCode: item.itemCode,
        rentPrice: selectedPriceType === 'half' ? item.halfRentPrice : item.rentPrice,
        security: selectedPriceType === 'half' ? item.halfSecurityDeposit : item.securityDeposit,
        priceType: selectedPriceType,
      },
    ]);
  };

  const removeItemFromBooking = (itemId: string) => {
    setSelectedItems(selectedItems.filter(si => si.itemId !== itemId));
  };

  const filteredItems = useMemo(() =>
    items.filter(
      item =>

      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [items, searchQuery]
  );

  const totalRent = selectedItems.reduce((sum, item) => sum + item.rentPrice, 0);
  const totalSecurity = selectedItems.reduce((sum, item) => sum + item.security, 0);
  const rentDiscount = Number(formData.rentDiscount || '0') || 0;
  const securityDiscount = Number(formData.securityDiscount || '0') || 0;
  const advancePayment = Number(formData.advancePayment || '0') || 0;
  const totalRentAfterDiscount = totalRent - rentDiscount;
  const totalSecurityAfterDiscount = totalSecurity - securityDiscount;
  const totalAmount = totalRentAfterDiscount + totalSecurityAfterDiscount;
  const balanceAmount = totalAmount - advancePayment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const bookingData = {
        bookingNumber: formData.bookingNumber || undefined,
        customerName: formData.customerName,
        phone: formData.phone,
        address: formData.address,
        items: selectedItems.map(si => ({
          itemId: si.itemId,
          rentPrice: si.rentPrice,
          security: si.security,
          priceType: si.priceType,
        })),
        startDate: formData.startDate,
        returnDate: formData.returnDate,
        rentDiscount: Number(formData.rentDiscount),
        securityDiscount: Number(formData.securityDiscount),
        advancePayment: Number(formData.advancePayment),
        createdBy: formData.dealedStaff,
        note: formData.note || undefined
      };

      await api.put(`/bookings/${params.id}`, bookingData);
      toast.addToast({
        message: 'Booking updated successfully!',
        type: 'success',
      });
      router.push('/admin/bookings');
    } catch (error: any) {
      console.error('Error updating booking:', error);
      const errorMessage = error.response?.data?.error || 'Error updating booking';

      if (errorMessage.includes('already booked from')) {
        toast.addToast({
          message: `Booking Conflict: ${errorMessage}`,
          type: 'error',
          duration: 8000,
        });
      } else if (errorMessage.includes('not available')) {
        toast.addToast({
          message: `Item Unavailable: ${errorMessage}`,
          type: 'error',
          duration: 6000,
        });
      } else {
        toast.addToast({
          message: errorMessage,
          type: 'error',
        });
      }
    }
  };

  if (loading || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Only allow editing of bookings with 'booked' status
  if (booking.status !== 'booked') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Cannot Edit Booking</h2>
          <p className="text-gray-600 mb-6">
            Only bookings with "booked" status can be edited. This booking is currently "{booking.status}".
          </p>
          <Link
            href="/admin/bookings"
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/admin/bookings" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
              Back to Bookings
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Edit Booking #{booking.bookingNumber}</h1>
            <div></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booking Register Number</label>
                  <input
                    type="text"
                    value={formData.bookingNumber}
                    onChange={(e) => setFormData({ ...formData, bookingNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black"
                    placeholder="Enter booking register number (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dealed Staff *</label>
                  <input
                    type="text"
                    value={formData.dealedStaff}
                    onChange={(e) => setFormData({ ...formData, dealedStaff: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black"
                    placeholder="Enter staff name who dealt this booking"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="9876543210"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="123 Main Street, City"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Note (Optional)</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Add any additional notes about this booking (e.g., weather conditions, special requirements, item condition notes). This note is only visible to admins."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Booking Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Return Date</label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Manage Items</h2>
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or item code..."
                  className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No available items found
                  </div>
                ) : (
                  filteredItems.map((item: RentalItem) => {
                    const isAdded = selectedItems.some(si => si.itemId === item._id);
                    return (
                      <div
                        key={item._id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="mb-2">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-600">Item Code: {item.itemCode}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <p className="font-medium text-gray-700">Full Price:</p>
                            <p className="text-gray-600">Rent: ₹{item.rentPrice}</p>
                            <p className="text-gray-600">Security: ₹{item.securityDeposit}</p>
                          </div>
                          {item.supportsHalfPricing && (
                            <div>
                              <p className="font-medium text-green-700">Half Price:</p>
                              <p className="text-green-600">Rent: ₹{item.halfRentPrice}</p>
                              <p className="text-green-600">Security: ₹{item.halfSecurityDeposit}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => addItemToBooking(item, 'full')}
                            disabled={isAdded}
                            className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            Add Full
                          </button>
                          {item.supportsHalfPricing && (
                            <button
                              type="button"
                              onClick={() => addItemToBooking(item, 'half')}
                              disabled={isAdded}
                              className="flex-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              Add Half
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-pink-600" />
                  <h2 className="text-xl font-bold text-gray-800">Booking Summary</h2>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Items:</span>
                  {selectedItems.filter(item => item.priceType === 'half').length > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {selectedItems.filter(item => item.priceType === 'half').length} half
                    </span>
                  )}
                  {selectedItems.filter(item => item.priceType === 'full').length > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {selectedItems.filter(item => item.priceType === 'full').length} full
                    </span>
                  )}
                </div>
              </div>

              {selectedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🛒</div>
                  <p>No items added yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {selectedItems.map(item => (
                      <div key={item.itemId} className={`flex items-center justify-between p-2 rounded-lg ${item.priceType === 'half' ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-800">{item.itemName}</p>
                          <p className="text-xs text-gray-600">{item.itemCode}</p>
                          <p className={`text-xs font-medium ${item.priceType === 'half' ? 'text-green-600' : 'text-blue-600'}`}>
                            {item.priceType === 'half' ? 'Half Price' : 'Full Price'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemFromBooking(item.itemId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Total Rent</span>
                      <span className="font-medium text-gray-800">₹{totalRent}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-black">Rent Discount</span>
                      <input
                        type="number"
                        value={formData.rentDiscount}
                        onChange={(e) => setFormData({ ...formData, rentDiscount: e.target.value })}
                        min="0"
                        placeholder=''
                        step="0.01"
                        className="w-24 px-2 py-1 border border-gray-300 text-gray-800 rounded text-right text-sm"
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Total Security</span>
                      <span className="font-medium text-gray-800">₹{totalSecurity}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-black">Security Discount</span>
                      <input
                        type="number"
                        value={formData.securityDiscount}
                        onChange={(e) => setFormData({ ...formData, securityDiscount: e.target.value })}
                        min="0"
                        placeholder=''
                        step="0.01"
                        className="w-24 px-2 py-1 border border-gray-300 text-gray-800 rounded text-right text-sm"
                      />
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-black font-medium">Advance Payment *</span>
                      <input
                        type="number"
                        value={formData.advancePayment}
                        onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                        min="1"
                        placeholder='Required'
                        step="0.01"
                        required
                        className="w-24 px-2 py-1 border border-red-300 text-gray-800 rounded text-right text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span className="text-gray-800">Total (Rent - Rent Disc + Security - Security Disc)</span>
                      <span className="text-gray-800">₹{totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-green-600">Balance Amount</span>
                      <span className="text-green-600">₹{balanceAmount}</span>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={selectedItems.length === 0}
                className="w-full mt-6 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Update Booking
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
