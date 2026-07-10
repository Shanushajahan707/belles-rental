'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { DollarSign, ShoppingBag, Clock, AlertTriangle, LogOut, Package, Calendar, Users, FileText, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/components/Toast';
import { checkBackendHealthWithRedirect } from '@/lib/backendHealth';


interface DashboardStats {
  totalEarnings: number;
  totalBookings: number;
  activeRentals: number;
  dueToday: number;
  overdue: number;
  dueTodayBookings: any[];
  overdueBookings: any[];
}

interface MonthlyEarnings {
  totalRent: number;
  totalSecurity: number;
  totalRentDiscount: number;
  totalSecurityDiscount: number;
  netEarnings: number;
  bookingCount: number;
  bookings: any[];
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
  const [searchTodayBookings, setSearchTodayBookings] = useState('');
  const [searchOverdue, setSearchOverdue] = useState('');
  const [searchDueToday, setSearchDueToday] = useState('');

  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarnings | null>(null);
  const [loadingMonthlyEarnings, setLoadingMonthlyEarnings] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    checkAuth();
    fetchStats();
    fetchTodayBookings();
    fetchMonthlyEarnings();
  }, []);

  useEffect(() => {
    fetchMonthlyEarnings();
  }, [selectedMonth]);
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
      // Check backend health first and redirect if disconnected
      const isConnected = await checkBackendHealthWithRedirect(router);
      if (!isConnected) {
        return;
      }

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

  const fetchMonthlyEarnings = async () => {
    try {
      setLoadingMonthlyEarnings(true);
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const response = await api.get(`/bookings/monthly-earnings?year=${year}&month=${month}`);
      setMonthlyEarnings(response.data);
    } catch (error) {
      console.error('Error fetching monthly earnings:', error);
      toast.addToast({
        message: 'Failed to load monthly earnings',
        type: 'error',
      });
    } finally {
      setLoadingMonthlyEarnings(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Belles Avenue</h1>
              <p className="text-sm text-gray-600">Admin Dashboard</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Link href="/admin/invoices" className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 text-sm font-medium">
                <FileText className="w-4 h-4 inline" />
                <span className="hidden sm:inline ml-1">Manage Invoices</span>
              </Link>
              <Link
                href="/admin/items"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300 transform hover:scale-105 text-sm font-medium"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Manage Items</span>
              </Link>
              <Link
                href="/admin/bookings"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 text-sm font-medium"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Bookings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:shadow-lg hover:shadow-gray-400/30 transition-all duration-300 transform hover:scale-105 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showTodayBookingAlert && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 mb-8 shadow-lg shadow-orange-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-orange-800">
                  Today's Bookings: Customer Not Arrived ({todayBookings.filter(b =>
                    b.customerName.toLowerCase().includes(searchTodayBookings.toLowerCase()) ||
                    b.phone.includes(searchTodayBookings)
                  ).length})
                </h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchTodayBookings}
                  onChange={(e) => setSearchTodayBookings(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm w-full sm:w-64"
                />
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {todayBookings.filter(b =>
                b.customerName.toLowerCase().includes(searchTodayBookings.toLowerCase()) ||
                b.phone.includes(searchTodayBookings)
              ).map((booking) => (
                <div key={booking._id} className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
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
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${i.priceType === 'half' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                              {i.priceType === 'half' ? 'Half' : 'Full'}
                            </span>
                          </span>
                        ))}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 rounded-full text-sm font-semibold shadow-sm">
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
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">Dashboard Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Total Bookings</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.totalBookings}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Active Rentals</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.activeRentals}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-xl">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Due Today</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.dueToday}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/50 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Total', value: stats.totalBookings },
              { name: 'Active', value: stats.activeRentals },
              { name: 'Due Today', value: stats.dueToday },
              { name: 'Overdue', value: stats.overdue }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#1f2937'
                }}
                cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                itemStyle={{ color: '#6b7280', fontSize: '13px' }}
                labelStyle={{ color: '#1f2937', fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}
                formatter={(value: any) => [
                  <span className="font-semibold text-purple-600">{value}</span>,
                  <span className="text-gray-600">Bookings</span>
                ]}
              />
              <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Earnings Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/50 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-gray-800">Monthly Earnings</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Year:</label>
                <select
                  value={selectedMonth.getFullYear().toString()}
                  onChange={(e) => setSelectedMonth(new Date(parseInt(e.target.value), selectedMonth.getMonth(), 1))}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Month:</label>
                <select
                  value={selectedMonth.getMonth().toString()}
                  onChange={(e) => setSelectedMonth(new Date(selectedMonth.getFullYear(), parseInt(e.target.value), 1))}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i.toString()}>
                      {new Date(0, i).toLocaleString('default', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-sm text-black font-medium">
                ({selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })})
              </span>
            </div>
          </div>

          {loadingMonthlyEarnings ? (
            <div className="text-center py-8">
              <div className="text-xl">Loading earnings data...</div>
            </div>
          ) : monthlyEarnings ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <p className="text-sm text-green-600 font-medium mb-1">Total Rent</p>
                  <p className="text-2xl font-bold text-green-800">₹{monthlyEarnings.totalRent.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Security</p>
                  <p className="text-2xl font-bold text-blue-800">₹{monthlyEarnings.totalSecurity.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-sm text-orange-600 font-medium mb-1">Rent Discount</p>
                  <p className="text-2xl font-bold text-orange-800">-₹{monthlyEarnings.totalRentDiscount.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
                  <p className="text-sm text-purple-600 font-medium mb-1">Net Earnings</p>
                  <p className="text-2xl font-bold text-purple-800">₹{monthlyEarnings.netEarnings.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total Bookings</p>
                    <p className="text-3xl font-bold text-purple-800">{monthlyEarnings.bookingCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Earnings Calculation:</p>
                    <p className="text-sm text-gray-700">Total Rent - Rent Discount = Net Earnings</p>
                    <p className="text-sm text-gray-700">₹{monthlyEarnings.totalRent.toLocaleString()} - ₹{monthlyEarnings.totalRentDiscount.toLocaleString()} = ₹{monthlyEarnings.netEarnings.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {monthlyEarnings.bookingCount > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3">Bookings this month</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {monthlyEarnings.bookings.map((booking) => (
                      <div key={booking._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">{booking.bookingNumber}</p>
                            <p className="text-sm text-gray-600">{booking.customerName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(booking.startDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">
                              Rent: ₹{booking.items.reduce((sum: number, item: any) => sum + item.rentPrice, 0).toLocaleString()}
                            </p>
                            {booking.rentDiscount > 0 && (
                              <p className="text-xs text-orange-600">
                                Discount: -₹{booking.rentDiscount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No earnings data for this month</p>
            </div>
          )}
        </div>

        {stats.overdue > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 mb-8 shadow-lg shadow-red-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-800">Overdue Returns ({stats.overdueBookings.filter(b =>
                  b.customerName.toLowerCase().includes(searchOverdue.toLowerCase()) ||
                  b.phone.includes(searchOverdue)
                ).length})</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchOverdue}
                  onChange={(e) => setSearchOverdue(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm w-full sm:w-64"
                />
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.overdueBookings.filter(b =>
                b.customerName.toLowerCase().includes(searchOverdue.toLowerCase()) ||
                b.phone.includes(searchOverdue)
              ).map((booking) => (
                <div key={booking._id} className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
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
                      <span className="px-3 py-1 bg-gradient-to-r from-red-100 to-rose-100 text-red-800 rounded-full text-sm font-semibold shadow-sm">
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
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6 mb-8 shadow-lg shadow-yellow-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-yellow-800">Due Today ({stats.dueTodayBookings.filter(b =>
                  b.customerName.toLowerCase().includes(searchDueToday.toLowerCase()) ||
                  b.phone.includes(searchDueToday)
                ).length})</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchDueToday}
                  onChange={(e) => setSearchDueToday(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-yellow-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm w-full sm:w-64"
                />
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.dueTodayBookings.filter(b =>
                b.customerName.toLowerCase().includes(searchDueToday.toLowerCase()) ||
                b.phone.includes(searchDueToday)
              ).map((booking) => (
                <div key={booking._id} className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
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
                      <span className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full text-sm font-semibold shadow-sm">
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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center shadow-lg shadow-green-200/50">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">All Clear!</h3>
            <p className="text-green-700">No overdue or due returns today</p>
          </div>
        )}
      </div>
    </div>
  );
}
