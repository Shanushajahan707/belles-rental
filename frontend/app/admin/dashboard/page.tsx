'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { DollarSign, ShoppingBag, Clock, AlertTriangle, LogOut, Package, Calendar, Users, FileText, Search, CheckCircle, XCircle, Info } from 'lucide-react';
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
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  bookings: any[];
}

interface MostBookedItem {
  _id: string;
  itemName: string;
  itemCode: string;
  bookingCount: number;
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

  const [mostBookedItems, setMostBookedItems] = useState<MostBookedItem[]>([]);
  const [loadingMostBookedItems, setLoadingMostBookedItems] = useState(false);

  // Availability checker state
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityCheck, setAvailabilityCheck] = useState({
    selectedItems: [] as string[],
    startDate: '',
    endDate: ''
  });
  const [availabilityResult, setAvailabilityResult] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchStats();
    fetchTodayBookings();
    fetchMonthlyEarnings();
    fetchItems();
  }, []);

  useEffect(() => {
    fetchMonthlyEarnings();
    fetchMostBookedItems();
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

  const fetchMostBookedItems = async () => {
    try {
      setLoadingMostBookedItems(true);
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const response = await api.get(`/bookings/most-booked-items?year=${year}&month=${month}`);
      setMostBookedItems(response.data);
    } catch (error) {
      console.error('Error fetching most booked items:', error);
      toast.addToast({
        message: 'Failed to load most booked items',
        type: 'error',
      });
    } finally {
      setLoadingMostBookedItems(false);
    }
  };

  const fetchItems = async () => {
    try {
      setLoadingItems(true);
      const response = await api.get('/items?limit=10000');
      setAllItems(response.data.items || response.data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.addToast({
        message: 'Failed to load items',
        type: 'error',
      });
    } finally {
      setLoadingItems(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  const handleCheckAvailability = async () => {
    if (availabilityCheck.selectedItems.length === 0 || !availabilityCheck.startDate || !availabilityCheck.endDate) {
      toast.addToast({
        message: 'Please select at least one item and fill in all date fields',
        type: 'error',
      });
      return;
    }

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(availabilityCheck.startDate);
    const endDate = new Date(availabilityCheck.endDate);

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.addToast({
        message: 'Invalid date format. Please use valid dates.',
        type: 'error',
      });
      return;
    }

    // Check if start date is before end date
    if (startDate > endDate) {
      toast.addToast({
        message: 'Start date cannot be after return date.',
        type: 'error',
      });
      return;
    }

    // Check if start date is in the past
    if (startDate < today) {
      toast.addToast({
        message: 'Start date cannot be in the past.',
        type: 'error',
      });
      return;
    }

    try {
      setCheckingAvailability(true);
      setAvailabilityResult(null);
      
      // Check availability for each selected item
      const results = await Promise.all(
        availabilityCheck.selectedItems.map(async (itemCode) => {
          const response = await api.get('/bookings/check-availability', {
            params: {
              itemCode,
              startDate: availabilityCheck.startDate,
              endDate: availabilityCheck.endDate
            }
          });
          return response.data;
        })
      );
      
      setAvailabilityResult(results);
    } catch (error: any) {
      console.error('Error checking availability:', error);
      toast.addToast({
        message: error.response?.data?.error || 'Failed to check availability',
        type: 'error',
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleAddItem = (itemCode: string) => {
    if (!availabilityCheck.selectedItems.includes(itemCode)) {
      setAvailabilityCheck({
        ...availabilityCheck,
        selectedItems: [...availabilityCheck.selectedItems, itemCode]
      });
    }
    setItemSearchQuery('');
    setShowItemDropdown(false);
  };

  const handleRemoveItem = (itemCode: string) => {
    setAvailabilityCheck({
      ...availabilityCheck,
      selectedItems: availabilityCheck.selectedItems.filter(code => code !== itemCode)
    });
  };

  const filteredItems = allItems.filter(item =>
    item.itemCode.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

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
              <button
                onClick={() => setShowAvailabilityModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 transform hover:scale-105 text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Check Availability</span>
              </button>
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

      {stats.overdue > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 mb-6 shadow-lg shadow-red-200/50">
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
        </div>
      )}

      {showTodayBookingAlert && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 mb-6 shadow-lg shadow-orange-200/50">
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

      {stats.dueToday > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6 mb-6 shadow-lg shadow-yellow-200/50">
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
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white text-black"
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
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white text-black"
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
                    <p className="text-3xl font-bold text-purple-800">{monthlyEarnings.totalBookings}</p>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <p className="text-xs text-green-600">Completed: {monthlyEarnings.completedBookings}</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-600">Pending: {monthlyEarnings.pendingBookings}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Earnings Calculation:</p>
                    <p className="text-sm text-gray-700">Total Rent - Rent Discount = Net Earnings</p>
                    <p className="text-sm text-gray-700">₹{monthlyEarnings.totalRent.toLocaleString()} - ₹{monthlyEarnings.totalRentDiscount.toLocaleString()} = ₹{monthlyEarnings.netEarnings.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No earnings data for this month</p>
            </div>
          )}
        </div>

        {/* Most Booked Items Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/50 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Most Booked Items of the Month</h3>
          {loadingMostBookedItems ? (
            <div className="text-center py-8">
              <div className="text-xl">Loading most booked items...</div>
            </div>
          ) : mostBookedItems.length > 0 ? (
            <div className="space-y-3">
              {mostBookedItems.map((item, index) => (
                <Link
                  key={item.itemCode}
                  href={`/admin/items/${item._id}`}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 hover:from-yellow-100 hover:to-amber-100'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 hover:from-gray-100 hover:to-slate-100'
                      : index === 2
                      ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 hover:from-orange-100 hover:to-amber-100'
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0
                          ? 'bg-yellow-400 text-white'
                          : index === 1
                          ? 'bg-gray-400 text-white'
                          : index === 2
                          ? 'bg-orange-400 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{item.itemName}</p>
                      <p className="text-sm text-gray-500">Code: {item.itemCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{item.bookingCount}</p>
                    <p className="text-xs text-gray-500">bookings</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No booking data for this month</p>
            </div>
          )}
        </div>

        {stats.overdue === 0 && stats.dueToday === 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center shadow-lg shadow-green-200/50">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">All Clear!</h3>
            <p className="text-green-700">No overdue or due returns today</p>
          </div>
        )}
      </div>

      {/* Availability Check Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Check Item Availability</h2>
                <button
                  onClick={() => {
                    setShowAvailabilityModal(false);
                    setAvailabilityResult(null);
                    setAvailabilityCheck({ selectedItems: [], startDate: '', endDate: '' });
                    setItemSearchQuery('');
                    setShowItemDropdown(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Items</label>
                  <div className="relative">
                    <div className="border border-gray-300 rounded-xl p-2 min-h-[48px] flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent">
                      {availabilityCheck.selectedItems.map(itemCode => {
                        const item = allItems.find(i => i.itemCode === itemCode);
                        return (
                          <span key={itemCode} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
                            {itemCode}
                            {item && <span className="text-emerald-600 text-xs">({item.name})</span>}
                            <button
                              onClick={() => handleRemoveItem(itemCode)}
                              className="ml-1 hover:bg-emerald-200 rounded-full p-0.5"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </span>
                        );
                      })}
                      <input
                        type="text"
                        value={itemSearchQuery}
                        onChange={(e) => {
                          setItemSearchQuery(e.target.value);
                          setShowItemDropdown(true);
                        }}
                        onFocus={() => setShowItemDropdown(true)}
                        placeholder="Search items..."
                        className="flex-1 min-w-[120px] outline-none text-black px-2 py-1"
                      />
                    </div>
                    
                    {showItemDropdown && itemSearchQuery && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredItems.length === 0 ? (
                          <div className="p-3 text-gray-500 text-sm">No items found</div>
                        ) : (
                          filteredItems.map(item => (
                            <div
                              key={item._id}
                              onClick={() => handleAddItem(item.itemCode)}
                              className="p-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-800">{item.itemCode}</div>
                              <div className="text-sm text-gray-600">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.category}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {availabilityCheck.selectedItems.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{availabilityCheck.selectedItems.length} item(s) selected</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={availabilityCheck.startDate}
                    onChange={(e) => setAvailabilityCheck({ ...availabilityCheck, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={availabilityCheck.endDate}
                    onChange={(e) => setAvailabilityCheck({ ...availabilityCheck, endDate: e.target.value })}
                    min={availabilityCheck.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-black"
                  />
                </div>

                <button
                  onClick={handleCheckAvailability}
                  disabled={checkingAvailability}
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {checkingAvailability ? 'Checking...' : 'Check Availability'}
                </button>
              </div>

              {availabilityResult && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold text-gray-800">Availability Results ({availabilityResult.length} items)</h3>
                  {availabilityResult.map((result: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                      {result.available ? (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            <div>
                              <h3 className="font-bold text-green-800">{result.item?.itemCode || 'Item'} - Available!</h3>
                              <p className="text-green-700 text-sm">{result.item?.name || ''}</p>
                            </div>
                          </div>
                          <p className="text-green-700 text-sm">{result.message}</p>
                          
                          {result.item && result.item.supportsHalfPricing && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Half Pricing Supported</span>
                            </div>
                          )}

                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div className={`p-2 rounded-lg ${result.availabilityDetails.fullAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              <p className="font-medium">Full Booking</p>
                              <p className="text-xs">{result.availabilityDetails.fullAvailable ? 'Available' : 'Not Available'}</p>
                            </div>
                            <div className={`p-2 rounded-lg ${result.availabilityDetails.halfAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              <p className="font-medium">Half Booking</p>
                              <p className="text-xs">{result.availabilityDetails.halfAvailable ? 'Available' : 'Not Available'}</p>
                            </div>
                          </div>

                          {result.availabilityDetails.halfAvailable && !result.availabilityDetails.fullAvailable && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-700">
                                  <span className="font-medium">Partial Availability:</span> Only one part of this item is available for booking. The other part is already booked for these dates.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <XCircle className="w-6 h-6 text-red-600" />
                            <div>
                              <h3 className="font-bold text-red-800">{result.item?.itemCode || 'Item'} - Not Available</h3>
                              <p className="text-red-700 text-sm">{result.item?.name || ''}</p>
                            </div>
                          </div>
                          <p className="text-red-700 text-sm">{result.message}</p>

                          {result.item && (
                            <div className="mt-3 p-3 bg-white rounded-lg">
                              <p className="font-medium text-gray-800">{result.item.name}</p>
                              <p className="text-sm text-gray-600">Code: {result.item.itemCode}</p>
                              <p className="text-sm text-gray-500 mt-1">Status: {result.item.status}</p>
                            </div>
                          )}

                          {result.availabilityDetails.conflictingBookings.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Conflicting Bookings:</p>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {result.availabilityDetails.conflictingBookings.map((booking: any, bookingIndex: number) => (
                                  <div key={bookingIndex} className="p-2 bg-white rounded-lg text-xs">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-gray-800">{booking.customerName}</p>
                                        <p className="text-gray-600">{booking.bookingNumber}</p>
                                      </div>
                                      <span className={`px-2 py-1 rounded-full ${booking.priceType === 'half' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {booking.priceType}
                                      </span>
                                    </div>
                                    <p className="text-gray-500 mt-1">
                                      {booking.startDate} to {booking.endDate}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}