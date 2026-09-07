'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, ArrowLeft, Play, CheckCircle, Square, Trash2, Edit, X, Calendar, Search, Menu, LayoutDashboard, Gem, FileText, Clock, AlertTriangle, Users, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { checkBackendHealthWithRedirect } from '@/lib/backendHealth';
import Pagination from '@/components/Pagination';
import { useDebounce } from '@/hooks/useDebounce';

interface Booking {
  _id: string;
  bookingNumber: string;
  customerName: string;
  phone: string;
  address: string;
  items: {
    itemId: any;
    itemName: string;
    itemCode: string;
    rentPrice: number;
    security: number;
    priceType?: 'full' | 'half';
  }[];
  startDate: string;
  returnDate: string;
  actualReturnDate?: string;
  discount: number;
  rentDiscount?: number;
  securityDiscount?: number;
  advancePayment?: number;
  additionalCharges?: number;
  totalAmount: number;
  balanceAmount?: number;
  status: 'booked' | 'running' | 'completed' | 'overdue';
  createdBy: string;
  createdAt: string;
  note?: string;
  checkedIn?: boolean;
}

export default function BookingsManagement() {
  const router = useRouter();
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'booked' | 'running' | 'completed' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    checkAuth();
    fetchBookings();
  }, [currentPage, filterStatus, debouncedSearchQuery, dateRange]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    }
  };

  const fetchBookings = async () => {
    try {
      // Check backend health first and redirect if disconnected
      const isConnected = await checkBackendHealthWithRedirect(router);
      if (!isConnected) {
        return;
      }

      let url = '/bookings';
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (debouncedSearchQuery) {
        params.append('search', debouncedSearchQuery);
      }
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await api.get(`/bookings?${params.toString()}`);
      setBookings(response.data.bookings || response.data);
      setTotalItems(response.data.total || response.data.length);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.addToast({
        message: 'Failed to load bookings. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartRental = async (bookingId: string) => {
    if (!confirm('Are you sure you want to start this rental?')) return;

    try {
      await api.put(`/bookings/${bookingId}/start`);
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'running' } : b));
      toast.addToast({
        message: 'Rental started successfully!',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Error starting rental:', error);
      toast.addToast({
        message: error.response?.data?.error || 'Failed to start rental',
        type: 'error',
      });
    }
  };

  const handleCompleteRental = async (bookingId: string) => {
    const actualReturnDate = prompt('Enter actual return date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!actualReturnDate) return;

    try {
      await api.put(`/bookings/${bookingId}/complete`, { actualReturnDate });
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'completed', actualReturnDate } : b));
      toast.addToast({
        message: 'Rental completed successfully!',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Error completing rental:', error);
      toast.addToast({
        message: error.response?.data?.error || 'Failed to complete rental',
        type: 'error',
      });
    }
  };

  const handleStopRental = async (bookingId: string) => {
    if (!confirm('Are you sure you want to stop this rental? This will mark it as completed with today\'s date.')) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      await api.put(`/bookings/${bookingId}/complete`, { actualReturnDate: today });
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'completed', actualReturnDate: today } : b));
      toast.addToast({
        message: 'Rental stopped successfully!',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Error stopping rental:', error);
      toast.addToast({
        message: error.response?.data?.error || 'Failed to stop rental',
        type: 'error',
      });
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone and will make the items available again.')) return;

    try {
      await api.delete(`/bookings/${bookingId}`);
      setBookings(bookings.filter(b => b._id !== bookingId));
      toast.addToast({
        message: 'Booking deleted successfully!',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      toast.addToast({
        message: error.response?.data?.error || 'Failed to delete booking',
        type: 'error',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const filteredBookings = bookings;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleFilterChange = (filterType: 'status' | 'search', value: string) => {
    if (filterType === 'status') {
      setFilterStatus(value as typeof filterStatus);
    } else if (filterType === 'search') {
      setSearchQuery(value);
    }
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8fb] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-950 text-white shadow-xl">
            <Gem className="h-7 w-7" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
            Loading bookings...
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Bookings', href: '/admin/bookings', icon: Calendar, active: true },
    { label: 'Jewellery', href: '/admin/items', icon: Gem },
    { label: 'Invoices', href: '/admin/invoices', icon: FileText },
  ];

  const statusCounts = {
    all: totalItems,
    booked: bookings.filter(b => b.status === 'booked').length,
    running: bookings.filter(b => b.status === 'running').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    overdue: bookings.filter(b => b.status === 'overdue').length,
  };

  const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
    booked: { label: 'Booked', className: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
    running: { label: 'Running', className: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
    completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
    overdue: { label: 'Overdue', className: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' },
  };

  return (
    <div className="min-h-screen bg-[#faf8fb] text-gray-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col bg-[#151318] text-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-950">
            <Gem className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-lg tracking-wide">Belles Avenue</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Admin Studio</p>
          </div>
        </div>

        <div className="px-4 pt-8">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Workspace</p>
          <nav className="space-y-1">
            {navItems.map(({ label, href, icon: Icon, active }) => (
              <Link
                key={label}
                href={href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  active ? 'bg-white text-gray-950 shadow-lg' : 'text-white/60 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? 'text-gray-950' : 'text-white/45 group-hover:text-white'}`} />
                <span className="font-medium">{label}</span>
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            ))}
            <Link href="/admin/dashboard" className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 transition hover:bg-white/8 hover:text-white">
              <Clock className="h-[18px] w-[18px] text-white/45 group-hover:text-white" />
              <span className="font-medium">Availability</span>
            </Link>
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-medium text-white/50">Booking workspace</p>
            <p className="mt-1 text-sm text-white/80">Keep every rental organized and on schedule.</p>
          </div>
          <Link href="/admin/dashboard" className="mt-3 flex items-center gap-2 px-2 py-2 text-xs text-white/45 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-950 text-white"><Gem className="h-4.5 w-4.5" /></div>
            <div>
              <p className="font-serif text-base leading-none">Belles Avenue</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-gray-400">Bookings</p>
            </div>
          </Link>
          <button className="rounded-xl border border-gray-200 bg-white p-2 text-gray-700" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="lg:pl-[250px]">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Header */}
          <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400">
                <Link href="/admin/dashboard" className="hover:text-gray-700">Dashboard</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-gray-700">Bookings</span>
              </div>
              <h1 className="font-serif text-3xl tracking-tight text-gray-950 sm:text-4xl">Manage Bookings</h1>
              <p className="mt-2 max-w-xl text-sm text-gray-500">View, manage and track every jewellery rental from one place.</p>
            </div>
            <Link href="/admin/bookings/new" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-950/10 transition hover:-translate-y-0.5 hover:bg-gray-800 sm:w-auto">
              <Plus className="h-4 w-4" /> New Booking
            </Link>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {[
              ['All bookings', statusCounts.all, 'text-gray-950', 'bg-gray-950'],
              ['Booked', statusCounts.booked, 'text-amber-700', 'bg-amber-500'],
              ['Running', statusCounts.running, 'text-blue-700', 'bg-blue-500'],
              ['Completed', statusCounts.completed, 'text-emerald-700', 'bg-emerald-500'],
              ['Overdue', statusCounts.overdue, 'text-red-700', 'bg-red-500'],
            ].map(([label, value, text, dot]) => (
              <div key={label as string} className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                </div>
                <p className={`mt-2 text-2xl font-semibold tracking-tight ${text}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <section className="mb-5 overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
            <div className="p-4 sm:p-5">
              <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
                <div>
                  <label htmlFor="bookingStatusFilter" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Status</label>
                  <select id="bookingStatusFilter" value={filterStatus} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100">
                    <option value="all">All bookings</option>
                    <option value="booked">Booked</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bookingSearch" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Search</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input id="bookingSearch" type="text" value={searchQuery} onChange={(e) => handleFilterChange('search', e.target.value)} placeholder="Booking number, customer, phone or created by..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-end sm:flex-wrap">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:mr-1 sm:mb-3">
                  <Calendar className="h-4 w-4" /> Date range
                </div>
                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-[500px]">
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-400">From</label>
                    <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-gray-400 focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-400">To</label>
                    <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-gray-400 focus:bg-white" />
                  </div>
                </div>
                <div className="flex gap-2 sm:mb-0 lg:ml-auto">
                  <button onClick={() => { setCurrentPage(1); fetchBookings(); }} className="flex-1 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 sm:flex-none">Apply</button>
                  {(dateRange.startDate || dateRange.endDate) && <button onClick={() => { setDateRange({ startDate: '', endDate: '' }); setCurrentPage(1); fetchBookings(); }} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:flex-none">Clear</button>}
                </div>
              </div>
            </div>
          </section>

          {/* Booking list */}
          <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="font-serif text-xl text-gray-950">Booking records</h2>
                <p className="mt-0.5 text-xs text-gray-400">Click a booking to view complete details.</p>
              </div>
              <div className="text-xs font-medium text-gray-400">{totalItems} total records</div>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredBookings.map((booking) => {
                const status = statusConfig[booking.status] || statusConfig.booked;
                return (
                  <div key={booking._id} className="p-4 transition hover:bg-gray-50/70" onClick={() => handleViewDetails(booking)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-950">{booking.bookingNumber}</p>
                        <p className="mt-1 truncate text-sm font-medium text-gray-700">{booking.customerName}</p>
                        <p className="text-xs text-gray-400">{booking.phone}</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-3">
                      <div><p className="text-[10px] uppercase tracking-wider text-gray-400">Rental period</p><p className="mt-1 text-xs font-medium text-gray-700">{new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(booking.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>
                      <div><p className="text-[10px] uppercase tracking-wider text-gray-400">Total</p><p className="mt-1 text-sm font-semibold text-gray-950">₹{booking.totalAmount}</p></div>
                    </div>

                    <div className="mt-3">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Jewellery</p>
                      <div className="space-y-1">
                        {booking.items.map((item: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="font-semibold text-gray-800">{item.itemId?.itemCode || item.itemCode || 'N/A'}</span>
                            <span className="text-gray-300">•</span>
                            <span className="truncate">{item.itemName || item.itemId?.name || 'Unknown Item'}</span>
                            {item.priceType && <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-500 border border-gray-100">{item.priceType === 'half' ? 'Half' : 'Full'}</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {(booking.additionalCharges || booking.note) && (
                      <div className="mt-3 space-y-2">
                        {booking.additionalCharges && booking.additionalCharges > 0 && <div className="rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-700">Additional charges: ₹{booking.additionalCharges}</div>}
                        {booking.note && <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">Note: {booking.note}</div>}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {booking.status === 'booked' && <>
                        <Link href={`/admin/bookings/${booking._id}/edit`} className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-gray-700">Edit</Link>
                        <button onClick={() => handleStartRental(booking._id)} className="flex-1 rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700">Start</button>
                        <button onClick={() => handleDeleteBooking(booking._id)} className="rounded-xl bg-red-50 p-2.5 text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </>}
                      {booking.status === 'running' && <>
                        <button onClick={() => handleCompleteRental(booking._id)} className="flex-1 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">Complete</button>
                        <button onClick={() => handleStopRental(booking._id)} className="rounded-xl bg-red-50 p-2.5 text-red-600"><Square className="h-4 w-4" /></button>
                      </>}
                      {booking.status === 'overdue' && <button onClick={() => handleCompleteRental(booking._id)} className="flex-1 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">Complete return</button>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-[#faf9fb]">
                    <tr className="border-b border-gray-100">
                      {['#', 'Booking', 'Customer', 'Jewellery', 'Rental period', 'Amount', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">{heading}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBookings.map((booking, index) => {
                      const status = statusConfig[booking.status] || statusConfig.booked;
                      return (
                        <tr key={booking._id} onClick={() => handleViewDetails(booking)} className="cursor-pointer transition hover:bg-gray-50/80">
                          <td className="px-4 py-4 text-xs font-semibold text-gray-400">{index + 1}</td>
                          <td className="px-4 py-4"><p className="text-sm font-semibold text-gray-950">{booking.bookingNumber}</p><p className="mt-0.5 text-[11px] text-gray-400">{new Date(booking.createdAt).toLocaleDateString('en-IN')}</p></td>
                          <td className="px-4 py-4"><p className="max-w-[150px] truncate text-sm font-medium text-gray-800">{booking.customerName}</p><p className="mt-0.5 text-xs text-gray-400">{booking.phone}</p></td>
                          <td className="px-4 py-4"><div className="max-w-[280px] space-y-1">{booking.items.map((item: any, i: number) => <div key={i} className="flex items-center gap-1.5 text-xs"><span className="font-semibold text-gray-800">{item.itemId?.itemCode || item.itemCode || 'N/A'}</span><span className="text-gray-300">—</span><span className="truncate text-gray-500">{item.itemName || item.itemId?.name || 'Unknown Item'}</span>{item.priceType && <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500">{item.priceType === 'half' ? 'HALF' : 'FULL'}</span>}</div>)}</div></td>
                          <td className="px-4 py-4"><p className="whitespace-nowrap text-xs font-medium text-gray-700">{new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p><p className="mt-1 whitespace-nowrap text-[11px] text-gray-400">to {new Date(booking.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></td>
                          <td className="px-4 py-4"><p className="text-sm font-semibold text-gray-950">₹{booking.totalAmount}</p>{booking.additionalCharges && booking.additionalCharges > 0 ? <p className="mt-0.5 text-[10px] text-orange-600">+ ₹{booking.additionalCharges} charges</p> : null}</td>
                          <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.className}`}><span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />{status.label}</span></td>
                          <td className="px-4 py-4"><div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {booking.status === 'booked' && <>
                              <Link href={`/admin/bookings/${booking._id}/edit`} title="Edit booking" className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"><Edit className="h-4 w-4" /></Link>
                              <button onClick={() => handleStartRental(booking._id)} title="Start rental" className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"><Play className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteBooking(booking._id)} title="Delete booking" className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                            </>}
                            {booking.status === 'running' && <><button onClick={() => handleCompleteRental(booking._id)} title="Complete rental" className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"><CheckCircle className="h-4 w-4" /></button><button onClick={() => handleStopRental(booking._id)} title="Stop rental" className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"><Square className="h-4 w-4" /></button></>}
                            {booking.status === 'overdue' && <button onClick={() => handleCompleteRental(booking._id)} title="Complete rental" className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"><CheckCircle className="h-4 w-4" /></button>}
                          </div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {bookings.length === 0 && <div className="px-6 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100"><Calendar className="h-6 w-6 text-gray-400" /></div><h3 className="mt-4 font-serif text-xl text-gray-900">No bookings found</h3><p className="mt-1 text-sm text-gray-400">Create a new booking or adjust your filters.</p></div>}
          </section>

          {totalItems > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={totalItems} showItemsInfo={true} />}
        </div>
      </main>

      {/* Booking details modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 p-3 backdrop-blur-sm sm:p-6">
          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Booking details</p><h2 className="mt-1 font-serif text-2xl text-gray-950">{selectedBooking.bookingNumber}</h2></div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-5 p-5 sm:p-7">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-5"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Customer</p><div className="grid grid-cols-2 gap-4"><div><p className="text-[11px] text-gray-400">Name</p><p className="mt-1 text-sm font-semibold text-gray-900">{selectedBooking.customerName}</p></div><div><p className="text-[11px] text-gray-400">Phone</p><p className="mt-1 text-sm font-semibold text-gray-900">{selectedBooking.phone}</p></div><div className="col-span-2"><p className="text-[11px] text-gray-400">Address</p><p className="mt-1 text-sm text-gray-700">{selectedBooking.address}</p></div><div><p className="text-[11px] text-gray-400">Created by</p><p className="mt-1 text-sm font-medium text-gray-800">{selectedBooking.createdBy}</p></div><div><p className="text-[11px] text-gray-400">Status</p><span className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusConfig[selectedBooking.status]?.className || 'bg-gray-100 text-gray-700'}`}>{statusConfig[selectedBooking.status]?.label || selectedBooking.status}</span></div></div></div>
                <div className="rounded-2xl bg-gray-50 p-5"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Rental period</p><div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3"><div><p className="text-[11px] text-gray-400">Start</p><p className="mt-1 text-sm font-semibold text-gray-900">{new Date(selectedBooking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div><div><p className="text-[11px] text-gray-400">Return</p><p className="mt-1 text-sm font-semibold text-gray-900">{new Date(selectedBooking.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>{selectedBooking.actualReturnDate && <div><p className="text-[11px] text-gray-400">Actual return</p><p className="mt-1 text-sm font-semibold text-emerald-700">{new Date(selectedBooking.actualReturnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>}</div></div>
              </div>

              <div className="rounded-2xl border border-gray-100 p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-xl text-gray-950">Jewellery items</h3><span className="text-xs text-gray-400">{selectedBooking.items.length} item{selectedBooking.items.length !== 1 ? 's' : ''}</span></div><div className="space-y-3">{selectedBooking.items.map((item, index) => { const image = item.itemId?.image; const imageUrl = image?.includes('drive.google.com') ? `https://drive.google.com/thumbnail?id=${image.split('/file/d/')[1]?.split('/')[0]}&sz=w1000` : image; return <div key={index} className="flex gap-4 rounded-2xl bg-gray-50 p-3 sm:p-4"><div className="h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-gray-200 sm:h-28 sm:w-28" onClick={() => imageUrl && handleImageClick(imageUrl)}>{imageUrl ? <img src={imageUrl} alt={item.itemName || item.itemId?.name || 'Item'} className="h-full w-full object-cover transition hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-gray-900">{item.itemName || item.itemId?.name || 'Unknown Item'}</p><p className="mt-1 text-xs text-gray-400">Code: {item.itemCode || item.itemId?.itemCode || 'N/A'}</p></div>{item.priceType && <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-500 border border-gray-100">{item.priceType === 'half' ? 'Half Set' : 'Full Set'}</span>}</div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-[10px] uppercase tracking-wider text-gray-400">Rent</p><p className="mt-1 text-sm font-semibold text-gray-900">₹{item.rentPrice}</p></div><div><p className="text-[10px] uppercase tracking-wider text-gray-400">Security</p><p className="mt-1 text-sm font-semibold text-gray-900">₹{item.security}</p></div></div></div></div> })}</div></div>

              <div className="rounded-2xl border border-gray-100 p-5"><h3 className="mb-4 font-serif text-xl text-gray-950">Payment summary</h3><div className="space-y-2.5 text-sm"><div className="flex justify-between"><span className="text-gray-500">Total rent</span><span className="font-medium">₹{selectedBooking.items.reduce((sum, item) => sum + (item.rentPrice || 0), 0)}</span></div><div className="flex justify-between"><span className="text-gray-500">Total security</span><span className="font-medium">₹{selectedBooking.items.reduce((sum, item) => sum + (item.security || 0), 0)}</span></div>{(selectedBooking.rentDiscount || 0) > 0 && <div className="flex justify-between"><span className="text-gray-500">Rent discount</span><span className="font-medium text-emerald-600">-₹{selectedBooking.rentDiscount}</span></div>}{(selectedBooking.securityDiscount || 0) > 0 && <div className="flex justify-between"><span className="text-gray-500">Security discount</span><span className="font-medium text-emerald-600">-₹{selectedBooking.securityDiscount}</span></div>}{(selectedBooking.advancePayment || 0) > 0 && <div className="flex justify-between"><span className="text-gray-500">Advance payment</span><span className="font-medium text-blue-600">-₹{selectedBooking.advancePayment}</span></div>}{(selectedBooking.additionalCharges || 0) > 0 && <div className="flex justify-between"><span className="text-gray-500">Additional charges</span><span className="font-medium text-orange-600">+₹{selectedBooking.additionalCharges}</span></div>}<div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4"><span className="font-semibold text-gray-900">Total amount</span><span className="text-xl font-bold text-gray-950">₹{selectedBooking.totalAmount}</span></div>{(selectedBooking.balanceAmount || 0) > 0 && <div className="flex justify-between text-xs"><span className="text-gray-400">Balance amount</span><span className="font-medium text-gray-700">₹{selectedBooking.balanceAmount}</span></div>}</div><div className="mt-4 rounded-xl bg-emerald-50 p-3"><div className="flex justify-between"><span className="text-sm font-semibold text-emerald-800">Returnable security</span><span className="text-sm font-bold text-emerald-700">₹{selectedBooking.items.reduce((sum, item) => sum + (item.security || 0), 0) - (selectedBooking.securityDiscount || 0)}</span></div><p className="mt-1 text-[11px] text-emerald-600">Refundable if items are returned without damage.</p></div></div>

              {selectedBooking.note && <div className="rounded-2xl bg-blue-50 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Admin note</p><p className="mt-2 text-sm leading-6 text-blue-800">{selectedBooking.note}</p></div>}
              <p className="text-center text-xs text-gray-400">Created on {new Date(selectedBooking.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      )}

      {/* Full image modal */}
      {isImageModalOpen && selectedImage && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"><button onClick={() => setIsImageModalOpen(false)} className="absolute right-4 top-4 rounded-full bg-white p-2 shadow-xl"><X className="h-5 w-5 text-gray-900" /></button><div className="flex h-full w-full items-center justify-center"><img src={selectedImage} alt="Full size jewellery" className="max-h-[90vh] max-w-full rounded-2xl object-contain" /></div></div>}
    </div>
  );
}
