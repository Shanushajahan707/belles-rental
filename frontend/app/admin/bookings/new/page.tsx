'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Gem,
  Loader2,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  User,
  Wallet,
  X,
  AlertCircle,
  FileText,
  Phone,
  MapPin,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { checkBackendHealthWithRedirect } from '@/lib/backendHealth';

interface RentalItem {
  _id: string;
  itemCode: string;
  barcode?: string;
  name: string;
  category: string;
  image?: string;
  rentPrice: number;
  halfRentPrice?: number;
  securityDeposit: number;
  halfSecurityDeposit?: number;
  purchasePrice?: number;
  supportsHalfPricing?: boolean;
  status?: 'available' | 'booked' | 'running' | 'sold_out';
}

interface SelectedItem {
  item: RentalItem;
  priceType: 'full' | 'half';
  rentPrice: number;
  security: number;
}

interface AvailabilityResult {
  itemCode?: string;
  available?: boolean;
  message?: string;
  item?: RentalItem;
  availabilityDetails?: {
    fullAvailable?: boolean;
    halfAvailable?: boolean;
  };
}

const categories = [
  'All',
  'Antique Choker',
  'Antique Second Necklace',
  'Antique Necklace Set (Choker + Second Necklace)',
  'Normal Choker',
  'Normal Second Necklace',
  'Normal Necklace Set (Choker + Second Necklace)',
  'AD Choker',
  'AD Second Necklace',
  'AD Necklace Set (Choker + Second Necklace)',
  'Chutty (Antique)',
  'Chutty (AD)',
  'Hip Chain',
  'Kerala Choker',
  'Kerala Second Necklace',
  'Kerala Necklace Set (Choker + Second Necklace)',
  'Hair Accessories',
  'Bangles (Antique)',
  'Bangles (AD)',
  'Earrings (Antique)',
  'Earchain (Antique)',
];

const todayString = () => new Date().toISOString().split('T')[0];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(value) || 0));

