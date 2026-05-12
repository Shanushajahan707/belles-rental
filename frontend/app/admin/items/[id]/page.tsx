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
  name: string;
  category: string;
  image: string;
  rentPrice: number;
  securityDeposit: number;
  status: 'available' | 'booked' | 'running';
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
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{item.name}</h2>
                <p className="text-lg text-gray-600 mb-4">{item.category}</p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Item Code</span>
                    <span className="font-semibold text-gray-800">{item.itemCode}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Rent Price</span>
                    <span className="font-semibold text-gray-800">₹{item.rentPrice}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="font-semibold text-gray-800">₹{item.securityDeposit}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="text-3xl font-bold text-gray-800">{stats.totalBookings}</div>
                  <div className="text-sm text-gray-600">Total Bookings</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="text-3xl font-bold text-blue-600">{stats.activeBookings}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="text-3xl font-bold text-green-600">{stats.completedBookings}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="text-3xl font-bold text-red-600">{stats.overdueBookings}</div>
                  <div className="text-sm text-gray-600">Overdue</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="text-3xl font-bold text-purple-600">₹{stats.totalEarnings.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Earnings</div>
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
                  bookings.map((booking) => (
                    <div key={booking._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(booking.status)}
                          <div>
                            <h4 className="font-semibold text-gray-800">{booking.customerName}</h4>
                            <p className="text-sm text-gray-600">{booking.phone}</p>
                            {booking.items && booking.items.length > 1 && (
                              <p className="text-xs text-blue-600 mt-1">
                                Items: {booking.items.map(item => `${item.itemCode} (${item.itemName})`).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Start Date:</span>
                          <p className="font-medium text-gray-800">
                            {new Date(booking.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Return Date:</span>
                          <p className="font-medium text-gray-800">
                            {new Date(booking.returnDate).toLocaleDateString()}
                          </p>
                        </div>
                        {booking.actualReturnDate && (
                          <div>
                            <span className="text-gray-500">Actual Return:</span>
                            <p className="font-medium text-gray-800">
                              {new Date(booking.actualReturnDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Total Amount:</span>
                          <p className="font-medium text-gray-800">₹{booking.totalAmount}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Discount:</span>
                          <p className="font-medium text-gray-800">₹{booking.discount}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Booked On:</span>
                          <p className="font-medium text-gray-800">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {booking.status === 'overdue' && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700 font-medium">
                            ⚠️ This rental is overdue!
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
