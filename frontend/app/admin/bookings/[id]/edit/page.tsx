'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  User,
  Phone,
  MapPin,
  Calendar,
  Gem,
  Wallet,
  FileText,
  ShieldCheck,
  Search,
  X,
  Check,
  Loader2,
  ChevronDown,
  AlertCircle,
  Pencil,
  Hash,
  Users,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { checkBackendHealthWithRedirect } from '@/lib/backendHealth';

interface RentalItem {
  _id: string;
  itemCode: string;
  name: string;
  category: string;
  image?: string;
  rentPrice: number;
  halfRentPrice: number;
  securityDeposit: number;
  halfSecurityDeposit: number;
  supportsHalfPricing: boolean;
  status: 'available' | 'booked' | 'running';
}

interface BookingItem {
  itemId: string;
  itemName: string;
  itemCode: string;
  rentPrice: number;
  security: number;
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
  rentDiscount: number;
  securityDiscount: number;
  advancePayment: number;
  totalAmount: number;
  balanceAmount: number;
  status: string;
  createdBy: string;
  note?: string;
  additionalCharges?: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(value) || 0));

const formatDate = (value: string) => {
  if (!value) return '—';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
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

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();

  const bookingId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [items, setItems] = useState<RentalItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<BookingItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showItemPicker, setShowItemPicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    startDate: '',
    returnDate: '',
    rentDiscount: '',
    securityDiscount: '',
    advancePayment: '',
    bookingNumber: '',
    dealedStaff: '',
    note: '',
    additionalCharges: '',
  });

  /* ============================================================
     FETCH
  ============================================================ */

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchBooking();
    fetchAvailableItems();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const isConnected =
        await checkBackendHealthWithRedirect(router);

      if (!isConnected) return;

      const response = await api.get(
        `/bookings/${bookingId}`
      );

      const bookingData = response.data;

      setBooking(bookingData);

      const mappedItems = bookingData.items.map(
        (item: any) => ({
          itemId:
            typeof item.itemId === 'object'
              ? item.itemId._id
              : item.itemId,

          itemName:
            item.itemId?.name ||
            item.itemName,

          itemCode:
            item.itemId?.itemCode ||
            item.itemCode,

          rentPrice: item.rentPrice,

          security: item.security,

          priceType:
            item.priceType || 'full',
        })
      );

      setSelectedItems(mappedItems);

      setFormData({
        customerName: bookingData.customerName || '',
        phone: bookingData.phone || '',
        address: bookingData.address || '',

        startDate:
          bookingData.startDate?.split('T')[0] || '',

        returnDate:
          bookingData.returnDate?.split('T')[0] || '',

        rentDiscount:
          bookingData.rentDiscount?.toString() || '',

        securityDiscount:
          bookingData.securityDiscount?.toString() || '',

        advancePayment:
          bookingData.advancePayment?.toString() || '',

        bookingNumber:
          bookingData.bookingNumber || '',

        dealedStaff:
          bookingData.createdBy || '',

        note:
          bookingData.note || '',

        additionalCharges:
          bookingData.additionalCharges?.toString() || '',
      });
    } catch (error: any) {
      console.error(
        'Error fetching booking:',
        error
      );

      if (error.response?.status === 404) {
        toast.addToast({
          message: 'Booking not found',
          type: 'error',
        });

        router.push('/admin/bookings');
      } else {
        toast.addToast({
          message:
            error.response?.data?.error ||
            'Failed to load booking.',
          type: 'error',
        });
      }
    }
  };

  const fetchAvailableItems = async () => {
    try {
      const isConnected =
        await checkBackendHealthWithRedirect(router);

      if (!isConnected) return;

      const response = await api.get(
        '/bookings/fetchItems'
      );

      setItems(response.data);
    } catch (error) {
      console.error(
        'Error fetching items:',
        error
      );

      toast.addToast({
        message:
          'Failed to load available jewellery.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     ITEM SEARCH
  ============================================================ */

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const alreadySelected = selectedItems.some(
        (selected) =>
          selected.itemId === item._id
      );

      if (alreadySelected) return false;

      if (!query) return true;

      return (
        item.name
          .toLowerCase()
          .includes(query) ||
        item.itemCode
          .toLowerCase()
          .includes(query) ||
        item.category
          .toLowerCase()
          .includes(query)
      );
    });
  }, [items, searchQuery, selectedItems]);

  /* ============================================================
     ADD ITEM
  ============================================================ */

  const addItemToBooking = (
    item: RentalItem,
    priceType: 'full' | 'half'
  ) => {
    if (
      selectedItems.some(
        (selected) =>
          selected.itemId === item._id
      )
    ) {
      return;
    }

    const selectedPriceType =
      priceType === 'half' &&
      item.supportsHalfPricing
        ? 'half'
        : 'full';

    const newItem: BookingItem = {
      itemId: item._id,
      itemName: item.name,
      itemCode: item.itemCode,

      rentPrice:
        selectedPriceType === 'half'
          ? item.halfRentPrice
          : item.rentPrice,

      security:
        selectedPriceType === 'half'
          ? item.halfSecurityDeposit
          : item.securityDeposit,

      priceType: selectedPriceType,
    };

    setSelectedItems((current) => [
      ...current,
      newItem,
    ]);

    setSearchQuery('');
    setShowItemPicker(false);
  };

  /* ============================================================
     CHANGE PRICE TYPE
  ============================================================ */

  const changePriceType = (
    itemId: string,
    priceType: 'full' | 'half'
  ) => {
    setSelectedItems((current) =>
      current.map((selected) => {
        if (selected.itemId !== itemId) {
          return selected;
        }

        const rentalItem = items.find(
          (item) =>
            item._id === selected.itemId
        );

        if (!rentalItem) {
          return selected;
        }

        if (
          priceType === 'half' &&
          rentalItem.supportsHalfPricing
        ) {
          return {
            ...selected,
            priceType: 'half',
            rentPrice:
              rentalItem.halfRentPrice,
            security:
              rentalItem.halfSecurityDeposit,
          };
        }

        return {
          ...selected,
          priceType: 'full',
          rentPrice:
            rentalItem.rentPrice,
          security:
            rentalItem.securityDeposit,
        };
      })
    );
  };

  /* ============================================================
     REMOVE
  ============================================================ */

  const removeItemFromBooking = (
    itemId: string
  ) => {
    setSelectedItems((current) =>
      current.filter(
        (item) => item.itemId !== itemId
      )
    );
  };

  /* ============================================================
     TOTALS
  ============================================================ */

  const totalRent = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) =>
          sum + Number(item.rentPrice || 0),
        0
      ),
    [selectedItems]
  );

  const totalSecurity = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) =>
          sum + Number(item.security || 0),
        0
      ),
    [selectedItems]
  );

  const rentDiscount =
    Number(formData.rentDiscount || '0') || 0;

  const securityDiscount =
    Number(formData.securityDiscount || '0') || 0;

  const advancePayment =
    Number(formData.advancePayment || '0') || 0;

  const additionalCharges =
    Number(formData.additionalCharges || '0') || 0;

  const totalRentAfterDiscount =
    Math.max(
      0,
      totalRent - rentDiscount
    );

  const totalSecurityAfterDiscount =
    Math.max(
      0,
      totalSecurity - securityDiscount
    );

  const totalAmount =
    totalRentAfterDiscount +
    totalSecurityAfterDiscount +
    additionalCharges;

  const balanceAmount =
    totalAmount - advancePayment;

  /* ============================================================
     UPDATE FORM
  ============================================================ */

  const updateField = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* ============================================================
     VALIDATION
  ============================================================ */

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      toast.addToast({
        message: 'Please enter customer name.',
        type: 'error',
      });

      return false;
    }

    if (!formData.phone.trim()) {
      toast.addToast({
        message: 'Please enter phone number.',
        type: 'error',
      });

      return false;
    }

    if (!formData.address.trim()) {
      toast.addToast({
        message: 'Please enter customer address.',
        type: 'error',
      });

      return false;
    }

    if (!formData.startDate) {
      toast.addToast({
        message: 'Please select start date.',
        type: 'error',
      });

      return false;
    }

    if (!formData.returnDate) {
      toast.addToast({
        message: 'Please select return date.',
        type: 'error',
      });

      return false;
    }

    if (
      new Date(formData.returnDate) <
      new Date(formData.startDate)
    ) {
      toast.addToast({
        message:
          'Return date cannot be before start date.',
        type: 'error',
      });

      return false;
    }

    if (!formData.dealedStaff.trim()) {
      toast.addToast({
        message:
          'Please enter the staff member who dealt with this booking.',
        type: 'error',
      });

      return false;
    }

    if (selectedItems.length === 0) {
      toast.addToast({
        message:
          'Please add at least one jewellery item.',
        type: 'error',
      });

      return false;
    }

    if (advancePayment < 0) {
      toast.addToast({
        message:
          'Advance payment cannot be negative.',
        type: 'error',
      });

      return false;
    }

    return true;
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const bookingData = {
        bookingNumber:
          formData.bookingNumber || undefined,

        customerName:
          formData.customerName.trim(),

        phone:
          formData.phone.trim(),

        address:
          formData.address.trim(),

        items: selectedItems.map((item) => ({
          itemId: item.itemId,
          rentPrice: item.rentPrice,
          security: item.security,
          priceType:
            item.priceType,
        })),

        startDate:
          formData.startDate,

        returnDate:
          formData.returnDate,

        rentDiscount:
          Number(formData.rentDiscount) || 0,

        securityDiscount:
          Number(formData.securityDiscount) || 0,

        advancePayment:
          Number(formData.advancePayment) || 0,

        createdBy:
          formData.dealedStaff.trim(),

        note:
          formData.note || undefined,

        additionalCharges:
          Number(formData.additionalCharges) || 0,
      };

      await api.put(
        `/bookings/${bookingId}`,
        bookingData
      );

      toast.addToast({
        message:
          'Booking updated successfully!',
        type: 'success',
      });

      router.push('/admin/bookings');
    } catch (error: any) {
      console.error(
        'Error updating booking:',
        error
      );

      const errorMessage =
        error.response?.data?.error ||
        'Error updating booking';

      if (
        errorMessage.includes(
          'already booked from'
        )
      ) {
        toast.addToast({
          message:
            `Booking Conflict: ${errorMessage}`,
          type: 'error',
          duration: 8000,
        });
      } else if (
        errorMessage.includes(
          'not available'
        )
      ) {
        toast.addToast({
          message:
            `Item Unavailable: ${errorMessage}`,
          type: 'error',
          duration: 6000,
        });
      } else {
        toast.addToast({
          message: errorMessage,
          type: 'error',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8fb]">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#21131d] text-white shadow-xl">
            <Gem className="h-7 w-7" />
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading booking...
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     STATUS PROTECTION
  ============================================================ */

  if (booking.status !== 'booked') {
    return (
      <div className="min-h-screen bg-[#faf8fb]">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <Link
              href="/admin/bookings"
              className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Bookings
            </Link>
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h2 className="mt-5 font-serif text-2xl text-gray-950">
              Cannot Edit Booking
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Only bookings with{' '}
              <span className="font-semibold text-gray-700">
                "booked"
              </span>{' '}
              status can be edited.
            </p>

            <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
              Current status:{' '}
              <span className="font-semibold capitalize text-gray-800">
                {booking.status}
              </span>
            </div>

            <Link
              href="/admin/bookings"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#21131d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#33212e]"
            >
              Back to Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN UI
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#faf8fb] text-gray-900">
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/bookings"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
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

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Editing Booking
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-800">
              #{booking.bookingNumber}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* PAGE HEADING */}

        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400">
            <Link
              href="/admin/bookings"
              className="hover:text-gray-700"
            >
              Bookings
            </Link>

            <span>/</span>

            <span>Edit</span>

            <span>/</span>

            <span className="text-gray-700">
              #{booking.bookingNumber}
            </span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-3xl tracking-tight text-gray-950 sm:text-4xl">
                  Edit Booking
                </h1>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Booked
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                Update customer details, rental dates, jewellery,
                pricing and payment information.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <Pencil className="h-4 w-4 text-pink-500" />

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                  Booking
                </p>

                <p className="text-xs font-bold text-gray-800">
                  #{booking.bookingNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
            {/* ==================================================
                LEFT CONTENT
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
                        Customer and booking registration information.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  {/* BOOKING NUMBER */}

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Booking Register Number
                    </label>

                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        type="text"
                        value={formData.bookingNumber}
                        onChange={(e) =>
                          updateField(
                            'bookingNumber',
                            e.target.value
                          )
                        }
                        placeholder="Register number"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
                      />
                    </div>
                  </div>

                  {/* STAFF */}

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Dealed Staff
                    </label>

                    <div className="relative">
                      <Users className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        type="text"
                        value={formData.dealedStaff}
                        onChange={(e) =>
                          updateField(
                            'dealedStaff',
                            e.target.value
                          )
                        }
                        placeholder="Staff name"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
                      />
                    </div>
                  </div>

                  {/* CUSTOMER NAME */}

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Customer Name
                    </label>

                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) =>
                          updateField(
                            'customerName',
                            e.target.value
                          )
                        }
                        placeholder="Enter customer name"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
                      />
                    </div>
                  </div>

                  {/* PHONE */}

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Phone Number
                    </label>

                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          updateField(
                            'phone',
                            e.target.value
                          )
                        }
                        placeholder="9876543210"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
                      />
                    </div>
                  </div>

                  {/* ADDRESS */}

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Customer Address
                    </label>

                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-gray-400" />

                      <textarea
                        value={formData.address}
                        onChange={(e) =>
                          updateField(
                            'address',
                            e.target.value
                          )
                        }
                        required
                        rows={3}
                        placeholder="Enter complete customer address"
                        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
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
                        Modify the collection and expected return dates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Start Date
                      </label>

                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          updateField(
                            'startDate',
                            e.target.value
                          )
                        }
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Expected Return Date
                      </label>

                      <input
                        type="date"
                        value={formData.returnDate}
                        min={formData.startDate}
                        onChange={(e) =>
                          updateField(
                            'returnDate',
                            e.target.value
                          )
                        }
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-50"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
                    <Calendar className="h-4 w-4 shrink-0 text-purple-600" />

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-500">
                        Current rental period
                      </p>

                      <p className="mt-1 text-sm font-semibold text-purple-900">
                        {formatDate(formData.startDate)}
                        <span className="mx-2 text-purple-300">
                          →
                        </span>
                        {formatDate(formData.returnDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ITEMS */}

              <section className="overflow-visible rounded-3xl border border-gray-200/80 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                        <Gem className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="font-serif text-xl text-gray-950">
                          Manage Jewellery
                        </h2>

                        <p className="mt-0.5 text-xs text-gray-400">
                          Add, remove or change pricing for rental pieces.
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                      {selectedItems.length} items
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {/* SEARCH */}

                  <div className="relative">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Add Jewellery
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setShowItemPicker(
                          (current) => !current
                        )
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-left transition hover:border-gray-300 hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <Search className="h-4 w-4 text-gray-400" />

                        <span className="text-sm text-gray-400">
                          Search by item name or code...
                        </span>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition ${
                          showItemPicker
                            ? 'rotate-180'
                            : ''
                        }`}
                      />
                    </button>

                    {showItemPicker && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        <div className="border-b border-gray-100 p-3">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                            <input
                              autoFocus
                              type="text"
                              value={searchQuery}
                              onChange={(e) =>
                                setSearchQuery(
                                  e.target.value
                                )
                              }
                              placeholder="Search jewellery..."
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-pink-300 focus:bg-white"
                            />
                          </div>
                        </div>

                        <div className="max-h-[350px] overflow-y-auto p-2">
                          {filteredItems.length === 0 ? (
                            <div className="py-10 text-center">
                              <Gem className="mx-auto h-7 w-7 text-gray-300" />

                              <p className="mt-3 text-sm font-medium text-gray-600">
                                No available items
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                Try another search.
                              </p>
                            </div>
                          ) : (
                            filteredItems
                              .slice(0, 50)
                              .map((item) => {
                                const image =
                                  getImageUrl(
                                    item.image
                                  );

                                return (
                                  <div
                                    key={item._id}
                                    className="group flex gap-3 rounded-xl p-3 transition hover:bg-pink-50"
                                  >
                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                      {image ? (
                                        <img
                                          src={image}
                                          alt={item.name}
                                          className="h-full w-full object-cover"
                                          onError={(e) => {
                                            console.error('Image failed to load:', item.name, 'Original URL:', item.image, 'Processed URL:', image);
                                            const match = item.image?.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                                            if (match?.[1]) {
                                              const id = match[1];
                                              const fallbackUrl = `https://lh3.googleusercontent.com/d/${id}=w1000`;
                                              console.log('Trying fallback URL:', fallbackUrl);
                                              (e.currentTarget as HTMLImageElement).src = fallbackUrl;
                                            } else {
                                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                                            }
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

                                      <p className="mt-1 text-[11px] text-gray-400">
                                        {item.itemCode}
                                      </p>

                                      <p className="mt-1 text-[10px] text-gray-500">
                                        Full:{' '}
                                        {formatCurrency(
                                          item.rentPrice
                                        )}{' '}
                                        rent
                                      </p>

                                      <div className="mt-2 flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            addItemToBooking(
                                              item,
                                              'full'
                                            )
                                          }
                                          className="flex-1 rounded-lg bg-[#21131d] px-2 py-1.5 text-[10px] font-semibold text-white transition hover:bg-[#35222f]"
                                        >
                                          Add Full
                                        </button>

                                        {item.supportsHalfPricing && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              addItemToBooking(
                                                item,
                                                'half'
                                              )
                                            }
                                            className="flex-1 rounded-lg bg-pink-500 px-2 py-1.5 text-[10px] font-semibold text-white transition hover:bg-pink-600"
                                          >
                                            Add Half
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SELECTED */}

                  <div className="mt-5 space-y-3">
                    {selectedItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                          <Gem className="h-5 w-5" />
                        </div>

                        <p className="mt-4 font-serif text-lg text-gray-700">
                          No jewellery selected
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Add jewellery using the search above.
                        </p>
                      </div>
                    ) : (
                      selectedItems.map((selected) => {
                        const rentalItem =
                          items.find(
                            (item) =>
                              item._id ===
                              selected.itemId
                          );

                        const image =
                          getImageUrl(
                            rentalItem?.image
                          );

                        return (
                          <div
                            key={selected.itemId}
                            className="rounded-2xl border border-gray-200 p-3 sm:p-4"
                          >
                            <div className="flex gap-3">
                              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={selected.itemName}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      console.error('Image failed to load:', selected.itemName, 'Original URL:', rentalItem?.image, 'Processed URL:', image);
                                      const match = rentalItem?.image?.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                                      if (match?.[1]) {
                                        const id = match[1];
                                        const fallbackUrl = `https://lh3.googleusercontent.com/d/${id}=w1000`;
                                        console.log('Trying fallback URL:', fallbackUrl);
                                        (e.currentTarget as HTMLImageElement).src = fallbackUrl;
                                      } else {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Gem className="h-6 w-6 text-gray-300" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h3 className="truncate text-sm font-semibold text-gray-950">
                                      {selected.itemName}
                                    </h3>

                                    <p className="mt-1 text-[10px] text-gray-400">
                                      {selected.itemCode}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItemFromBooking(
                                        selected.itemId
                                      )
                                    }
                                    className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      changePriceType(
                                        selected.itemId,
                                        'full'
                                      )
                                    }
                                    className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition ${
                                      selected.priceType ===
                                      'full'
                                        ? 'bg-[#21131d] text-white'
                                        : 'border border-gray-200 bg-white text-gray-500'
                                    }`}
                                  >
                                    Full
                                    <span className="ml-1 opacity-70">
                                      {formatCurrency(
                                        rentalItem?.rentPrice ||
                                          selected.rentPrice
                                      )}
                                    </span>
                                  </button>

                                  {rentalItem?.supportsHalfPricing && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        changePriceType(
                                          selected.itemId,
                                          'half'
                                        )
                                      }
                                      className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition ${
                                        selected.priceType ===
                                        'half'
                                          ? 'bg-pink-500 text-white'
                                          : 'border border-gray-200 bg-white text-gray-500'
                                      }`}
                                    >
                                      Half
                                      <span className="ml-1 opacity-70">
                                        {formatCurrency(
                                          rentalItem.halfRentPrice
                                        )}
                                      </span>
                                    </button>
                                  )}
                                </div>

                                <div className="mt-3 flex gap-2">
                                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-[8px] font-semibold uppercase tracking-wider text-gray-400">
                                      Rent
                                    </p>

                                    <p className="mt-0.5 text-xs font-bold text-gray-800">
                                      {formatCurrency(
                                        selected.rentPrice
                                      )}
                                    </p>
                                  </div>

                                  <div className="rounded-lg bg-emerald-50 px-3 py-2">
                                    <p className="text-[8px] font-semibold uppercase tracking-wider text-emerald-500">
                                      Security
                                    </p>

                                    <p className="mt-0.5 text-xs font-bold text-emerald-800">
                                      {formatCurrency(
                                        selected.security
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>

              {/* NOTES */}

              <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-serif text-xl text-gray-950">
                        Admin Note
                      </h2>

                      <p className="mt-0.5 text-xs text-gray-400">
                        Internal information visible only to admins.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <textarea
                    value={formData.note}
                    onChange={(e) =>
                      updateField(
                        'note',
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Add booking notes, special requirements, item condition notes..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </section>
            </div>

            {/* ==================================================
                SUMMARY
            ================================================== */}

            <aside className="lg:sticky lg:top-[96px] lg:self-start">
              <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-gray-900/5">
                {/* SUMMARY HEADER */}

                <div className="bg-[#21131d] px-5 py-5 text-white sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Edit Summary
                      </p>

                      <h2 className="mt-1 font-serif text-2xl">
                        Booking
                      </h2>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Calculator className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {/* CUSTOMER */}

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm">
                        <User className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                          Customer
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                          {formData.customerName ||
                            'Customer name'}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-400">
                          {formData.phone ||
                            'Phone number'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* DATE */}

                  <div className="mt-4 rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />

                      <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                        Rental period
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] text-gray-400">
                          Start
                        </p>

                        <p className="mt-1 text-xs font-semibold">
                          {formatDate(
                            formData.startDate
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] text-gray-400">
                          Return
                        </p>

                        <p className="mt-1 text-xs font-semibold">
                          {formatDate(
                            formData.returnDate
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ITEMS */}

                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                        Jewellery
                      </p>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold text-gray-600">
                        {selectedItems.length}
                      </span>
                    </div>

                    <div className="max-h-[240px] space-y-2 overflow-y-auto">
                      {selectedItems.map((item) => (
                        <div
                          key={item.itemId}
                          className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
                            item.priceType === 'half'
                              ? 'bg-pink-50'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-gray-800">
                              {item.itemName}
                            </p>

                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="text-[9px] text-gray-400">
                                {item.itemCode}
                              </span>

                              <span className="rounded bg-white px-1.5 py-0.5 text-[8px] font-bold text-gray-500">
                                {item.priceType ===
                                'half'
                                  ? 'HALF'
                                  : 'FULL'}
                              </span>
                            </div>
                          </div>

                          <p className="shrink-0 text-xs font-bold">
                            {formatCurrency(
                              item.rentPrice
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FINANCIALS */}

                  <div className="my-5 border-t border-gray-100 pt-5">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          Total Rent
                        </span>

                        <span className="font-semibold text-gray-800">
                          {formatCurrency(
                            totalRent
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-500">
                          Rent Discount
                        </span>

                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            ₹
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              formData.rentDiscount
                            }
                            onChange={(e) =>
                              updateField(
                                'rentDiscount',
                                e.target.value
                              )
                            }
                            className="w-28 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-6 pr-2 text-right text-xs outline-none focus:border-pink-300 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          Total Security
                        </span>

                        <span className="font-semibold text-gray-800">
                          {formatCurrency(
                            totalSecurity
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-500">
                          Security Discount
                        </span>

                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            ₹
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              formData.securityDiscount
                            }
                            onChange={(e) =>
                              updateField(
                                'securityDiscount',
                                e.target.value
                              )
                            }
                            className="w-28 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-6 pr-2 text-right text-xs outline-none focus:border-pink-300 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-500">
                          Additional Charges
                        </span>

                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            ₹
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              formData.additionalCharges
                            }
                            onChange={(e) =>
                              updateField(
                                'additionalCharges',
                                e.target.value
                              )
                            }
                            className="w-28 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-6 pr-2 text-right text-xs outline-none focus:border-orange-300 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-500">
                              Total Amount
                            </p>

                            <p className="mt-1 text-[9px] text-gray-400">
                              After discounts & charges
                            </p>
                          </div>

                          <p className="text-2xl font-bold tracking-tight text-gray-950">
                            {formatCurrency(
                              totalAmount
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-3 py-3">
                        <div>
                          <p className="text-xs font-semibold text-blue-700">
                            Advance Payment
                          </p>

                          <p className="mt-0.5 text-[9px] text-blue-400">
                            Amount already received
                          </p>
                        </div>

                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-blue-400">
                            ₹
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={
                              formData.advancePayment
                            }
                            onChange={(e) =>
                              updateField(
                                'advancePayment',
                                e.target.value
                              )
                            }
                            className="w-28 rounded-lg border border-blue-100 bg-white py-2 pl-6 pr-2 text-right text-xs font-semibold text-blue-800 outline-none focus:border-blue-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BALANCE */}

                  <div className="rounded-2xl bg-[#21131d] p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
                          Balance Amount
                        </p>

                        <p className="mt-1 text-2xl font-bold">
                          {formatCurrency(
                            balanceAmount
                          )}
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
                          Returnable Security
                        </p>

                        <p className="mt-1 text-lg font-bold text-emerald-700">
                          {formatCurrency(
                            totalSecurityAfterDiscount
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* UPDATE */}

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
                        Updating Booking...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        Save Booking Changes
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
                    Saving changes may affect item availability and
                    booking balance.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </main>
    </div>
  );
}