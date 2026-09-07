'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  ArrowLeft,
  CheckCircle2,
  CalendarDays,
  Clock3,
  User,
  Phone,
  MapPin,
  CreditCard,
  Download,
  FileText,
  Sparkles,
  ShieldCheck,
  Package,
  Receipt,
  CircleDollarSign,
  ChevronRight,
} from 'lucide-react';
import { checkBackendHealth } from '@/lib/backendHealth';

export const dynamic = 'force-dynamic';

interface BookingItem {
  itemId?: any;
  itemName?: string;
  itemCode?: string;
  rentPrice?: number;
  security?: number;
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
  actualReturnDate?: string;
  rentDiscount: number;
  securityDiscount: number;
  advancePayment: number;
  additionalCharges?: number;
  totalAmount: number;
  balanceAmount: number;
  status: 'booked' | 'running' | 'completed' | 'overdue';
  createdAt: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: any[];
  bookingNumber: string;
  startDate: string;
  returnDate: string;
  totalRent: number;
  totalSecurity: number;
  rentDiscount: number;
  securityDiscount: number;
  advancePayment: number;
  additionalCharges?: number;
  totalAmount: number;
  balanceAmount: number;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  createdAt: string;
}

const formatCurrency = (amount: number | undefined | null) => {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
};

const formatDate = (date: string) => {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const calculateDuration = (startDate: string, returnDate: string) => {
  const start = new Date(startDate).getTime();
  const end = new Date(returnDate).getTime();

  if (!start || !end || end < start) return 0;

  return Math.max(
    1,
    Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  );
};

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 shadow-lg shadow-pink-500/20">
        <div className="absolute inset-[2px] rounded-[14px] border border-white/20" />

        <svg
          viewBox="0 0 24 24"
          className="relative h-5 w-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 3L20 8L12 21L4 8L12 3Z" />
          <path d="M4 8H20" />
          <path d="M8 8L12 21L16 8" />
          <path d="M8 8L12 3L16 8" />
        </svg>
      </div>

      <div>
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">
          Belles Avenue
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-400">
          Jewellery Rentals
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const styles = {
    booked: 'bg-amber-50 text-amber-700 border-amber-200',
    running: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels = {
    booked: 'Confirmed',
    running: 'Rental Active',
    completed: 'Completed',
    overdue: 'Overdue',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}

function BookingConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookingNumber = searchParams.get('bookingNumber');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    if (bookingNumber) {
      fetchBooking();
    } else {
      setLoading(false);
    }
  }, [bookingNumber]);

  const fetchBooking = async () => {
    if (!bookingNumber) return;

    try {
      const backendStatus = await checkBackendHealth();

      if (backendStatus === 'disconnected') {
        console.error('Backend is not reachable');
        setLoading(false);
        return;
      }

      const response = await api.get(
        `/bookings/number/${bookingNumber}`
      );

      const bookingData = response.data;

      setBooking(bookingData);

      setInvoiceLoading(true);

      try {
        const invoiceResponse = await api.get(
          `/invoices/booking/${bookingData._id}`
        );

        setInvoice(invoiceResponse.data);
      } catch (invoiceError) {
        console.log(
          'No invoice found for this booking:',
          invoiceError
        );

        setInvoice(null);
      } finally {
        setInvoiceLoading(false);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const totalRent = useMemo(() => {
    if (!booking) return 0;

    return booking.items.reduce(
      (sum, item) => sum + Number(item.rentPrice || 0),
      0
    );
  }, [booking]);

  const totalSecurity = useMemo(() => {
    if (!booking) return 0;

    return booking.items.reduce(
      (sum, item) => sum + Number(item.security || 0),
      0
    );
  }, [booking]);

  const duration = useMemo(() => {
    if (!booking) return 0;

    return calculateDuration(
      booking.startDate,
      booking.returnDate
    );
  }, [booking]);

  const handleDownloadInvoice = () => {
    if (!booking) return;

    window.open(
      `/admin/invoices?search=${encodeURIComponent(
        booking.bookingNumber
      )}`,
      '_blank'
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8fb]">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/20">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-900">
              Loading booking
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Preparing your confirmation details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#faf8fb]">
        <header className="border-b border-gray-200/70 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Logo />

            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-pink-200 hover:text-pink-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl border border-gray-200/80 bg-white p-8 text-center shadow-xl shadow-gray-200/30">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50">
              <FileText className="h-9 w-9 text-red-500" />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
              Booking Not Found
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              The booking number you are looking for does not
              exist or is no longer available.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.back()}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Go Back
              </button>

              <Link
                href="/admin/dashboard"
                className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:opacity-95"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8fb] text-gray-900">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-pink-200/20 blur-3xl" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
              title="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>

            <div className="hidden sm:block h-7 w-px bg-gray-200" />

            <Logo />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-gray-400">
                Booking Confirmation
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {booking.bookingNumber}
              </p>
            </div>

            <StatusBadge status={booking.status} />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Success hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-pink-100 bg-white shadow-xl shadow-pink-100/30">
          <div className="absolute right-0 top-0 h-56 w-56 translate-x-20 -translate-y-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 blur-2xl" />

          <div className="relative px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl shadow-pink-500/25">
                <div className="absolute inset-1 rounded-full border border-white/20" />
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-pink-50 px-3.5 py-1.5 text-xs font-semibold text-pink-600">
                <Sparkles className="h-3.5 w-3.5" />
                Booking successfully created
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Booking Confirmed
              </h1>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                Your jewellery rental has been successfully
                reserved. Keep the booking number below for
                future reference.
              </p>

              <div className="mt-6 flex flex-col items-center">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Booking Number
                </span>

                <div className="mt-2 rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-3">
                  <span className="text-2xl font-bold tracking-wider text-transparent bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text">
                    {booking.bookingNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left */}
          <div className="space-y-6">
            {/* Customer */}
            <section className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
                  <User className="h-5 w-5 text-pink-600" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Customer Information
                  </h2>
                  <p className="text-xs text-gray-400">
                    Booking customer details
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                    <User className="h-3.5 w-3.5" />
                    Customer Name
                  </div>

                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {booking.customerName}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                    <Phone className="h-3.5 w-3.5" />
                    Phone Number
                  </div>

                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {booking.phone}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:col-span-2">
                  <div className="flex items-start gap-2 text-xs font-medium text-gray-400">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Address
                  </div>

                  <p className="mt-2 text-sm font-medium leading-6 text-gray-800">
                    {booking.address || 'No address provided'}
                  </p>
                </div>
              </div>
            </section>

            {/* Rental period */}
            <section className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                  <CalendarDays className="h-5 w-5 text-purple-600" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Rental Schedule
                  </h2>
                  <p className="text-xs text-gray-400">
                    Reserved rental period
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Pickup / Start
                  </p>

                  <p className="mt-2 text-sm font-bold text-gray-900">
                    {formatDate(booking.startDate)}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Return Date
                  </p>

                  <p className="mt-2 text-sm font-bold text-gray-900">
                    {formatDate(booking.returnDate)}
                  </p>
                </div>

                <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-pink-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    Duration
                  </div>

                  <p className="mt-2 text-sm font-bold text-pink-700">
                    {duration} {duration === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>
            </section>

            {/* Items */}
            <section className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Reserved Jewellery
                    </h2>

                    <p className="text-xs text-gray-400">
                      {booking.items.length}{' '}
                      {booking.items.length === 1
                        ? 'item'
                        : 'items'}{' '}
                      in this booking
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {booking.items.map((item, index) => {
                  const supportsHalfPricing =
                    Boolean(
                      item.itemId?.supportsHalfPricing
                    );

                  const itemName =
                    item.itemName ||
                    item.itemId?.name ||
                    'Unknown Jewellery';

                  const itemCode =
                    item.itemCode ||
                    item.itemId?.itemCode ||
                    'N/A';

                  return (
                    <div
                      key={`${itemCode}-${index}`}
                      className="group rounded-2xl border border-gray-100 bg-gray-50/60 p-4 transition hover:border-pink-100 hover:bg-pink-50/20"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                            <Package className="h-5 w-5 text-pink-500" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">
                              {itemName}
                            </p>

                            <p className="mt-1 text-xs font-medium text-gray-400">
                              Code: {itemCode}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-100">
                                Rent {formatCurrency(item.rentPrice)}
                              </span>

                              <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-100">
                                Security {formatCurrency(item.security)}
                              </span>

                              {supportsHalfPricing && (
                                <span
                                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                    item.priceType === 'half'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-purple-50 text-purple-700'
                                  }`}
                                >
                                  {item.priceType === 'half'
                                    ? 'Half Price'
                                    : 'Full Price'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <StatusBadge status={booking.status} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Booking status */}
            <section className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Booking Status
                  </h2>

                  <p className="text-xs text-gray-400">
                    Current rental lifecycle
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        booking.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-600'
                          : booking.status === 'running'
                            ? 'bg-blue-100 text-blue-600'
                            : booking.status === 'overdue'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">
                          {booking.status === 'booked' &&
                            'Booking is confirmed'}
                          {booking.status === 'running' &&
                            'Rental is currently active'}
                          {booking.status === 'completed' &&
                            'Rental completed successfully'}
                          {booking.status === 'overdue' &&
                            'Rental is overdue'}
                        </p>

                        <StatusBadge status={booking.status} />
                      </div>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {booking.status === 'booked' &&
                          'The jewellery has been reserved and is ready for the scheduled rental period.'}

                        {booking.status === 'running' &&
                          'The customer currently has the reserved jewellery.'}

                        {booking.status === 'completed' &&
                          'This rental has been successfully completed.'}

                        {booking.status === 'overdue' &&
                          'The expected return date has passed. Please follow up with the customer.'}
                      </p>

                      <p className="mt-2 text-xs font-medium text-gray-400">
                        {booking.actualReturnDate
                          ? `Actual return: ${formatDate(
                              booking.actualReturnDate
                            )}`
                          : `Expected return: ${formatDate(
                              booking.returnDate
                            )}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/30">
              <div className="bg-gradient-to-br from-[#21131d] via-[#301b2c] to-[#432344] p-5 text-white sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/50">
                      PAYMENT SUMMARY
                    </p>

                    <h2 className="mt-1 text-lg font-bold">
                      Booking Total
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <Receipt className="h-5 w-5 text-pink-200" />
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-white/50">
                    Total payable
                  </p>

                  <p className="mt-1 text-3xl font-bold tracking-tight">
                    {formatCurrency(booking.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-500">
                      Total Rent
                    </span>

                    <span className="font-semibold text-gray-800">
                      {formatCurrency(totalRent)}
                    </span>
                  </div>

                  {booking.rentDiscount > 0 && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-gray-500">
                        Rent Discount
                      </span>

                      <span className="font-semibold text-red-500">
                        -{formatCurrency(booking.rentDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-500">
                      Security Deposit
                    </span>

                    <span className="font-semibold text-gray-800">
                      {formatCurrency(totalSecurity)}
                    </span>
                  </div>

                  {booking.securityDiscount > 0 && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-gray-500">
                        Security Discount
                      </span>

                      <span className="font-semibold text-red-500">
                        -{formatCurrency(
                          booking.securityDiscount
                        )}
                      </span>
                    </div>
                  )}

                  {booking.additionalCharges &&
                    booking.additionalCharges > 0 && (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-gray-500">
                          Additional Charges
                        </span>

                        <span className="font-semibold text-orange-500">
                          +{formatCurrency(
                            booking.additionalCharges
                          )}
                        </span>
                      </div>
                    )}

                  <div className="my-4 border-t border-dashed border-gray-200" />

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-gray-800">
                      Total Amount
                    </span>

                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </div>

                  {booking.advancePayment > 0 && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-emerald-600" />

                          <span className="text-sm font-semibold text-emerald-700">
                            Advance Paid
                          </span>
                        </div>

                        <span className="text-sm font-bold text-emerald-700">
                          {formatCurrency(
                            booking.advancePayment
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4 text-pink-600" />

                        <span className="text-sm font-semibold text-pink-700">
                          Balance Due
                        </span>
                      </div>

                      <span className="text-lg font-bold text-pink-700">
                        {formatCurrency(
                          booking.balanceAmount
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invoice */}
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />

                    <p className="text-sm font-bold text-gray-800">
                      Invoice
                    </p>
                  </div>

                  {invoiceLoading ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-pink-500" />
                      Checking invoice availability...
                    </div>
                  ) : invoice ? (
                    <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-400">
                            Invoice Number
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {invoice.invoiceNumber}
                          </p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                          <Receipt className="h-4 w-4 text-pink-500" />
                        </div>
                      </div>

                      <button
                        onClick={handleDownloadInvoice}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/15 transition hover:opacity-95"
                      >
                        <Download className="h-4 w-4" />
                        View / Download Invoice
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs leading-5 text-gray-500">
                        An invoice has not been generated for this
                        booking yet.
                      </p>

                      <Link
                        href="/admin/invoices"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-pink-600 hover:text-pink-700"
                      >
                        Open invoices
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <Link
                    href="/admin/dashboard"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                  >
                    Continue to Dashboard
                    <ChevronRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/admin/bookings"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:opacity-95"
                  >
                    <Package className="h-4 w-4" />
                    View All Bookings
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom reassurance */}
        <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200/70 bg-white/70 px-5 py-4 text-center sm:flex-row">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />

          <p className="text-xs text-gray-500">
            Your booking information has been securely saved.
            Please keep your booking number for future reference.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8fb]">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-[3px] border-pink-100 border-t-pink-500" />
              <p className="mt-4 text-sm font-medium text-gray-500">
                Loading booking details...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <BookingConfirmationContent />
    </Suspense>
  );
}