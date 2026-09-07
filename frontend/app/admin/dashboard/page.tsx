'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  LogOut,
  Package,
  Calendar,
  Users,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Info,
  Gem,
  LayoutDashboard,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="flex min-h-screen items-center justify-center bg-[#faf8fb]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-200">
            <Gem className="h-7 w-7 text-white" />
          </div>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-pink-200 border-t-pink-600" />
          <p className="text-sm font-medium text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show alert for today's unchecked-in bookings
  const showTodayBookingAlert = !loadingTodayBookings && todayBookings.length > 0;

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f6f9] text-gray-900">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =========================================================
          SIDEBAR
      ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-white/10 bg-[#21131d] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/admin/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg shadow-pink-950/30">
              <Gem className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-serif text-lg font-semibold tracking-wide">
                Belles Avenue
              </p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-pink-200/70">
                Admin Portal
              </p>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 px-4 py-7">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Workspace
          </p>

          <nav className="space-y-1">
            <Link
              href="/admin/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/10 px-3 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-pink-300/10"
            >
              <LayoutDashboard className="h-4.5 w-4.5 text-pink-300" />
              Dashboard
            </Link>

            <Link
              href="/admin/bookings"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Calendar className="h-4.5 w-4.5" />
                Bookings
              </span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            <Link
              href="/admin/items"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Package className="h-4.5 w-4.5" />
                Jewellery
              </span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            <Link
              href="/admin/invoices"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <FileText className="h-4.5 w-4.5" />
                Invoices
              </span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            <button
              onClick={() => {
                setShowAvailabilityModal(true);
                setSidebarOpen(false);
              }}
              className="group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <CheckCircle className="h-4.5 w-4.5" />
                Availability
              </span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-2xl bg-white/5 p-4">
            <p className="text-xs font-semibold text-white/80">Store status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs text-white/50">Management portal active</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN AREA
      ========================================================= */}
      <div className="min-h-screen lg:pl-[270px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm hover:border-pink-200 hover:text-pink-600 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink-500">
                  Management
                </p>
                <h1 className="font-serif text-xl font-semibold text-gray-900 sm:text-2xl">
                  Dashboard
                </h1>
              </div>
            </div>

          </div>

          {/* Mobile quick actions */}
          <div className="flex gap-2 overflow-x-auto border-t border-gray-100 px-4 py-3 sm:hidden">
            <button
              onClick={() => setShowAvailabilityModal(true)}
              className="shrink-0 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
            >
              Availability
            </button>
            <Link
              href="/admin/bookings"
              className="shrink-0 rounded-lg bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700"
            >
              Bookings
            </Link>
            <Link
              href="/admin/items"
              className="shrink-0 rounded-lg bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-700"
            >
              Jewellery
            </Link>
            <Link
              href="/admin/invoices"
              className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
            >
              Invoices
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Welcome */}
          <section className="mb-7 flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-br from-[#2a1724] via-[#3a1c31] to-[#241329] p-6 text-white shadow-xl shadow-pink-100/40 sm:p-8 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-pink-100">
                <Sparkles className="h-3.5 w-3.5" />
                Belles Avenue Management
              </div>
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
                Good afternoon, Admin
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                Here&apos;s what&apos;s happening with your jewellery rentals today.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-5 lg:block">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                Today
              </p>
              <p className="mt-1 text-lg font-semibold">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </section>

          {/* KPI cards */}
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total Bookings',
                value: stats.totalBookings,
                note: 'All rental bookings',
                icon: ShoppingBag,
                box: 'bg-blue-50',
                iconColor: 'text-blue-600',
              },
              {
                label: 'Active Rentals',
                value: stats.activeRentals,
                note: 'Currently rented',
                icon: Clock,
                box: 'bg-purple-50',
                iconColor: 'text-purple-600',
              },
              {
                label: 'Due Today',
                value: stats.dueToday,
                note: 'Returns expected today',
                icon: Calendar,
                box: 'bg-amber-50',
                iconColor: 'text-amber-600',
              },
              {
                label: 'Overdue',
                value: stats.overdue,
                note: stats.overdue > 0 ? 'Needs attention' : 'Everything on track',
                icon: AlertTriangle,
                box: stats.overdue > 0 ? 'bg-red-50' : 'bg-emerald-50',
                iconColor: stats.overdue > 0 ? 'text-red-600' : 'text-emerald-600',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl p-3 ${card.box}`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <TrendingUp className="h-4 w-4 text-gray-200 transition-colors group-hover:text-pink-300" />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {card.label}
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{card.note}</p>
                </div>
              );
            })}
          </section>

          {/* Attention panels */}
          <div className="space-y-5">
            {stats.overdue > 0 && (
              <section className="rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-red-100 p-2.5">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900">
                        Overdue Returns ({stats.overdueBookings.filter((b) =>
                          b.customerName.toLowerCase().includes(searchOverdue.toLowerCase()) ||
                          b.phone.includes(searchOverdue)
                        ).length})
                      </h3>
                      <p className="text-xs text-red-700/70">These bookings need attention.</p>
                    </div>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name or phone..."
                      value={searchOverdue}
                      onChange={(e) => setSearchOverdue(e.target.value)}
                      className="w-full rounded-xl border border-red-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {stats.overdueBookings.filter((b) =>
                    b.customerName.toLowerCase().includes(searchOverdue.toLowerCase()) ||
                    b.phone.includes(searchOverdue)
                  ).map((booking) => (
                    <div
                      key={booking._id}
                      className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{booking.customerName}</p>
                        <p className="text-xs text-gray-500">{booking.phone}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          Due:{' '}
                          {new Date(booking.returnDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        Overdue
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {showTodayBookingAlert && (
              <section className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-orange-100 p-2.5">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-900">
                        Today&apos;s Bookings — Not Arrived ({todayBookings.filter((b) =>
                          b.customerName.toLowerCase().includes(searchTodayBookings.toLowerCase()) ||
                          b.phone.includes(searchTodayBookings)
                        ).length})
                      </h3>
                      <p className="text-xs text-orange-700/70">Customers scheduled for today.</p>
                    </div>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name or phone..."
                      value={searchTodayBookings}
                      onChange={(e) => setSearchTodayBookings(e.target.value)}
                      className="w-full rounded-xl border border-orange-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {todayBookings.filter((b) =>
                    b.customerName.toLowerCase().includes(searchTodayBookings.toLowerCase()) ||
                    b.phone.includes(searchTodayBookings)
                  ).map((booking) => (
                    <div
                      key={booking._id}
                      className="rounded-xl border border-orange-100 bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{booking.customerName}</p>
                          <p className="text-xs text-gray-500">{booking.phone}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            Start:{' '}
                            {new Date(booking.startDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {booking.items.map((i: any) => (
                              <span
                                key={i.itemCode}
                                className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600"
                              >
                                {i.itemName} ({i.itemCode})
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                    i.priceType === 'half'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {i.priceType === 'half' ? 'Half' : 'Full'}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="w-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                          Not Arrived
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {stats.dueToday > 0 && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-100 p-2.5">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900">
                        Due Today ({stats.dueTodayBookings.filter((b) =>
                          b.customerName.toLowerCase().includes(searchDueToday.toLowerCase()) ||
                          b.phone.includes(searchDueToday)
                        ).length})
                      </h3>
                      <p className="text-xs text-amber-700/70">Returns expected today.</p>
                    </div>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name or phone..."
                      value={searchDueToday}
                      onChange={(e) => setSearchDueToday(e.target.value)}
                      className="w-full rounded-xl border border-amber-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {stats.dueTodayBookings.filter((b) =>
                    b.customerName.toLowerCase().includes(searchDueToday.toLowerCase()) ||
                    b.phone.includes(searchDueToday)
                  ).map((booking) => {
                    const totalSecurity =
                      booking.items?.reduce(
                        (sum: number, item: any) => sum + (item.security || 0),
                        0
                      ) || 0;
                    const securityDiscount = booking.securityDiscount || 0;
                    const returnableAmount = totalSecurity - securityDiscount;

                    return (
                      <div
                        key={booking._id}
                        className="flex flex-col gap-4 rounded-xl border border-amber-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{booking.customerName}</p>
                          <p className="text-xs text-gray-500">{booking.phone}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            Due:{' '}
                            {new Date(booking.returnDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                          <div className="rounded-xl bg-emerald-50 px-4 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                              Returnable
                            </p>
                            <p className="text-sm font-bold text-emerald-700">
                              ₹{returnableAmount.toLocaleString()}
                            </p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Due Today
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* =====================================================
              BOOKING OVERVIEW + QUICK ACTIONS
          ===================================================== */}
          <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6 xl:col-span-8">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-500">
                    Performance
                  </p>
                  <h3 className="mt-1 font-serif text-2xl text-gray-900">
                    Booking Overview
                  </h3>
                </div>
                <div className="rounded-xl bg-purple-50 p-2.5">
                  <ShoppingBag className="h-5 w-5 text-purple-600" />
                </div>
              </div>

              <div className="h-[280px] w-full sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Total', value: stats.totalBookings },
                      { name: 'Active', value: stats.activeRentals },
                      { name: 'Due Today', value: stats.dueToday },
                      { name: 'Overdue', value: stats.overdue },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee8ee" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,.97)',
                        borderRadius: '14px',
                        border: '1px solid #f1e5ed',
                        boxShadow: '0 12px 30px rgba(60,20,50,.12)',
                      }}
                    />
                    <Bar dataKey="value" fill="url(#dashboardBarGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="dashboardBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6 xl:col-span-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-500">
                Shortcuts
              </p>
              <h3 className="mt-1 font-serif text-2xl text-gray-900">
                Quick Actions
              </h3>

              <div className="mt-5 space-y-3">
                <button
                  onClick={() => setShowAvailabilityModal(true)}
                  className="group flex w-full items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded-xl bg-emerald-100 p-2.5">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">Check Availability</span>
                      <span className="block text-xs text-gray-500">Check jewellery dates</span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1" />
                </button>

                <Link
                  href="/admin/items"
                  className="group flex items-center justify-between rounded-2xl border border-pink-100 bg-pink-50/70 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded-xl bg-pink-100 p-2.5">
                      <Package className="h-5 w-5 text-pink-600" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">Manage Jewellery</span>
                      <span className="block text-xs text-gray-500">Add and manage items</span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/admin/bookings"
                  className="group flex items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/70 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded-xl bg-purple-100 p-2.5">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">View Bookings</span>
                      <span className="block text-xs text-gray-500">Manage rental orders</span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/admin/invoices"
                  className="group flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded-xl bg-blue-100 p-2.5">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">Manage Invoices</span>
                      <span className="block text-xs text-gray-500">View billing documents</span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>

          {/* =====================================================
              MONTHLY EARNINGS
          ===================================================== */}
          <section className="mt-8 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-500">
                  Revenue
                </p>
                <h3 className="mt-1 font-serif text-2xl text-gray-900">
                  Monthly Earnings
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  Financial summary for the selected month.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <select
                  value={selectedMonth.getFullYear().toString()}
                  onChange={(e) =>
                    setSelectedMonth(
                      new Date(parseInt(e.target.value), selectedMonth.getMonth(), 1)
                    )
                  }
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-50"
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

                <select
                  value={selectedMonth.getMonth().toString()}
                  onChange={(e) =>
                    setSelectedMonth(
                      new Date(
                        selectedMonth.getFullYear(),
                        parseInt(e.target.value),
                        1
                      )
                    )
                  }
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-50"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i.toString()}>
                      {new Date(0, i).toLocaleString('default', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-r from-pink-50 via-white to-purple-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Selected period
              </p>
              <p className="mt-1 font-serif text-2xl text-gray-900">
                {selectedMonth.toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {loadingMonthlyEarnings ? (
              <div className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            ) : monthlyEarnings ? (
              <>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Rent</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-800">
                      ₹{monthlyEarnings.totalRent.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Total Security</p>
                    <p className="mt-2 text-2xl font-bold text-blue-800">
                      ₹{monthlyEarnings.totalSecurity.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Rent Discount</p>
                    <p className="mt-2 text-2xl font-bold text-orange-800">
                      -₹{monthlyEarnings.totalRentDiscount.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Net Earnings</p>
                    <p className="mt-2 text-2xl font-bold text-purple-800">
                      ₹{monthlyEarnings.netEarnings.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 lg:col-span-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Bookings</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">
                      {monthlyEarnings.totalBookings}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Completed {monthlyEarnings.completedBookings}
                      </span>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        Pending {monthlyEarnings.pendingBookings}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-pink-100 bg-pink-50/60 p-5 lg:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-pink-500">
                      Earnings Calculation
                    </p>
                    <p className="mt-3 text-sm text-gray-600">
                      Total Rent − Rent Discount = Net Earnings
                    </p>
                    <p className="mt-2 break-words text-lg font-semibold text-gray-900">
                      ₹{monthlyEarnings.totalRent.toLocaleString()} − ₹
                      {monthlyEarnings.totalRentDiscount.toLocaleString()} = ₹
                      {monthlyEarnings.netEarnings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-sm text-gray-400">
                No earnings data for this month.
              </div>
            )}
          </section>

          {/* =====================================================
              MOST BOOKED
          ===================================================== */}
          <section className="mt-8 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-500">
                  Popularity
                </p>
                <h3 className="mt-1 font-serif text-2xl text-gray-900">
                  Most Booked Jewellery
                </h3>
              </div>
              <div className="hidden rounded-xl bg-amber-50 p-2.5 sm:block">
                <Gem className="h-5 w-5 text-amber-500" />
              </div>
            </div>

            {loadingMostBookedItems ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            ) : mostBookedItems.length > 0 ? (
              <div className="space-y-2.5">
                {mostBookedItems.map((item, index) => (
                  <Link
                    key={item.itemCode}
                    href={`/admin/items/${item._id}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 transition-all hover:-translate-y-0.5 hover:border-pink-100 hover:bg-pink-50/40 hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          index === 0
                            ? 'bg-amber-100 text-amber-700'
                            : index === 1
                            ? 'bg-slate-100 text-slate-600'
                            : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {item.itemName}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          Code: {item.itemCode}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xl font-bold text-purple-600">
                        {item.bookingCount}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        bookings
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-gray-50 py-10 text-center text-sm text-gray-400">
                No booking data for this month.
              </div>
            )}
          </section>

          {/* All clear */}
          {stats.overdue === 0 && stats.dueToday === 0 && (
            <section className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-emerald-100 bg-emerald-50/70 px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="mt-4 font-serif text-2xl text-emerald-900">All Clear</h3>
              <p className="mt-1 text-sm text-emerald-700">
                No overdue or due returns today.
              </p>
            </section>
          )}
        </main>
      </div>

      {/* Availability Check Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-100 bg-white shadow-2xl max-h-[90vh]">
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
                              <div className="text-sm text-gray-500">{item.name}</div>
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
                              <p className="text-sm text-gray-500">Code: {result.item.itemCode}</p>
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