const formatDate = (value: string) => {
  if (!value) return '—';

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getImageUrl = (image?: string) => {
  if (!image) return '';

  if (image.includes('drive.google.com')) {
    const match = image.match(/\/file\/d\/([^/]+)/);

    if (match?.[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
  }

  return image;
};

export default function NewBookingPage() {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [allItems, setAllItems] = useState<RentalItem[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [staffName, setStaffName] = useState('');

  const [startDate, setStartDate] = useState(todayString());
  const [returnDate, setReturnDate] = useState(todayString());

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [rentDiscount, setRentDiscount] = useState('');
  const [securityDiscount, setSecurityDiscount] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('');

  const [note, setNote] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const [itemSearch, setItemSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showItemPicker, setShowItemPicker] = useState(false);

  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [availabilityResults, setAvailabilityResults] = useState<
    Record<string, AvailabilityResult>
  >({});

  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  /* ============================================================
     AUTH
  ============================================================ */

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/admin/login');
      return;
    }

    loadItems();
  }, []);

  /* ============================================================
     LOAD ITEMS
  ============================================================ */

  const loadItems = async () => {
    try {
      setLoading(true);

      const connected = await checkBackendHealthWithRedirect(router);

      if (!connected) return;

      const response = await api.get('/items?limit=10000');

      const items = Array.isArray(response.data)
        ? response.data
        : response.data.items || [];

      setAllItems(items);
    } catch (error: any) {
      console.error('Failed to load items:', error);

      toast.addToast({
        message:
          error?.response?.data?.error ||
          'Failed to load jewellery items.',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setLoadingItems(false);
    }
  };

  /* ============================================================
     FILTER ITEMS
  ============================================================ */

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase();

    return allItems.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.itemCode.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === 'All' ||
        item.category === selectedCategory;

      const alreadySelected = selectedItems.some(
        (selected) => selected.item._id === item._id
      );

      return matchesSearch && matchesCategory && !alreadySelected;
    });
  }, [allItems, itemSearch, selectedCategory, selectedItems]);

  /* ============================================================
     PRICING
  ============================================================ */

  const totals = useMemo(() => {
    const rent = selectedItems.reduce(
      (sum, item) => sum + Number(item.rentPrice || 0),
      0
    );

    const security = selectedItems.reduce(
      (sum, item) => sum + Number(item.security || 0),
      0
    );

    const rentDiscountValue = Math.min(
      rent,
      Math.max(0, Number(rentDiscount) || 0)
    );

    const securityDiscountValue = Math.min(
      security,
      Math.max(0, Number(securityDiscount) || 0)
    );

    const additionalChargesValue = Math.max(
      0,
      Number(additionalCharges) || 0
    );

    const advancePaymentValue = Math.max(
      0,
      Number(advancePayment) || 0
    );

    const netRent = Math.max(0, rent - rentDiscountValue);

    const netSecurity = Math.max(
      0,
      security - securityDiscountValue
    );

    const totalAmount =
      netRent +
      netSecurity +
      additionalChargesValue;

    const balanceAmount = Math.max(
      0,
      totalAmount - advancePaymentValue
    );

    return {
      rent,
      security,
      rentDiscount: rentDiscountValue,
      securityDiscount: securityDiscountValue,
      additionalCharges: additionalChargesValue,
      advancePayment: advancePaymentValue,
      netRent,
      netSecurity,
      totalAmount,
      balanceAmount,
    };
  }, [
    selectedItems,
    rentDiscount,
    securityDiscount,
    advancePayment,
    additionalCharges,
  ]);

  /* ============================================================
     DATE VALIDATION
  ============================================================ */

  const validateDates = () => {
    if (!startDate || !returnDate) {
      toast.addToast({
        message: 'Please select rental and return dates.',
        type: 'error',
      });

      return false;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${returnDate}T00:00:00`);
    const today = new Date(`${todayString()}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.addToast({
        message: 'Please enter valid dates.',
        type: 'error',
      });

      return false;
    }

    if (start < today) {
      toast.addToast({
        message: 'Rental start date cannot be in the past.',
        type: 'error',
      });

      return false;
    }

    if (end < start) {
      toast.addToast({
        message: 'Return date cannot be before the rental date.',
        type: 'error',
      });

      return false;
    }

    return true;
  };

  /* ============================================================
     AVAILABILITY
  ============================================================ */

  const checkAvailability = async () => {
    if (!validateDates()) return;

    if (selectedItems.length === 0) {
      toast.addToast({
        message: 'Please select at least one jewellery item.',
        type: 'error',
      });

      return;
    }

    try {
      setAvailabilityChecking(true);

      const results = await Promise.all(
        selectedItems.map(async (selected) => {
          const response = await api.get(
            '/bookings/check-availability',
            {
              params: {
                itemCode: selected.item.itemCode,
                startDate,
                endDate: returnDate,
              },
            }
          );

          return {
            itemCode: selected.item.itemCode,
            result: response.data,
          };
        })
      );

      const mapped: Record<string, AvailabilityResult> = {};

      results.forEach(({ itemCode, result }) => {
        mapped[itemCode] = result;
      });

      setAvailabilityResults(mapped);

      const unavailable = results.filter(
        ({ result }) => !result?.available
      );

      if (unavailable.length > 0) {
        toast.addToast({
          message: `${unavailable.length} selected item${
            unavailable.length > 1 ? 's are' : ' is'
          } unavailable for these dates.`,
          type: 'error',
        });
      } else {
        toast.addToast({
          message: 'All selected items are available.',
          type: 'success',
        });
      }
    } catch (error: any) {
      console.error('Availability check failed:', error);

      toast.addToast({
        message:
          error?.response?.data?.error ||
          'Failed to check item availability.',
        type: 'error',
      });
    } finally {
      setAvailabilityChecking(false);
    }
  };

  /* ============================================================
     ADD ITEM
  ============================================================ */

  const addItem = (item: RentalItem) => {
    if (selectedItems.some((selected) => selected.item._id === item._id)) {
      return;
    }

    setSelectedItems((current) => [
      ...current,
      {
        item,
        priceType: 'full',
        rentPrice: Number(item.rentPrice || 0),
        security: Number(item.securityDeposit || 0),
      },
    ]);

    setAvailabilityResults((current) => {
      const copy = { ...current };
      delete copy[item.itemCode];
      return copy;
    });

    setItemSearch('');
    setShowItemPicker(false);
  };

  /* ============================================================
     REMOVE ITEM
  ============================================================ */

  const removeItem = (itemId: string) => {
    setSelectedItems((current) =>
      current.filter((selected) => selected.item._id !== itemId)
    );
  };

  /* ============================================================
     PRICE TYPE
  ============================================================ */

  const changePriceType = (
    itemId: string,
    priceType: 'full' | 'half'
  ) => {
    setSelectedItems((current) =>
      current.map((selected) => {
        if (selected.item._id !== itemId) {
          return selected;
        }

        const item = selected.item;

        if (priceType === 'half') {
          return {
            ...selected,
            priceType,
            rentPrice: Number(item.halfRentPrice || item.rentPrice || 0),
            security: Number(
              item.halfSecurityDeposit || item.securityDeposit || 0
            ),
          };
        }

        return {
          ...selected,
          priceType,
          rentPrice: Number(item.rentPrice || 0),
          security: Number(item.securityDeposit || 0),
        };
      })
    );
  };

  /* ============================================================
     SUBMIT BOOKING
  ============================================================ */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!customerName.trim()) {
      toast.addToast({
        message: 'Please enter the customer name.',
        type: 'error',
      });

      return;
    }

    if (!phone.trim()) {
      toast.addToast({
        message: 'Please enter the customer phone number.',
        type: 'error',
      });

      return;
    }

    if (!address.trim()) {
      toast.addToast({
        message: 'Please enter the customer address.',
        type: 'error',
      });

      return;
    }

    if (!staffName.trim()) {
      toast.addToast({
        message: 'Please enter the staff name.',
        type: 'error',
      });

      return;
    }

    if (!validateDates()) return;

    if (selectedItems.length === 0) {
      toast.addToast({
        message: 'Please select at least one jewellery item.',
        type: 'error',
      });

      return;
    }

    try {
      setSubmitting(true);

      /*
       * Check availability once more immediately before creation.
       */
      const availabilityChecks = await Promise.all(
        selectedItems.map(async (selected) => {
          const response = await api.get(
            '/bookings/check-availability',
            {
              params: {
                itemCode: selected.item.itemCode,
                startDate,
                endDate: returnDate,
              },
            }
          );

          return response.data;
        })
      );

      const unavailable = availabilityChecks.some(
        (result) => !result?.available
      );

      if (unavailable) {
        toast.addToast({
          message:
            'One or more selected items are no longer available for these dates.',
          type: 'error',
        });

        setAvailabilityChecking(false);
        return;
      }

      /*
       * Booking payload.
       *
       * This follows the booking data structure used elsewhere
       * in your project:
       * customerName, phone, address, items, dates,
       * rentDiscount, securityDiscount, advancePayment,
       * additionalCharges and note.
       */
      const payload = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        createdBy: staffName.trim(),

        items: selectedItems.map((selected) => ({
          itemId: selected.item._id,
          itemName: selected.item.name,
          itemCode: selected.item.itemCode,
          rentPrice: selected.rentPrice,
          security: selected.security,
          priceType: selected.priceType,
        })),

        startDate,
        returnDate,

        rentDiscount: totals.rentDiscount,
        securityDiscount: totals.securityDiscount,
        advancePayment: totals.advancePayment,
        additionalCharges: totals.additionalCharges,

        discount:
          totals.rentDiscount + totals.securityDiscount,

        totalAmount: totals.totalAmount,
        balanceAmount: totals.balanceAmount,

        note: [note.trim(), adminNote.trim()].filter(Boolean).join('\n\n---\n\n'),
      };

      await api.post('/bookings', payload);

      toast.addToast({
        message: 'Booking created successfully!',
        type: 'success',
      });

      router.push('/admin/bookings');
    } catch (error: any) {
      console.error('Error creating booking:', error);

      toast.addToast({
        message:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Failed to create booking. Please try again.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8fb]">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#21131d] text-white shadow-xl">
            <Gem className="h-7 w-7" />
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing booking workspace...
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#faf8fb] text-gray-900">
      {/* ======================================================
          TOP HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/bookings"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
              aria-label="Back to bookings"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="hidden h-8 w-px bg-gray-200 sm:block" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#21131d] text-white shadow-lg">
                <Gem className="h-5 w-5" />
              </div>

              <div>
                <p className="font-serif text-lg leading-none tracking-wide text-gray-950">
                  Belles Avenue
                </p>

                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Admin Studio
                </p>
              </div>
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Bookings
            </p>

            <p className="mt-1 text-sm font-medium text-gray-700">
              New reservation
            </p>
          </div>
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}

        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400">
            <Link
              href="/admin/bookings"
              className="transition hover:text-gray-700"
            >
              Bookings
            </Link>

            <span>/</span>

            <span className="text-gray-700">New Booking</span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl tracking-tight text-gray-950 sm:text-4xl">
                  Create New Booking
                </h1>

                <span className="hidden rounded-full border border-pink-100 bg-pink-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-pink-600 sm:inline-flex">
                  Rental
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Create a jewellery rental reservation, select the required
                pieces, confirm availability and collect payment details.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>

              <span className="text-xs font-semibold text-emerald-700">
                Booking workspace ready
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
            {/* ==================================================
                LEFT
            ================================================== */}

            <div className="space-y-6">
              {/* CUSTOMER */}

              <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                      <User className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-serif text-xl text-gray-950">
                        Customer Details
                      </h2>

                      <p className="mt-0.5 text-xs text-gray-400">
                        Enter the customer information for this reservation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Customer Name
                    </label>

                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Phone Number
                    </label>

                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="address"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Address
                    </label>

                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-gray-400" />

                      <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter complete customer address"
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="staffName"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Staff Name
                    </label>

                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        id="staffName"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="Enter staff name handling this booking"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* DATES */}

              <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <Calendar className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-serif text-xl text-gray-950">
                        Rental Period
                      </h2>

                      <p className="mt-0.5 text-xs text-gray-400">
                        Choose when the jewellery will be collected and
                        returned.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="startDate"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        Rental Start
                      </label>

                      <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        min={todayString()}
                        onChange={(e) => {
                          setStartDate(e.target.value);

                          if (returnDate < e.target.value) {
                            setReturnDate(e.target.value);
                          }

                          setAvailabilityResults({});
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="returnDate"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        Return Date
                      </label>

                      <input
                        id="returnDate"
                        type="date"
                        value={returnDate}
                        min={startDate || todayString()}
                        onChange={(e) => {
                          setReturnDate(e.target.value);
                          setAvailabilityResults({});
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-purple-100 bg-purple-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />

                      <div>
                        <p className="text-xs font-semibold text-purple-900">
                          Rental period
                        </p>

                        <p className="mt-1 text-sm text-purple-700">
                          {formatDate(startDate)}{' '}
                          <span className="mx-1 text-purple-300">→</span>{' '}
                          {formatDate(returnDate)}
                        </p>
                      </div>
                    </div>

              
                  </div>
                </div>
              </section>

              {/* JEWELLERY */}

              <section className="overflow-visible rounded-3xl border border-gray-200/80 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                        <Gem className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="font-serif text-xl text-gray-950">
                          Jewellery Selection
                        </h2>

                        <p className="mt-0.5 text-xs text-gray-400">
                          Select the pieces required for this rental.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                      {selectedItems.length} selected
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {/* ITEM PICKER */}

                  <div className="relative">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Add Jewellery
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setShowItemPicker((current) => !current)
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-left transition hover:border-gray-300 hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-400 shadow-sm">
                          <Search className="h-4 w-4" />
                        </div>

                        <span className="text-sm text-gray-400">
                          Search jewellery by name or item code...
                        </span>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition ${
                          showItemPicker ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showItemPicker && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        <div className="border-b border-gray-100 p-3">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                            <input
                              autoFocus
                              value={itemSearch}
                              onChange={(e) =>
                                setItemSearch(e.target.value)
                              }
                              placeholder="Search item..."
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-pink-300 focus:bg-white"
                            />
                          </div>

                          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                            {['All', ...categories.filter((c) => c !== 'All').slice(0, 8)].map(
                              (category) => (
                                <button
                                  key={category}
                                  type="button"
                                  onClick={() =>
                                    setSelectedCategory(category)
                                  }
                                  className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                                    selectedCategory === category
                                      ? 'bg-[#21131d] text-white'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                >
                                  {category}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <div className="max-h-[360px] overflow-y-auto p-2">
                          {loadingItems ? (
                            <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading jewellery...
                            </div>
                          ) : filteredItems.length === 0 ? (
                            <div className="py-10 text-center">
                              <Gem className="mx-auto h-7 w-7 text-gray-300" />
                              <p className="mt-3 text-sm font-medium text-gray-600">
                                No jewellery found
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                Try another search or category.
                              </p>
                            </div>
                          ) : (
                            filteredItems.slice(0, 50).map((item) => {
                              const image = getImageUrl(item.image);

                              return (
                                <button
                                  key={item._id}
                                  type="button"
                                  onClick={() => addItem(item)}
                                  className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-pink-50"
                                >
                                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                    {image ? (
                                      <img
                                        src={image}
                                        alt={item.name}
                                        className="h-full w-full object-cover transition group-hover:scale-105"
                                        onError={(e) => {
                                          (
                                            e.currentTarget as HTMLImageElement
                                          ).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center">
                                        <Gem className="h-5 w-5 text-gray-300" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-900">
                                      {item.name}
                                    </p>

                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                      <span className="text-[11px] font-medium text-gray-400">
                                        {item.itemCode}
                                      </span>

                                      <span className="h-1 w-1 rounded-full bg-gray-300" />

                                      <span className="truncate text-[11px] text-gray-400">
                                        {item.category}
                                      </span>
                                    </div>

                                    <p className="mt-1 text-[11px] text-gray-500">
                                      Rent {formatCurrency(item.rentPrice)}
                                      {' · '}
                                      Security{' '}
                                      {formatCurrency(item.securityDeposit)}
                                    </p>
                                  </div>

                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-[#21131d] group-hover:text-white">
                                    <Plus className="h-4 w-4" />
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SELECTED ITEMS */}

                  {selectedItems.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-6 py-12 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                        <ShoppingBag className="h-5 w-5" />
                      </div>

                      <h3 className="mt-4 font-serif text-lg text-gray-700">
                        No jewellery selected
                      </h3>

                      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-gray-400">
                        Use the search above to add jewellery to this booking.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {selectedItems.map((selected) => {
                        const item = selected.item;
                        const image = getImageUrl(item.image);
                        const availability =
                          availabilityResults[item.itemCode];

                        return (
                          <div
                            key={item._id}
                            className="rounded-2xl border border-gray-200 bg-white p-3 transition hover:border-gray-300 sm:p-4"
                          >
                            <div className="flex gap-3 sm:gap-4">
                              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      (
                                        e.currentTarget as HTMLImageElement
                                      ).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Gem className="h-7 w-7 text-gray-300" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="truncate text-sm font-semibold text-gray-950 sm:text-base">
                                      {item.name}
                                    </h3>

                                    <p className="mt-1 text-[11px] text-gray-400">
                                      Code: {item.itemCode}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItem(item._id)
                                    }
                                    className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                    aria-label={`Remove ${item.name}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      changePriceType(item._id, 'full')
                                    }
                                    className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${
                                      selected.priceType === 'full'
                                        ? 'border-[#21131d] bg-[#21131d] text-white'
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                    }`}
                                  >
                                    Full Set
                                    <span className="ml-1.5 opacity-70">
                                      {formatCurrency(item.rentPrice)}
                                    </span>
                                  </button>

                                  {item.supportsHalfPricing && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        changePriceType(item._id, 'half')
                                      }
                                      className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${
                                        selected.priceType === 'half'
                                          ? 'border-pink-500 bg-pink-500 text-white'
                                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                      }`}
                                    >
                                      Half Set
                                      <span className="ml-1.5 opacity-70">
                                        {formatCurrency(
                                          item.halfRentPrice || 0
                                        )}
                                      </span>
                                    </button>
                                  )}
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-sm">
                                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                                    <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                                      Rent
                                    </p>

                                    <p className="mt-0.5 text-xs font-semibold text-gray-800">
                                      {formatCurrency(
                                        selected.rentPrice
                                      )}
                                    </p>
                                  </div>

                                  <div className="rounded-xl bg-emerald-50 px-3 py-2">
                                    <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-500">
                                      Security
                                    </p>

                                    <p className="mt-0.5 text-xs font-semibold text-emerald-800">
                                      {formatCurrency(
                                        selected.security
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {availability && (
                                  <div
                                    className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${
                                      availability.available
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-red-50 text-red-700'
                                    }`}
                                  >
                                    {availability.available ? (
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                    ) : (
                                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    )}

                                    <span>
                                      {availability.message ||
                                        (availability.available
                                          ? 'Available for selected dates.'
                                          : 'Not available for selected dates.')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* DISCOUNTS */}

              <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Wallet className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-serif text-xl text-gray-950">
                        Pricing & Payment
                      </h2>

                      <p className="mt-0.5 text-xs text-gray-400">
                        Apply discounts and record payment details.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  <div>
                    <label
                      htmlFor="rentDiscount"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Rent Discount
                    </label>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                        ₹
                      </span>

                      <input
                        id="rentDiscount"
                        type="number"
                        min="0"
                        value={rentDiscount}
                        onChange={(e) =>
                          setRentDiscount(e.target.value)
                        }
                        placeholder="0"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-8 pr-4 text-sm text-gray-900 outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="securityDiscount"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Security Discount
                    </label>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                        ₹
                      </span>

                      <input
                        id="securityDiscount"
                        type="number"
                        min="0"
                        value={securityDiscount}
                        onChange={(e) =>
                          setSecurityDiscount(e.target.value)
                        }
                        placeholder="0"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-8 pr-4 text-sm text-gray-900 outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="advancePayment"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Advance Payment
                    </label>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                        ₹
                      </span>

                      <input
                        id="advancePayment"
                        type="number"
                        min="0"
                        value={advancePayment}
                        onChange={(e) =>
                          setAdvancePayment(e.target.value)
                        }
                        placeholder="0"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-8 pr-4 text-sm text-gray-900 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="additionalCharges"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Additional Charges
                    </label>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                        ₹
                      </span>

                      <input
                        id="additionalCharges"
                        type="number"
                        min="0"
                        value={additionalCharges}
                        onChange={(e) =>
                          setAdditionalCharges(e.target.value)
                        }
                        placeholder="0"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-8 pr-4 text-sm text-gray-900 outline-none focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-50"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* NOTE */}

              <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-serif text-xl text-gray-950">
                        Booking Note
                      </h2>

                      <p className="mt-0.5 text-xs text-gray-400">
                        Add an internal note for your team if required.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    placeholder="Add any special instructions, customer notes or internal information..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </section>

              {/* ADMIN NOTE */}

              <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-serif text-xl text-gray-950">
                        Admin Note
                      </h2>

                      <p className="mt-0.5 text-xs text-gray-400">
                        Add administrative notes for management purposes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={4}
                    placeholder="Add administrative notes, special conditions, or management instructions..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-50"
                  />
                </div>
              </section>
            </div>

            {/* ==================================================
                RIGHT SUMMARY
            ================================================== */}

            <aside className="lg:sticky lg:top-[96px] lg:self-start">
              <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-gray-900/5">
                <div className="bg-[#21131d] px-5 py-5 text-white sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Booking Summary
                      </p>

                      <h2 className="mt-1 font-serif text-2xl">
                        Reservation
                      </h2>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {/* CUSTOMER MINI */}

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm">
                        <User className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Customer
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                          {customerName || 'Customer name'}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {phone || 'Phone number'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* STAFF MINI */}

                  <div className="mt-3 rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shadow-sm">
                        <User className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Staff
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                          {staffName || 'Staff name'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* DATES */}

                  <div className="mt-4 rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />

                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Rental period
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-gray-400">
                          Start
                        </p>

                        <p className="mt-1 text-xs font-semibold text-gray-800">
                          {formatDate(startDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-400">
                          Return
                        </p>

                        <p className="mt-1 text-xs font-semibold text-gray-800">
                          {formatDate(returnDate)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-500" />

                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Staff
                        </p>
                      </div>

                      <p className="mt-1 text-xs font-semibold text-gray-800">
                        {staffName || 'Not assigned'}
                      </p>
                    </div>
                  </div>

                  {/* ITEMS */}

                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Jewellery
                      </p>

                      <span className="text-xs font-semibold text-gray-500">
                        {selectedItems.length}
                      </span>
                    </div>

                    {selectedItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center">
                        <Gem className="mx-auto h-5 w-5 text-gray-300" />

                        <p className="mt-2 text-xs text-gray-400">
                          No items selected
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedItems.map((selected) => (
                          <div
                            key={selected.item._id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-800">
                                {selected.item.name}
                              </p>

                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="text-[9px] text-gray-400">
                                  {selected.item.itemCode}
                                </span>

                                <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold text-gray-500">
                                  {selected.priceType === 'half'
                                    ? 'HALF'
                                    : 'FULL'}
                                </span>
                              </div>
                            </div>

                            <p className="shrink-0 text-xs font-semibold text-gray-900">
                              {formatCurrency(selected.rentPrice)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PRICE */}

                  <div className="my-5 border-t border-gray-100 pt-5">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Total rent
                        </span>

                        <span className="font-medium text-gray-800">
                          {formatCurrency(totals.rent)}
                        </span>
                      </div>

                      {totals.rentDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Rent discount
                          </span>

                          <span className="font-medium text-emerald-600">
                            - {formatCurrency(totals.rentDiscount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Security deposit
                        </span>

                        <span className="font-medium text-gray-800">
                          {formatCurrency(totals.security)}
                        </span>
                      </div>

                      {totals.securityDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Security discount
                          </span>

                          <span className="font-medium text-emerald-600">
                            - {formatCurrency(
                              totals.securityDiscount
                            )}
                          </span>
                        </div>
                      )}

                      {totals.additionalCharges > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Additional charges
                          </span>

                          <span className="font-medium text-orange-600">
                            + {formatCurrency(
                              totals.additionalCharges
                            )}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs font-semibold text-gray-500">
                              Total amount
                            </p>

                            <p className="mt-1 text-[10px] text-gray-400">
                              Rent + security + charges
                            </p>
                          </div>

                          <p className="text-2xl font-bold tracking-tight text-gray-950">
                            {formatCurrency(totals.totalAmount)}
                          </p>
                        </div>
                      </div>

                      {totals.advancePayment > 0 && (
                        <div className="flex justify-between rounded-xl bg-blue-50 px-3 py-2.5">
                          <span className="text-xs font-medium text-blue-700">
                            Advance paid
                          </span>

                          <span className="text-xs font-bold text-blue-800">
                            - {formatCurrency(
                              totals.advancePayment
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BALANCE */}

                  <div className="rounded-2xl bg-[#21131d] p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                          Balance due
                        </p>

                        <p className="mt-1 text-xl font-bold">
                          {formatCurrency(totals.balanceAmount)}
                        </p>
                      </div>

                      <Wallet className="h-5 w-5 text-white/50" />
                    </div>
                  </div>

                  {/* SECURITY */}

                  <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600">
                        <ShieldCheck className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-emerald-800">
                          Returnable security
                        </p>

                        <p className="mt-1 text-lg font-bold text-emerald-700">
                          {formatCurrency(totals.netSecurity)}
                        </p>

                        <p className="mt-1 text-[10px] leading-4 text-emerald-600">
                          Refundable when the jewellery is returned
                          without damage or loss.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT */}

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      selectedItems.length === 0
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#21131d] to-[#392031] px-5 py-4 text-sm font-semibold text-white shadow-xl shadow-gray-950/15 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating Booking...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        Create Booking
                      </>
                    )}
                  </button>

                  <Link
                    href="/admin/bookings"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Link>

                  <p className="mt-4 text-center text-[10px] leading-4 text-gray-400">
                    Please verify customer details, dates and jewellery
                    availability before creating the reservation.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </main>

      {/* ======================================================
          MOBILE SUMMARY BAR
      ====================================================== */}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden">
        {mobileSummaryOpen && (
          <div className="mb-3 max-h-[60vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-gray-950">
                Booking Summary
              </h3>

              <button
                type="button"
                onClick={() => setMobileSummaryOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Rent</span>
                <span className="font-medium">
                  {formatCurrency(totals.rent)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Security</span>
                <span className="font-medium">
                  {formatCurrency(totals.security)}
                </span>
              </div>

              {totals.rentDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Rent discount</span>
                  <span>
                    - {formatCurrency(totals.rentDiscount)}
                  </span>
                </div>
              )}

              {totals.securityDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Security discount</span>
                  <span>
                    - {formatCurrency(
                      totals.securityDiscount
                    )}
                  </span>
                </div>
              )}

              {totals.additionalCharges > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Additional charges</span>
                  <span>
                    + {formatCurrency(
                      totals.additionalCharges
                    )}
                  </span>
                </div>
              )}

              <div className="mt-3 flex justify-between border-t border-gray-100 pt-3">
                <span className="font-semibold">
                  Total amount
                </span>

                <span className="text-lg font-bold">
                  {formatCurrency(totals.totalAmount)}
                </span>
              </div>

              {totals.advancePayment > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Advance</span>
                  <span>
                    - {formatCurrency(totals.advancePayment)}
                  </span>
                </div>
              )}

              <div className="flex justify-between rounded-xl bg-gray-950 px-3 py-3 text-white">
                <span className="font-medium">Balance</span>

                <span className="font-bold">
                  {formatCurrency(totals.balanceAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setMobileSummaryOpen((current) => !current)
            }
            className="flex min-w-0 flex-1 items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
          >
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Total
              </p>

              <p className="mt-0.5 truncate text-base font-bold text-gray-950">
                {formatCurrency(totals.totalAmount)}
              </p>
            </div>

            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition ${
                mobileSummaryOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <button
            type="submit"
            form=""
            onClick={() => {
              const form = document.querySelector('form');

              if (form) {
                form.requestSubmit();
              }
            }}
            disabled={
              submitting ||
              selectedItems.length === 0
            }
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#21131d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}

            <span className="hidden xs:inline">
              {submitting ? 'Creating' : 'Create'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile bottom spacing */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}