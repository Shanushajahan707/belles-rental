'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { checkBackendHealth } from '@/lib/backendHealth';
import {
  ArrowLeft,
  CheckCircle2,
  CalendarDays,
  Clock3,
  Phone,
  MapPin,
  Sparkles,
  Package,
  Receipt,
  Gem,
  ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface BookingItem {
  itemName?: string;
  itemCode?: string;
  rentPrice?: number;
  security?: number;
  priceType?: 'full' | 'half';
  image?: string;
}

interface Invoice {
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: BookingItem[];
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

interface Booking {
  bookingNumber: string;
  customerName: string;
  phone: string;
  address: string;
  items: BookingItem[];
  startDate: string;
  returnDate: string;
  actualReturnDate?: string;
  status: 'booked' | 'running' | 'completed' | 'overdue';
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatCurrency = (
  amount: number | undefined | null
) => {
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

const calculateDuration = (
  startDate: string,
  returnDate: string
) => {
  const start = new Date(startDate).getTime();
  const end = new Date(returnDate).getTime();

  if (!start || !end || end < start) {
    return 0;
  }

  return Math.max(
    1,
    Math.ceil(
      (end - start) /
        (1000 * 60 * 60 * 24)
    )
  );
};

/**
 * Supports the image format currently used by Belles Avenue.
 * Google Drive images are converted to a thumbnail URL.
 */
const getImageUrl = (
  image: string | undefined
) => {
  if (!image) return '';

  if (image.includes('drive.google.com')) {
    const match = image.match(
      /\/file\/d\/([a-zA-Z0-9_-]+)/
    );

    if (match?.[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
  }

  return image;
};

/* -------------------------------------------------------------------------- */
/* Logo                                                                       */
/* -------------------------------------------------------------------------- */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 shadow-lg shadow-pink-500/20 sm:h-10 sm:w-10">
        <div className="absolute inset-[2px] rounded-[10px] border border-white/20" />

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
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-base font-bold tracking-tight text-transparent sm:text-lg">
          Belles Avenue
        </div>

        <div className="hidden text-[9px] font-medium uppercase tracking-[0.22em] text-gray-400 sm:block">
          Jewellery Rentals
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */

function StatusBadge({
  status,
}: {
  status: Booking['status'];
}) {
  const config = {
    booked: {
      label: 'Booking Confirmed',
      className:
        'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    running: {
      label: 'Rental Active',
      className:
        'border-blue-200 bg-blue-50 text-blue-700',
    },
    completed: {
      label: 'Rental Completed',
      className:
        'border-purple-200 bg-purple-50 text-purple-700',
    },
    overdue: {
      label: 'Rental Overdue',
      className:
        'border-red-200 bg-red-50 text-red-700',
    },
  };

  const item = config[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${item.className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>

      {item.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Image                                                                       */
/* -------------------------------------------------------------------------- */

function JewelleryImage({
  image,
  name,
}: {
  image?: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  const imageUrl = getImageUrl(image);

  if (!imageUrl || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <Gem className="h-12 w-12 text-pink-200 sm:h-14 sm:w-14" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      onError={(event) => {
        const match = image?.match(
          /\/file\/d\/([a-zA-Z0-9_-]+)/
        );

        if (match?.[1]) {
          const id = match[1];

          const fallback =
            `https://lh3.googleusercontent.com/d/${id}=w1000`;

          if (
            event.currentTarget.src !== fallback
          ) {
            event.currentTarget.src = fallback;
            return;
          }
        }

        setFailed(true);
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function PublicBookingPage() {
  const params = useParams();

  const invoiceNumber =
    params.invoiceNumber as string;

  const [invoice, setInvoice] =
    useState<Invoice | null>(null);

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [backendStatus, setBackendStatus] =
    useState<
      'checking' | 'connected' | 'disconnected'
    >('checking');

  useEffect(() => {
    if (invoiceNumber) {
      fetchBookingDetails();
    }
  }, [invoiceNumber]);

  const fetchBookingDetails = async () => {
    if (!invoiceNumber) return;

    try {
      setLoading(true);
      setError(null);

      const healthStatus =
        await checkBackendHealth();

      setBackendStatus(healthStatus);

      if (
        healthStatus === 'disconnected'
      ) {
        setError(
          'Unable to connect to the server. Please try again later.'
        );
        setLoading(false);
        return;
      }

      const response = await api.get(
        `/public/booking/${invoiceNumber}`
      );

      setInvoice(response.data.invoice);
      setBooking(response.data.booking);
    } catch (error: any) {
      console.error(
        'Error fetching booking details:',
        error
      );

      setBackendStatus('disconnected');

      setError(
        error.response?.data?.error ||
          'Failed to load booking details'
      );
    } finally {
      setLoading(false);
    }
  };

  const duration = useMemo(() => {
    if (!invoice) return 0;

    return calculateDuration(
      invoice.startDate,
      invoice.returnDate
    );
  }, [invoice]);

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                   */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8fb]">
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl shadow-pink-500/20">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-gray-900">
              Preparing your booking
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Please wait a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                     */
  /* ------------------------------------------------------------------------ */

  if (error || !invoice || !booking) {
    return (
      <div className="min-h-screen bg-[#faf8fb]">
        <header className="border-b border-gray-200/70 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
            <Logo />

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-pink-200 hover:text-pink-600"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline">
                Home
              </span>
              <span className="xs:hidden">
                Back
              </span>
            </Link>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-5 sm:min-h-[calc(100vh-80px)]">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-7 text-center shadow-xl shadow-gray-200/30 sm:p-9">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50">
              <Package className="h-9 w-9 text-red-500" />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-gray-900">
              Booking Not Found
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {error ||
                'We could not find the booking you are looking for.'}
            </p>

            <div className="mt-7">
              <button
                onClick={fetchBookingDetails}
                className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:opacity-95"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Main                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-[#faf8fb] text-gray-900">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-pink-200/20 blur-3xl" />
        <div className="absolute -right-40 top-32 h-[420px] w-[420px] rounded-full bg-purple-200/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center"
          >
            <Logo />
          </Link>

          <StatusBadge status={booking.status} />
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* ------------------------------------------------------------------ */}
        {/* Welcome                                                             */}
        {/* ------------------------------------------------------------------ */}

        <section className="relative overflow-hidden rounded-[28px] border border-pink-100 bg-white shadow-xl shadow-pink-100/30">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 blur-3xl" />

          <div className="relative px-5 py-8 text-center sm:px-8 sm:py-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl shadow-pink-500/20 sm:h-20 sm:w-20 sm:rounded-3xl">
              <CheckCircle2 className="h-8 w-8 text-white sm:h-10 sm:w-10" />
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-pink-500">
              Your Reservation
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
              Hello, {invoice.customerName}
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500 sm:text-base">
              Here&apos;s everything you need to know about
              your jewellery rental.
            </p>

            <div className="mt-5 inline-flex max-w-full flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Booking Number
              </span>

              <div className="mt-2 max-w-full rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 px-5 py-2.5">
                <span className="break-all text-lg font-bold tracking-wider text-transparent bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text sm:text-xl">
                  {invoice.bookingNumber}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Rental Dates                                                        */}
        {/* ------------------------------------------------------------------ */}

        <section className="mt-5 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:mt-6 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50">
              <CalendarDays className="h-5 w-5 text-purple-600" />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Rental Dates
              </h2>

              <p className="text-xs text-gray-400">
                Your reserved rental period
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <p className="text-xs font-medium text-gray-400">
                Start Date
              </p>

              <p className="mt-1.5 text-sm font-bold text-gray-900">
                {formatDate(invoice.startDate)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <p className="text-xs font-medium text-gray-400">
                Return Date
              </p>

              <p className="mt-1.5 text-sm font-bold text-gray-900">
                {formatDate(invoice.returnDate)}
              </p>
            </div>

            <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-purple-50 p-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-pink-500">
                <Clock3 className="h-3.5 w-3.5" />
                Rental Duration
              </div>

              <p className="mt-1.5 text-sm font-bold text-pink-700">
                {duration}{' '}
                {duration === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Jewellery                                                           */}
        {/* ------------------------------------------------------------------ */}

        <section className="mt-5 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:mt-6 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50">
                <Gem className="h-5 w-5 text-pink-600" />
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Your Jewellery
                </h2>

                <p className="text-xs text-gray-400">
                  {invoice.items.length}{' '}
                  {invoice.items.length === 1
                    ? 'piece'
                    : 'pieces'}{' '}
                  reserved
                </p>
              </div>
            </div>
          </div>

          {/* Jewellery cards */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invoice.items.map(
              (item, index) => {
                const name =
                  item.itemName ||
                  'Jewellery Item';

                return (
                  <div
                    key={`${item.itemCode || 'item'}-${index}`}
                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-pink-100 hover:shadow-lg hover:shadow-pink-100/30"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50">
                      <JewelleryImage
                        image={item.image}
                        name={name}
                      />

                      {/* Image overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent opacity-60" />

                      {item.priceType && (
                        <div className="absolute left-3 top-3">
                          <span className="rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-gray-700 shadow-sm backdrop-blur">
                            {item.priceType === 'half'
                              ? 'Half Price'
                              : 'Full Price'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-sm font-bold leading-5 text-gray-900">
                        {name}
                      </h3>

                      <p className="mt-1 font-mono text-[10px] font-medium text-gray-400">
                        {item.itemCode || 'Item'}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-gray-50 p-2.5">
                          <p className="text-[10px] text-gray-400">
                            Rental
                          </p>

                          <p className="mt-0.5 text-xs font-bold text-gray-800">
                            {formatCurrency(
                              item.rentPrice
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-2.5">
                          <p className="text-[10px] text-gray-400">
                            Security
                          </p>

                          <p className="mt-0.5 text-xs font-bold text-gray-800">
                            {formatCurrency(
                              item.security
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Bottom section                                                      */}
        {/* ------------------------------------------------------------------ */}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] lg:mt-6">
          {/* Customer */}
          <section className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Booking Contact
                </h2>

                <p className="text-xs text-gray-400">
                  Your contact information
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-gray-50/70 p-4">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {invoice.customerPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-gray-50/70 p-4">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Address
                  </p>

                  <p className="mt-1 text-sm leading-5 text-gray-800">
                    {invoice.customerAddress ||
                      'No address provided'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Price summary */}
          <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-[#21131d] via-[#301b2c] to-[#432344] p-5 text-white sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Receipt className="h-5 w-5 text-pink-200" />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    Booking Summary
                  </p>

                  <h2 className="mt-0.5 text-base font-bold">
                    Payment Details
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Rental
                  </span>

                  <span className="font-semibold text-gray-900">
                    {formatCurrency(
                      invoice.totalRent
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Security Deposit
                  </span>

                  <span className="font-semibold text-gray-900">
                    {formatCurrency(
                      invoice.totalSecurity
                    )}
                  </span>
                </div>

                {invoice.rentDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Rent Discount
                    </span>

                    <span className="font-semibold text-emerald-600">
                      -{formatCurrency(
                        invoice.rentDiscount
                      )}
                    </span>
                  </div>
                )}

                {invoice.securityDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Security Discount
                    </span>

                    <span className="font-semibold text-emerald-600">
                      -{formatCurrency(
                        invoice.securityDiscount
                      )}
                    </span>
                  </div>
                )}

                {(invoice.additionalCharges || 0) >
                  0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Additional Charges
                    </span>

                    <span className="font-semibold text-orange-600">
                      +{formatCurrency(
                        invoice.additionalCharges
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="my-5 border-t border-dashed border-gray-200" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">
                  Total
                </span>

                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(
                    invoice.totalAmount
                  )}
                </span>
              </div>

              {invoice.advancePayment > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 p-3">
                  <span className="text-xs font-semibold text-emerald-700">
                    Advance Paid
                  </span>

                  <span className="text-sm font-bold text-emerald-700">
                    {formatCurrency(
                      invoice.advancePayment
                    )}
                  </span>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 p-3">
                <span className="text-sm font-semibold text-pink-700">
                  Balance Due
                </span>

                <span className="text-lg font-bold text-pink-700">
                  {formatCurrency(
                    invoice.balanceAmount
                  )}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Footer                                                              */}
        {/* ------------------------------------------------------------------ */}

        <footer className="mt-6 pb-6 text-center sm:pb-8">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />

            <p className="text-xs text-gray-400">
              Your booking details are securely stored.
            </p>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <span>Thank you for choosing</span>

            <span className="font-semibold text-pink-500">
              Belles Avenue
            </span>

            <Sparkles className="h-3 w-3 text-purple-400" />
          </div>
        </footer>
      </main>
    </div>
  );
}