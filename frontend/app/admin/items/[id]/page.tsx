'use client';

// Item details page with earnings calculation

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface RentalItem {
  _id: string;
  itemCode: string;
  barcode: string;
  name: string;
  oldEarnings: number;
  category: string;
  image: string;
  rentPrice: number;
  securityDeposit: number;
  purchasePrice: number;
  status: 'available' | 'booked' | 'running' | 'sold_out';
}

interface Booking {
  _id: string;
  customerName: string;
  phone: string;
  address: string;
  items: any[];
  startDate: string;
  returnDate: string;
  actualReturnDate?: string;
  discount: number;
  rentDiscount: number;
  securityDiscount: number;
  totalAmount: number;
  status: 'booked' | 'running' | 'completed' | 'overdue';
  createdAt: string;
}

interface ItemStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  overdueBookings: number;
  totalEarnings: number;
}

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;
  const [item, setItem] = useState<RentalItem | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<ItemStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate item-specific booking stats
  const calculateBookingStats = () => {
    let totalBookings = 0;
    let activeBookings = 0;
    let completedBookings = 0;
    let overdueBookings = 0;

    bookings.forEach((booking) => {
      // Check if this item is in the booking
      const hasItem = booking.items?.some((bi: any) => bi.itemId === itemId || bi.itemId?._id === itemId);
      if (hasItem) {
        totalBookings++;
        if (booking.status === 'booked' || booking.status === 'running') {
          activeBookings++;
        } else if (booking.status === 'completed') {
          completedBookings++;
        } else if (booking.status === 'overdue') {
          overdueBookings++;
        }
      }
    });

    return { totalBookings, activeBookings, completedBookings, overdueBookings };
  };

  const bookingStats = calculateBookingStats();

  // Calculate earnings specifically for this item only (not entire booking)
  const calculateItemEarnings = () => {
    return bookings.reduce((total, booking) => {
      // Find this specific item in the booking
      const bookingItem = booking.items?.find((bi: any) => bi.itemId === itemId || bi.itemId?._id === itemId);
      if (bookingItem && (booking.status === 'completed' || booking.status === 'running' || booking.status === 'overdue')) {
        // Count total items in the booking
        const totalItemsInBooking = booking.items?.length || 0;

        // Divide booking discount equally among all items
        const rentDiscountPerItem = totalItemsInBooking > 0 ? (booking.rentDiscount || 0) / totalItemsInBooking : 0;

        // Calculate net earnings for this item (rent price - equal share of discount)
        const netEarnings = (bookingItem.rentPrice || 0) - rentDiscountPerItem;

        return total + netEarnings;
      }
      return total;
    }, 0);
  };

  const itemEarnings = calculateItemEarnings();
  const totalEarnings = item
    ? (item.oldEarnings || 0) + itemEarnings
    : 0;

  const profitAmount = item
    ? totalEarnings - item.purchasePrice
    : 0;

  const profitLabel =
    profitAmount > 0
      ? 'Net profit since purchase'
      : profitAmount < 0
        ? 'Net loss since purchase'
        : 'Break-even since purchase';

  const profitDisplay = Math.abs(profitAmount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  useEffect(() => {
    checkAuth();
    fetchData();
  }, [itemId]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    }
  };

  const fetchData = async () => {
    try {
      const [itemRes, bookingsRes, statsRes, earningsRes] = await Promise.all([
        api.get(`/items/${itemId}`),
        api.get(`/bookings/item/${itemId}`),
        api.get(`/bookings/item/${itemId}/stats`),
        api.get(`/bookings/item/${itemId}/earnings`),
      ]);
      setItem(itemRes.data);
      setBookings(bookingsRes.data);

      // Use backend-calculated earnings
      setStats({ ...statsRes.data, totalEarnings: earningsRes.data.totalEarnings });
    } catch (error) {
      console.error('Error fetching data:', error);
      router.push('/admin/items');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'sold_out':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/admin/items" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
              Back to Items
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Item Details</h1>
            <div></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden h-fit">
              <div className="h-64 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                {item.image ? (
                  <img
                    src={item.image.includes('drive.google.com')
                      ? `https://drive.google.com/thumbnail?id=${item.image.split('/file/d/')[1]?.split('/')[0]}&sz=w1000`
                      : item.image
                    }
                    alt={item.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300.png?text=Image+Not+Available';
                    }}
                  />
                ) : (
                  <div className="text-8xl">💎</div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{item.name}</h2>
                <p className="text-sm text-gray-500 mb-4">{item.category}</p>

                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Item Code</span>
                    <span className="font-semibold text-gray-800 text-sm">{item.itemCode}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Barcode</span>
                    <span className="font-semibold text-gray-800 text-sm">{item.barcode}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Purchase Price</span>
                    <span className="font-semibold text-gray-800 text-sm">₹{item.purchasePrice?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Rent Price</span>
                    <span className="font-semibold text-gray-800 text-sm">₹{item.rentPrice?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Security</span>
                    <span className="font-semibold text-gray-800 text-sm">₹{item.securityDeposit?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {bookingStats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                  <div className="text-2xl font-bold text-gray-800">{bookingStats.totalBookings}</div>
                  <div className="text-xs text-gray-600 mt-1">Total Bookings</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                  <div className="text-2xl font-bold text-blue-600">{bookingStats.activeBookings}</div>
                  <div className="text-xs text-gray-600 mt-1">Active</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                  <div className="text-2xl font-bold text-green-600">{bookingStats.completedBookings}</div>
                  <div className="text-xs text-gray-600 mt-1">Completed</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                  <div className="text-2xl font-bold text-red-600">{bookingStats.overdueBookings}</div>
                  <div className="text-xs text-gray-600 mt-1">Overdue</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-3 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">₹{((itemEarnings || 0) + (item?.oldEarnings || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                  <div className="text-xs text-gray-600 mt-1">Item Earnings</div>
                </div>
                <div className={`bg-white rounded-lg shadow-sm p-3 border-2 ${profitAmount >= 0 ? 'border-green-200' : 'border-red-200'}`}>
                  <div className={`text-2xl font-bold ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{profitDisplay}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{profitLabel}</div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-800">Booking History</h3>
              </div>

              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {bookings.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings yet</h3>
                    <p className="text-gray-500">This item hasn't been rented yet</p>
                  </div>
                ) : (
                  bookings.map((booking) => {
                    // Find this specific item in the booking
                    const bookingItem = booking.items?.find((bi: any) => bi.itemId === itemId || bi.itemId?._id === itemId);

                    return (
                      <div key={booking._id} className="p-6 hover:bg-gray-50 border-b last:border-b-0">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(booking.status)}
                            <div>
                              <h4 className="font-semibold text-gray-800">{booking.customerName}</h4>
                              <p className="text-sm text-gray-600">{booking.phone}</p>
                              {bookingItem && (
                                <p className="text-xs text-blue-600 mt-1">
                                  {bookingItem.itemCode || 'Item Code'} - {bookingItem.itemName || 'Item'} ({bookingItem.priceType === 'half' ? 'Half' : 'Full'} Price)
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-xs text-gray-500 block">Start Date</span>
                            <p className="font-medium text-gray-800 text-sm">
                              {new Date(booking.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Return Date</span>
                            <p className="font-medium text-gray-800 text-sm">
                              {new Date(booking.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          {booking.actualReturnDate && (
                            <div>
                              <span className="text-xs text-gray-500 block">Actual Return</span>
                              <p className="font-medium text-gray-800 text-sm">
                                {new Date(booking.actualReturnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs text-gray-500 block">Booking Date</span>
                            <p className="font-medium text-gray-800 text-sm">
                              {new Date(booking.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {bookingItem && (
                          <div className="grid grid-cols-3 gap-3 text-sm mb-3 p-3 bg-blue-50 rounded-lg">
                            <div>
                              <span className="text-xs text-gray-600 block">Rent Charged</span>
                              <p className="font-semibold text-gray-800">₹{bookingItem.rentPrice?.toLocaleString() || 0}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-600 block">Security</span>
                              <p className="font-semibold text-gray-800">₹{bookingItem.security?.toLocaleString() || 0}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-600 block">Price Type</span>
                              <p className="font-semibold text-gray-800">{bookingItem.priceType === 'half' ? 'Half' : 'Full'}</p>
                            </div>
                          </div>
                        )}

                        {/* Booking-level pricing with discounts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="space-y-1">
                            <span className="text-xs text-gray-600 block">Total Rent (Booking)</span>
                            <p className="font-semibold text-gray-800">₹{booking.items.reduce((sum: number, item: any) => sum + (item.rentPrice || 0), 0).toLocaleString()}</p>
                            {booking.rentDiscount > 0 && (
                              <>
                                <p className="text-xs text-red-600">-₹{booking.rentDiscount?.toLocaleString()} discount</p>
                                <p className="font-semibold text-green-700">Net: ₹{(booking.items.reduce((sum: number, item: any) => sum + (item.rentPrice || 0), 0) - booking.rentDiscount).toLocaleString()}</p>
                              </>
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-gray-600 block">Total Security (Booking)</span>
                            <p className="font-semibold text-gray-800">₹{booking.items.reduce((sum: number, item: any) => sum + (item.security || 0), 0).toLocaleString()}</p>
                            {booking.securityDiscount > 0 && (
                              <>
                                <p className="text-xs text-red-600">-₹{booking.securityDiscount?.toLocaleString()} discount</p>
                                <p className="font-semibold text-green-700">Net: ₹{(booking.items.reduce((sum: number, item: any) => sum + (item.security || 0), 0) - booking.securityDiscount).toLocaleString()}</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Item-specific discount allocation */}
                        {bookingItem && (booking.rentDiscount > 0 || booking.securityDiscount > 0) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="space-y-1">
                              <span className="text-xs text-gray-600 block">This Item's Rent Discount Share</span>
                              <p className="font-semibold text-orange-600">-₹{((booking.rentDiscount || 0) / (booking.items?.length || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                              <p className="text-xs text-gray-500">({booking.rentDiscount || 0} ÷ {booking.items?.length || 1} items)</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-gray-600 block">This Item's Net Earnings</span>
                              <p className="font-semibold text-green-700">₹{((bookingItem.rentPrice || 0) - ((booking.rentDiscount || 0) / (booking.items?.length || 0))).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                              <p className="text-xs text-gray-500">({bookingItem.rentPrice || 0} - discount share)</p>
                            </div>
                          </div>
                        )}

                        {booking.status === 'overdue' && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-700 font-medium">
                              ⚠️ This rental is overdue!
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
