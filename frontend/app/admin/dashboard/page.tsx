'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { DollarSign, ShoppingBag, Clock, AlertTriangle, LogOut, Package, Calendar, Users, FileText } from 'lucide-react';
import { useToast } from '@/components/Toast';


interface DashboardStats {
  totalEarnings: number;
  totalBookings: number;
  activeRentals: number;
  dueToday: number;
  overdue: number;
  dueTodayBookings: any[];
  overdueBookings: any[];
}

interface TodayBooking {
  _id: string;
  customerName: string;
  phone: string;
  startDate: string;
  items: { itemName: string; itemCode: string; priceType?: 'full' | 'half' }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [loadingTodayBookings, setLoadingTodayBookings] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchStats();
    fetchTodayBookings();
  }, []);
  const fetchTodayBookings = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/today-bookings/today-unchecked-in?t=${timestamp}`);
      console.log('today bookings response.data', response.data);
      setTodayBookings(response.data.bookings || []);
    } catch (error) {
      setTodayBookings([]);
    } finally {
      setLoadingTodayBookings(false);
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.addToast({
        message: 'Please login to access the dashboard',
        type: 'error',
      });
      router.push('/admin/login');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/bookings/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.addToast({
        message: 'Failed to load dashboard data',
        type: 'error',
      });
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Show alert for today's unchecked-in bookings
  const showTodayBookingAlert = !loadingTodayBookings && todayBookings.length > 0;

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Belles Avenue</h1>
              <p className="text-sm text-gray-600">Admin Dashboard</p>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/admin/invoices" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <FileText className="w-4 h-4" />
                Manage Invoices
              </Link>
              <Link
                href="/admin/items"
                className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Package className="w-4 h-4" />
                Manage Items
              </Link>
              <Link
                href="/admin/bookings"
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Bookings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showTodayBookingAlert && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-orange-800">
                Today's Bookings: Customer Not Arrived ({todayBookings.length})
              </h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {todayBookings.map((booking) => (
                <div key={booking._id} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{booking.customerName}</p>
                      <p className="text-sm text-gray-600">{booking.phone}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Start: {new Date(booking.startDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Items: {booking.items.map((i: any) => (
                          <span key={i.itemCode} className="inline-flex items-center gap-1 mr-3">
                            {i.itemName} ({i.itemCode})
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${i.priceType === 'half' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                              {i.priceType === 'half' ? 'Half' : 'Full'}
                            </span>
                          </span>
                        ))}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                        Not Arrived
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total Bookings</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.totalBookings}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Active Rentals</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.activeRentals}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Due Today</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.dueToday}</p>
          </div>
        </div>

        {stats.overdue > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-red-800">Overdue Returns ({stats.overdue})</h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.overdueBookings.map((booking) => (
                <div key={booking._id} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{booking.customerName}</p>
                      <p className="text-sm text-gray-600">{booking.phone}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Due: {new Date(booking.returnDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                        Overdue
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.dueToday > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-yellow-600" />
              <h3 className="text-xl font-bold text-yellow-800">Due Today ({stats.dueToday})</h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.dueTodayBookings.map((booking) => (
                <div key={booking._id} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{booking.customerName}</p>
                      <p className="text-sm text-gray-600">{booking.phone}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Due: {new Date(booking.returnDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                        Due Today
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.overdue === 0 && stats.dueToday === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">All Clear!</h3>
            <p className="text-green-700">No overdue or due returns today</p>
          </div>
        )}
      </div>
    </div>
  );
}
