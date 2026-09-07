'use client';

// Item details page with earnings calculation

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, Gem, Menu, X, Package, Receipt, LayoutDashboard } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const getImageUrl = (image: string) => {
    if (!image) return '';
    if (image.includes('drive.google.com')) {
      const match = image.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match?.[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
      }
    }
    return image;
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
    <div className="min-h-screen bg-[#faf8fb] text-gray-900">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-xl p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 text-white">
              <Gem className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg font-semibold">Belles Avenue</span>
          </Link>
          <div className="w-9" />
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="relative h-full w-[280px] max-w-[85vw] bg-[#171318] px-5 py-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <Gem className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-serif text-lg font-semibold">Belles Avenue</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Admin Studio</p>
                </div>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-10 space-y-2">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Workspace</p>
              <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/65 hover:bg-white/10 hover:text-white">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <Link href="/admin/bookings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/65 hover:bg-white/10 hover:text-white">
                <Calendar className="h-4 w-4" /> Bookings
              </Link>
              <Link href="/admin/items" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-sm font-medium text-white">
                <Package className="h-4 w-4" /> Jewellery
              </Link>
              <Link href="/admin/invoices" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/65 hover:bg-white/10 hover:text-white">
                <Receipt className="h-4 w-4" /> Invoices
              </Link>
            </nav>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-[#171318] px-5 py-7 text-white lg:flex lg:flex-col">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Gem className="h-5 w-5" />
            </span>
            <div>
              <p className="font-serif text-xl font-semibold tracking-tight">Belles Avenue</p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Admin Studio</p>
            </div>
          </Link>

          <nav className="mt-12 space-y-2">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Workspace</p>
            <Link href="/admin/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/admin/bookings" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
              <Calendar className="h-4 w-4" /> Bookings
            </Link>
            <Link href="/admin/items" className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-sm font-medium text-white shadow-inner">
              <Package className="h-4 w-4" /> Jewellery
            </Link>
            <Link href="/admin/invoices" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
              <Receipt className="h-4 w-4" /> Invoices
            </Link>
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-medium text-white/80">Item details</p>
            <p className="mt-1 text-xs leading-5 text-white/40">Review performance, rental history and profitability.</p>
          </div>
        </aside>

        <main className="w-full lg:ml-64">
          {/* Top bar */}
          <div className="sticky top-0 z-20 hidden border-b border-gray-200/80 bg-white/90 backdrop-blur-xl lg:block">
            <div className="flex h-[72px] items-center justify-between px-8 xl:px-10">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">Jewellery / Details</p>
                <h1 className="mt-1 font-serif text-xl font-semibold text-gray-900">{item.itemCode}</h1>
              </div>
              <Link href="/admin/items" className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <ArrowLeft className="h-4 w-4" />
                Back to Jewellery
              </Link>
            </div>
          </div>

          <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {/* Page heading */}
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Link href="/admin/items" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900 lg:hidden">
                  <ArrowLeft className="h-4 w-4" /> Back to Jewellery
                </Link>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Jewellery Profile</p>
                <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-gray-950 sm:text-4xl">{item.name}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">{item.category}</p>
              </div>
              <span className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold capitalize ${getStatusColor(item.status)}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {item.status.replace('_', ' ')}
              </span>
            </div>

            {/* Item hero + stats */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_12px_40px_rgba(30,20,35,0.06)]">
                <div className="relative aspect-[4/4.2] overflow-hidden bg-gradient-to-br from-[#f7edf4] via-white to-[#eee8f5]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.95),transparent_35%)]" />
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="relative h-full w-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', item.name, 'Original URL:', item.image, 'Processed URL:', getImageUrl(item.image));
                        const match = item.image.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                        if (match?.[1]) {
                          const id = match[1];
                          const fallbackUrl = `https://lh3.googleusercontent.com/d/${id}=w1000`;
                          console.log('Trying fallback URL:', fallbackUrl);
                          (e.currentTarget as HTMLImageElement).src = fallbackUrl;
                        } else {
                          (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/600x600.png?text=Image+Not+Available';
                        }
                      }}
                    />
                  ) : (
                    <div className="relative flex h-full items-center justify-center">
                      <Gem className="h-24 w-24 text-gray-300" strokeWidth={1} />
                    </div>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">Item code</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-gray-900">{item.itemCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">Barcode</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{item.barcode || '—'}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">Purchase</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">₹{item.purchasePrice?.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">Rent / day</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">₹{item.rentPrice?.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="col-span-2 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                      <p className="text-xs text-amber-700">Security deposit</p>
                      <p className="mt-1 text-lg font-semibold text-amber-900">₹{item.securityDeposit?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                {bookingStats && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Total Bookings', value: bookingStats.totalBookings, icon: Calendar, tone: 'text-gray-900', bg: 'bg-gray-50' },
                      { label: 'Active Rentals', value: bookingStats.activeBookings, icon: Clock, tone: 'text-blue-700', bg: 'bg-blue-50' },
                      { label: 'Completed', value: bookingStats.completedBookings, icon: CheckCircle, tone: 'text-emerald-700', bg: 'bg-emerald-50' },
                      { label: 'Overdue', value: bookingStats.overdueBookings, icon: AlertTriangle, tone: 'text-red-700', bg: 'bg-red-50' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
                        <div className={`mb-5 flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}>
                          <stat.icon className={`h-4 w-4 ${stat.tone}`} />
                        </div>
                        <p className={`text-2xl font-semibold tracking-tight ${stat.tone}`}>{stat.value}</p>
                        <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Item earnings</p>
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
                      ₹{((itemEarnings || 0) + (item?.oldEarnings || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Rental earnings including previous earnings</p>
                  </div>

                  <div className={`rounded-2xl border bg-white p-5 shadow-sm ${profitAmount >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Purchase performance</p>
                    <p className={`mt-3 text-3xl font-semibold tracking-tight ${profitAmount >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      ₹{profitDisplay}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{profitLabel}</p>
                  </div>
                </div>

                {/* Booking history */}
                <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_12px_40px_rgba(30,20,35,0.05)]">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Rental activity</p>
                      <h3 className="mt-1 font-serif text-2xl font-medium text-gray-900">Booking History</h3>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{bookings.length} records</span>
                  </div>

                  <div className="max-h-[680px] divide-y divide-gray-100 overflow-y-auto">
                    {bookings.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                          <Calendar className="h-6 w-6 text-gray-300" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-gray-800">No bookings yet</h3>
                        <p className="mt-1 text-sm text-gray-500">This item hasn't been rented yet.</p>
                      </div>
                    ) : (
                      bookings.map((booking) => {
                        const bookingItem = booking.items?.find((bi: any) => bi.itemId === itemId || bi.itemId?._id === itemId);

                        return (
                          <article key={booking._id} className="p-5 transition hover:bg-gray-50/70 sm:p-6">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                                    {getStatusIcon(booking.status)}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="truncate font-semibold text-gray-900">{booking.customerName}</h4>
                                    <p className="mt-0.5 text-sm text-gray-500">{booking.phone}</p>
                                    {bookingItem && (
                                      <p className="mt-1 truncate text-xs text-gray-400">
                                        {bookingItem.itemCode || item.itemCode} · {bookingItem.priceType === 'half' ? 'Half price' : 'Full price'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {[
                                  ['Start', booking.startDate],
                                  ['Return', booking.returnDate],
                                  ...(booking.actualReturnDate ? [['Actual return', booking.actualReturnDate]] : []),
                                  ['Booked on', booking.createdAt],
                                ].map(([label, value]) => (
                                  <div key={label} className="rounded-xl bg-gray-50 px-3 py-2.5">
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
                                    <p className="mt-1 text-xs font-semibold text-gray-700">
                                      {new Date(value as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {bookingItem && (
                                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-blue-500">Rent</p>
                                    <p className="mt-1 text-sm font-semibold text-blue-900">₹{bookingItem.rentPrice?.toLocaleString('en-IN') || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-blue-500">Security</p>
                                    <p className="mt-1 text-sm font-semibold text-blue-900">₹{bookingItem.security?.toLocaleString('en-IN') || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-blue-500">Price type</p>
                                    <p className="mt-1 text-sm font-semibold text-blue-900">{bookingItem.priceType === 'half' ? 'Half' : 'Full'}</p>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Booking rent</p>
                                  <p className="mt-1 font-semibold text-gray-900">
                                    ₹{booking.items.reduce((sum: number, item: any) => sum + (item.rentPrice || 0), 0).toLocaleString('en-IN')}
                                  </p>
                                  {booking.rentDiscount > 0 && (
                                    <p className="mt-1 text-xs text-red-500">-₹{booking.rentDiscount.toLocaleString('en-IN')} discount · Net ₹{(booking.items.reduce((sum: number, item: any) => sum + (item.rentPrice || 0), 0) - booking.rentDiscount).toLocaleString('en-IN')}</p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Booking security</p>
                                  <p className="mt-1 font-semibold text-gray-900">
                                    ₹{booking.items.reduce((sum: number, item: any) => sum + (item.security || 0), 0).toLocaleString('en-IN')}
                                  </p>
                                  {booking.securityDiscount > 0 && (
                                    <p className="mt-1 text-xs text-red-500">-₹{booking.securityDiscount.toLocaleString('en-IN')} discount · Net ₹{(booking.items.reduce((sum: number, item: any) => sum + (item.security || 0), 0) - booking.securityDiscount).toLocaleString('en-IN')}</p>
                                  )}
                                </div>
                              </div>

                              {bookingItem && (booking.rentDiscount > 0 || booking.securityDiscount > 0) && (
                                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 sm:grid-cols-2">
                                  <div>
                                    <p className="text-xs font-medium text-amber-700">This item's rent discount share</p>
                                    <p className="mt-1 font-semibold text-amber-900">-₹{((booking.rentDiscount || 0) / (booking.items?.length || 1)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-amber-700">This item's net earnings</p>
                                    <p className="mt-1 font-semibold text-emerald-700">₹{((bookingItem.rentPrice || 0) - ((booking.rentDiscount || 0) / (booking.items?.length || 1))).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                                  </div>
                                </div>
                              )}

                              {booking.status === 'overdue' && (
                                <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                                  <AlertTriangle className="h-4 w-4 shrink-0" />
                                  This rental is overdue.
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
