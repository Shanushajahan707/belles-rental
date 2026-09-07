'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/config';
import { Search, Filter, Gem, CheckCircle, Clock, XCircle, X, ArrowUpDown } from 'lucide-react';
import { checkBackendHealth, getCachedBackendStatus } from '@/lib/backendHealth';
import { format } from 'date-fns';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import SkeletonCard from '@/components/SkeletonCard';

interface RentalItem {
  _id: string;
  itemCode: string;
  name: string;
  category: string;
  image: string;
  rentPrice: number;
  halfRentPrice: number;
  securityDeposit: number;
  halfSecurityDeposit: number;
  supportsHalfPricing: boolean;
  status: 'available' | 'booked' | 'running' | 'sold_out';
}

interface BookingInfo {
  bookingNumber: string;
  startDate: string;
  returnDate: string;
  status: string;
  priceType?: 'full' | 'half';
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

// Query function to fetch items
const fetchItems = async (): Promise<RentalItem[]> => {
  const backendStatus = await checkBackendHealth();
  if (backendStatus === 'disconnected') {
    throw new Error('Backend is not reachable. Please check your connection or try again in 50 seconds.');
  }

  const response = await fetch(`${API_URL}/items?limit=10000`);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unable to load rentals right now. Please refresh or contact support.');
    }
    throw new Error(`Failed to load items: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.items || []);
};

// Query function to fetch booking info for a specific item
const fetchBookingInfo = async (itemId: string): Promise<BookingInfo[]> => {
  const response = await fetch(`${API_URL}/bookings/public/item/${itemId}`);
  if (!response.ok) {
    console.error(`Booking fetch failed for item ${itemId}:`, response.status);
    return [];
  }

  const bookingData = await response.json();
  const bookingArray = Array.isArray(bookingData) ? bookingData : [bookingData];

  return bookingArray.map((booking: any) => ({
    bookingNumber: booking.bookingNumber,
    customerName: booking.customerName,
    startDate: booking.startDate,
    returnDate: booking.returnDate,
    status: booking.status,
    priceType: booking.items?.find((bookingItem: any) =>
      (bookingItem.itemId?.toString() === itemId.toString()) ||
      (bookingItem.itemId?._id?.toString() === itemId.toString())
    )?.priceType || 'full',
  }));
};

export default function RentalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'availability'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const itemsPerPage = 12;

  // ============================================================
  // FETCH ITEMS
  // ============================================================

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
    staleTime: 60000,
  });

  // ============================================================
  // FETCH BOOKING INFORMATION
  // ============================================================

  const bookedItems = items.filter(
    (item: RentalItem) =>
      item.status === 'booked' ||
      item.status === 'running'
  );

  const { data: bookingInfo = {} } = useQuery({
    queryKey: [
      'bookingInfo',
      bookedItems.map((item: RentalItem) => item._id),
    ],

    queryFn: async () => {
      const bookingPromises = bookedItems.map(
        async (item: RentalItem) => {
          try {
            const bookings = await fetchBookingInfo(item._id);

            console.log(`Bookings for item ${item.itemCode} (${item._id}):`, bookings);

            return {
              itemId: item._id,
              bookings,
            };
          } catch (error) {
            console.error(
              `Error fetching booking for item ${item._id}:`,
              error
            );

            return {
              itemId: item._id,
              bookings: [],
            };
          }
        }
      );

      const results = await Promise.all(bookingPromises);

      const bookingsMap: {
        [itemId: string]: BookingInfo[];
      } = {};

      results.forEach((result) => {
        bookingsMap[result.itemId] = result.bookings;
      });

      console.log('Final booking info map:', bookingsMap);

      return bookingsMap;
    },

    enabled: bookedItems.length > 0,
    staleTime: 60000,
  });

  // ============================================================
  // IMAGE URL
  // ============================================================

const getImageUrl = (img: string) => {
  if (!img) return '';

  if (img.includes('drive.google.com')) {
    // Extract file ID from various Google Drive URL formats
    const match = img.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match?.[1]) {
      const id = match[1];
      console.log('Extracted Google Drive ID:', id, 'from URL:', img);
      
      // Use the thumbnail format which is more reliable
      return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
    }
  }

  return img;
};

  // ============================================================
  // FILTER + SORT
  // ============================================================

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(
        (item) => item.category === selectedCategory
      );
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(
        (item) =>
          item.status === selectedStatus.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const search = searchQuery
        .trim()
        .toLowerCase();

      filtered = filtered.filter((item) =>
        item.itemCode
          .toLowerCase()
          .includes(search)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return sortOrder === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);

        case 'price':
          return sortOrder === 'asc'
            ? a.rentPrice - b.rentPrice
            : b.rentPrice - a.rentPrice;

        case 'availability': {
          const statusOrder: Record<
            string,
            number
          > = {
            available: 0,
            booked: 1,
            running: 2,
            sold_out: 3,
          };

          return sortOrder === 'asc'
            ? statusOrder[a.status] -
            statusOrder[b.status]
            : statusOrder[b.status] -
            statusOrder[a.status];
        }

        default:
          return 0;
      }
    });

    return filtered;
  }, [
    items,
    searchQuery,
    selectedCategory,
    selectedStatus,
    sortBy,
    sortOrder,
  ]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(
    filteredItems.length / itemsPerPage
  );

  // ============================================================
  // HELPERS
  // ============================================================

  const getCategoryIcon = (category: string) => {
    if (category.includes('Choker')) return '📿';
    if (category.includes('Necklace')) return '💎';

    if (
      category.includes('Earring') ||
      category.includes('Earchain')
    ) {
      return '✨';
    }

    if (category.includes('Bangles')) return '⭕';
    if (category.includes('Chutty')) return '🌸';
    if (category.includes('Hip Chain')) return '🔗';
    if (category.includes('Hair')) return '🎀';
    if (category.includes('Kerala')) return '🪷';

    return '💍';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return {
          label: 'Available',
          icon: CheckCircle,
          className:
            'bg-emerald-50 text-emerald-700 border-emerald-100',
          dot: 'bg-emerald-500',
        };

      case 'booked':
        return {
          label: 'Booked',
          icon: Clock,
          className:
            'bg-amber-50 text-amber-700 border-amber-100',
          dot: 'bg-amber-500',
        };

      case 'running':
        return {
          label: 'Currently Rented',
          icon: Clock,
          className:
            'bg-blue-50 text-blue-700 border-blue-100',
          dot: 'bg-blue-500',
        };

      case 'sold_out':
        return {
          label: 'Sold Out',
          icon: XCircle,
          className:
            'bg-red-50 text-red-700 border-red-100',
          dot: 'bg-red-500',
        };

      default:
        return {
          label: status,
          icon: Clock,
          className:
            'bg-gray-50 text-gray-700 border-gray-100',
          dot: 'bg-gray-400',
        };
    }
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedCategory !== 'All' ||
    selectedStatus !== 'All';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setCurrentPage(1);
  };

  const formatBookingDate = (
    dateString?: string
  ) => {
    if (!dateString) {
      return 'Date unavailable';
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return format(date, 'd MMM yyyy');
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfafb] text-gray-900">

        <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">

            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 shadow-sm">
                <Gem className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="font-serif text-xl font-semibold tracking-wide text-gray-900">
                  Belles Avenue
                </p>

                <p className="hidden text-[10px] uppercase tracking-[0.25em] text-gray-400 sm:block">
                  Jewellery Rentals
                </p>
              </div>
            </Link>

            <Link
              href="/"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-pink-600"
            >
              Home
            </Link>

          </div>
        </nav>



        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {Array.from({ length: 8 }).map(
              (_, index) => (
                <SkeletonCard key={index} />
              )
            )}

          </div>
        </div>

      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fcfafb] px-5">

        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-200/40">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>

          <h2 className="font-serif text-2xl font-semibold text-gray-900">
            Something went wrong
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {error instanceof Error
              ? error.message
              : 'Unable to load the rental collection.'}
          </p>

          <button
            onClick={() => refetch()}
            className="mt-7 inline-flex items-center justify-center rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-300/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pink-600"
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcfafb] text-gray-900">

      {/* ======================================================
          NAVIGATION
      ======================================================= */}

      <nav className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">

          <Link
            href="/"
            className="group flex items-center gap-3"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 shadow-md shadow-pink-200 transition-transform duration-300 group-hover:scale-105">

              <Gem className="h-5 w-5 text-white" />

            </div>

            <div>

              <p className="font-serif text-xl font-semibold tracking-wide text-gray-900">
                Belles Avenue
              </p>

              <p className="hidden text-[9px] font-medium uppercase tracking-[0.28em] text-gray-400 sm:block">
                Jewellery Rentals
              </p>

            </div>

          </Link>

          <div className="flex items-center gap-5 sm:gap-8">

            <Link
              href="/"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-pink-600"
            >
              Home
            </Link>

            <Link
              href="/admin/login"
              className="hidden rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 transition-all hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 sm:block"
            >
              Admin
            </Link>

          </div>

        </div>
      </nav>


      {/* ======================================================
          FILTER BAR
      ======================================================= */}

      <section className="sticky top-[72px] z-40 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-xl">

        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            {/* Search */}

            <div className="relative min-w-0 flex-1">

              <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search by item code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-full border border-gray-200 bg-gray-50/70 pl-11 pr-10 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

            </div>


            {/* Category */}

            <div className="relative min-w-0 lg:w-52">

              <Filter className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full cursor-pointer appearance-none rounded-full border border-gray-200 bg-gray-50/70 pl-10 pr-10 text-sm text-gray-700 outline-none transition-all hover:border-pink-200 focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

            </div>


            {/* Status */}

            <div className="relative min-w-0 lg:w-44">

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full cursor-pointer appearance-none rounded-full border border-gray-200 bg-gray-50/70 px-4 pr-10 text-sm text-gray-700 outline-none transition-all hover:border-pink-200 focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
              >
                <option value="All">
                  All Statuses
                </option>

                <option value="Available">
                  Available
                </option>

                <option value="Booked">
                  Booked
                </option>

                <option value="Running">
                  Running
                </option>

                <option value="Sold_out">
                  Sold Out
                </option>
              </select>

              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

            </div>


            {/* Sort */}

            <div className="relative min-w-0 lg:w-44">

              <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                    | 'name'
                    | 'price'
                    | 'availability'
                  )
                }
                className="h-11 w-full cursor-pointer appearance-none rounded-full border border-gray-200 bg-gray-50/70 pl-10 pr-10 text-sm text-gray-700 outline-none transition-all hover:border-pink-200 focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50"
              >
                <option value="name">
                  Sort by Name
                </option>

                <option value="price">
                  Sort by Price
                </option>

                <option value="availability">
                  Sort by Availability
                </option>
              </select>

              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

            </div>


            {/* Sort direction */}

            <button
              type="button"
              onClick={() =>
                setSortOrder(
                  sortOrder === 'asc'
                    ? 'desc'
                    : 'asc'
                )
              }
              className="flex h-11 items-center justify-center gap-2 rounded-full border border-gray-200 bg-gray-50/70 px-5 text-sm font-medium text-gray-600 transition-all hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
              title={
                sortOrder === 'asc'
                  ? 'Sort descending'
                  : 'Sort ascending'
              }
            >

              <ArrowUpDown
                className={`h-4 w-4 transition-transform ${sortOrder === 'desc'
                    ? 'rotate-180'
                    : ''
                  }`}
              />

              <span>
                {sortOrder === 'asc'
                  ? 'Ascending'
                  : 'Descending'}
              </span>

            </button>

          </div>


          {/* Active filters */}

          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">

              <span className="mr-1 text-xs font-medium text-gray-400">
                Filters:
              </span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-100 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700">

                  Search: {searchQuery}

                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="rounded-full hover:bg-pink-100"
                  >
                    <X className="h-3 w-3" />
                  </button>

                </span>
              )}

              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700">

                  {getCategoryIcon(
                    selectedCategory
                  )}

                  {selectedCategory}

                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setCurrentPage(1);
                    }}
                    className="rounded-full hover:bg-purple-100"
                  >
                    <X className="h-3 w-3" />
                  </button>

                </span>
              )}

              {selectedStatus !== 'All' && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">

                  {selectedStatus}

                  <button
                    onClick={() => {
                      setSelectedStatus('All');
                      setCurrentPage(1);
                    }}
                    className="rounded-full hover:bg-blue-100"
                  >
                    <X className="h-3 w-3" />
                  </button>

                </span>
              )}

              <button
                onClick={clearFilters}
                className="ml-auto text-xs font-semibold text-gray-500 transition-colors hover:text-pink-600"
              >
                Clear all
              </button>

            </div>
          )}

        </div>
      </section>


      {/* ======================================================
          COLLECTION
      ======================================================= */}

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-pink-500">
              Explore
            </p>

            <h2 className="mt-1 font-serif text-2xl font-semibold text-gray-900 sm:text-3xl">
              Our Rental Collection
            </h2>

          </div>

          <p className="text-sm text-gray-500">
            {filteredItems.length}{' '}
            {filteredItems.length === 1
              ? 'piece'
              : 'pieces'}{' '}
            available
          </p>

        </div>


        {/* ====================================================
            PRODUCT GRID
        ===================================================== */}

        {paginatedItems.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {paginatedItems.map((item) => {

              const statusConfig =
                getStatusConfig(item.status);

              const StatusIcon =
                statusConfig.icon;

              const itemBookings =
                Array.isArray(
                  bookingInfo[item._id]
                )
                  ? bookingInfo[item._id]
                  : [];

              // ------------------------------------------------
              // TODAY
              // ------------------------------------------------

              const today = new Date();

              today.setHours(
                0,
                0,
                0,
                0
              );

              console.log(`Processing item ${item.itemCode} (status: ${item.status}, bookings: ${itemBookings.length})`);

              // ------------------------------------------------
              // FUTURE BOOKINGS FOR BOOKED ITEMS
              // ------------------------------------------------

              const futureBookings =
                itemBookings.filter(
                  (booking) => {
                    const returnDate =
                      new Date(
                        booking.returnDate
                      );

                    returnDate.setHours(
                      0,
                      0,
                      0,
                      0
                    );

                    const isFuture = returnDate >= today && booking.status === 'booked';
                    console.log(`Booking ${booking.bookingNumber} (status: ${booking.status}, return: ${booking.returnDate}) - isFuture: ${isFuture}`);

                    return isFuture;
                  }
                );

              // ------------------------------------------------
              // CURRENT RUNNING BOOKING
              // ------------------------------------------------

              const activeRunningBooking =
                itemBookings.find(
                  (booking) => {
                    const startDate =
                      new Date(
                        booking.startDate
                      );

                    startDate.setHours(
                      0,
                      0,
                      0,
                      0
                    );

                    const returnDate =
                      new Date(
                        booking.returnDate
                      );

                    returnDate.setHours(
                      0,
                      0,
                      0,
                      0
                    );

                    const isRunning = booking.status === 'running' && startDate <= today && returnDate >= today;
                    console.log(`Booking ${booking.bookingNumber} (status: ${booking.status}, start: ${booking.startDate}, return: ${booking.returnDate}) - isRunning: ${isRunning}`);

                    return isRunning;
                  }
                );

              // ------------------------------------------------
              // UPCOMING BOOKINGS AFTER RUNNING BOOKING
              // ------------------------------------------------

              let upcomingBookings: BookingInfo[] = [];

              if (activeRunningBooking) {

                const runningReturnDate =
                  new Date(
                    activeRunningBooking.returnDate
                  );

                runningReturnDate.setHours(
                  0,
                  0,
                  0,
                  0
                );

                upcomingBookings =
                  itemBookings
                    .filter(
                      (booking) => {
                        const startDate =
                          new Date(
                            booking.startDate
                          );

                        startDate.setHours(
                          0,
                          0,
                          0,
                          0
                        );

                        const isUpcoming = booking.status === 'booked' && startDate > runningReturnDate;
                        console.log(`Booking ${booking.bookingNumber} (start: ${booking.startDate}) - isUpcoming: ${isUpcoming}, runningReturn: ${runningReturnDate}`);

                        return isUpcoming;
                      }
                    )
                    .sort(
                      (a, b) =>
                        new Date(
                          a.startDate
                        ).getTime() -
                        new Date(
                          b.startDate
                        ).getTime()
                    );
              }

              return (
                <article
                  key={item._id}
                  className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-pink-100 hover:shadow-2xl hover:shadow-pink-100/40"
                >

                  {/* ==================================================
                      IMAGE
                  =================================================== */}

                  <div
                    className="relative aspect-[4/4.5] cursor-pointer overflow-hidden bg-gradient-to-br from-[#fff4f7] to-[#f5eff8]"
                    onClick={() =>
                      item.image &&
                      setSelectedImage(
                        item.image
                      )
                    }
                  >

                    {item.image ? (
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', item.name, getImageUrl(item.image));
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', item.name, 'Original URL:', item.image, 'Processed URL:', getImageUrl(item.image));
                          
                          // Try alternative format
                          const match = item.image.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                          if (match?.[1]) {
                            const id = match[1];
                            const fallbackUrl = `https://lh3.googleusercontent.com/d/${id}=w1000`;
                            console.log('Trying fallback URL:', fallbackUrl);
                            e.currentTarget.src = fallbackUrl;
                          } else {
                            // No Google Drive ID found, show fallback
                            console.error('Could not extract Google Drive ID from:', item.image);
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'flex h-full w-full items-center justify-center';
                              fallback.innerHTML = '<div class="text-7xl opacity-30">💎</div>';
                              parent.appendChild(fallback);
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="text-7xl opacity-30">
                          💎
                        </div>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5 opacity-70" />


                    {/* Status badge */}

                    <div className="absolute left-4 top-4">

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-md ${statusConfig.className}`}
                      >

                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
                        />

                        {statusConfig.label}

                      </span>

                    </div>


                    {/* Image preview indicator */}

                    {item.image && (
                      <div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">

                        <Search className="h-4 w-4" />

                      </div>
                    )}

                  </div>


                  {/* ==================================================
                      PRODUCT DETAILS
                  =================================================== */}

                  <div className="p-5 sm:p-6">

                    {/* Category */}

                    <div className="mb-2 flex items-center gap-2">

                      <span className="text-sm">
                        {getCategoryIcon(
                          item.category
                        )}
                      </span>

                      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-pink-500">
                        {item.category}
                      </span>

                    </div>


                    {/* Name */}

                    <h3 className="min-h-[48px] font-serif text-lg font-semibold leading-6 text-gray-900 transition-colors group-hover:text-pink-600">
                      {item.name}
                    </h3>


                    {/* Code */}

                    <p className="mt-1 text-xs text-gray-400">
                      Item code ·{' '}
                      <span className="font-medium text-gray-500">
                        {item.itemCode}
                      </span>
                    </p>


                    {/* ==================================================
                        PRICING
                    =================================================== */}

                    <div className="mt-5 border-t border-gray-100 pt-5">

                      <div className="flex items-end justify-between gap-3">

                        <div>

                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                            Rental
                          </p>

                          <div className="mt-1 flex items-baseline gap-1">

                            <span className="text-xs text-gray-500">
                              ₹
                            </span>

                            <span className="text-2xl font-semibold tracking-tight text-gray-900">
                              {item.rentPrice}
                            </span>

                          </div>

                        </div>


                        <div className="text-right">

                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                            Security
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-700">
                            ₹{item.securityDeposit}
                          </p>

                        </div>

                      </div>


                      {/* ==================================================
                          HALF PRICE
                      =================================================== */}

                      {item.supportsHalfPricing && (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">

                          <div className="flex items-center justify-between">

                            <div>

                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                                Half Price
                              </p>

                              <p className="mt-0.5 text-sm font-semibold text-emerald-700">
                                ₹{item.halfRentPrice}
                              </p>

                            </div>

                            <div className="text-right">

                              <p className="text-[10px] text-emerald-600">
                                Security
                              </p>

                              <p className="text-xs font-medium text-emerald-700">
                                ₹
                                {
                                  item.halfSecurityDeposit
                                }
                              </p>

                            </div>

                          </div>

                        </div>
                      )}


                      {/* ==================================================
                          BOOKED ITEM
                      =================================================== */}

                      {item.status ===
                        'booked' &&
                        futureBookings.length >
                        0 && (

                          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-3.5">

                            <div className="flex items-center gap-2">

                              <Clock className="h-4 w-4 text-amber-600" />

                              <p className="text-xs font-semibold text-amber-800">
                                {futureBookings.length >
                                  1
                                  ? `${futureBookings.length} upcoming bookings`
                                  : 'Currently booked'}
                              </p>

                            </div>

                            <div className="mt-3 space-y-2">

                              {futureBookings.map(
                                (
                                  booking,
                                  index
                                ) => (

                                  <div
                                    key={
                                      booking.bookingNumber
                                    }
                                    className="rounded-xl border border-amber-100 bg-white/70 p-3"
                                  >

                                    <div className="flex items-start justify-between gap-3">

                                      <div>

                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                          Booking{' '}
                                          {index +
                                            1}
                                        </p>

                                        <p className="mt-1 text-[11px] font-semibold text-amber-800">
                                          {formatBookingDate(
                                            booking.startDate
                                          )}

                                          <span className="mx-1 text-gray-400">
                                            →
                                          </span>

                                          {formatBookingDate(
                                            booking.returnDate
                                          )}
                                        </p>

                                      </div>

                                      <span
                                        className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${booking.priceType ===
                                            'half'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-blue-50 text-blue-700'
                                          }`}
                                      >
                                        {booking.priceType ===
                                          'half'
                                          ? 'Half Price'
                                          : 'Full Price'}
                                      </span>

                                    </div>

                                  </div>

                                )
                              )}

                            </div>

                          </div>
                        )}


                      {/* ==================================================
                          CURRENTLY RUNNING
                      =================================================== */}

                      {item.status ===
                        'running' &&
                        activeRunningBooking && (

                          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5">

                            {/* Current rental */}

                            <div className="flex items-center gap-2">

                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">

                                <StatusIcon className="h-4 w-4 text-blue-600" />

                              </div>

                              <div>

                                <p className="text-xs font-semibold text-blue-800">
                                  Currently Rented
                                </p>

                                <p className="text-[10px] text-blue-600">
                                  This piece is currently
                                  with a customer
                                </p>

                              </div>

                            </div>


                            {/* Return information */}

                            <div className="mt-3 rounded-xl border border-blue-100 bg-white/70 p-3">

                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                Return By
                              </p>

                              <p className="mt-1 text-sm font-semibold text-blue-800">
                                {formatBookingDate(
                                  activeRunningBooking.returnDate
                                )}
                              </p>

                              <span
                                className={`mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-semibold ${activeRunningBooking.priceType ===
                                    'half'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-blue-50 text-blue-700'
                                  }`}
                              >
                                {activeRunningBooking.priceType ===
                                  'half'
                                  ? 'Half Price'
                                  : 'Full Price'}
                              </span>

                            </div>


                            {/* ==================================================
                                UPCOMING BOOKINGS
                            =================================================== */}

                            {upcomingBookings.length >
                              0 && (

                                <div className="mt-4 border-t border-blue-200 pt-4">

                                  <div className="mb-3 flex items-center justify-between">

                                    <div className="flex items-center gap-2">

                                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">

                                        <span className="text-xs">
                                          📅
                                        </span>

                                      </div>

                                      <div>

                                        <p className="text-xs font-semibold text-gray-800">
                                          Upcoming Bookings
                                        </p>

                                        <p className="text-[10px] text-gray-500">
                                          Reserved after current rental
                                        </p>

                                      </div>

                                    </div>

                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                                      {
                                        upcomingBookings.length
                                      }
                                    </span>

                                  </div>


                                  <div className="space-y-2.5">

                                    {upcomingBookings.map(
                                      (
                                        booking,
                                        index
                                      ) => (

                                        <div
                                          key={
                                            booking.bookingNumber
                                          }
                                          className="rounded-xl border border-amber-100 bg-white/90 p-3 shadow-sm"
                                        >

                                          <div className="flex items-start justify-between gap-3">

                                            <div className="min-w-0">

                                              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                Booking{' '}
                                                {index +
                                                  1}
                                              </p>

                                              <p className="mt-1.5 text-xs font-semibold text-gray-800">

                                                {formatBookingDate(
                                                  booking.startDate
                                                )}

                                                <span className="mx-1.5 text-gray-400">
                                                  →
                                                </span>

                                                {formatBookingDate(
                                                  booking.returnDate
                                                )}

                                              </p>

                                            </div>


                                            <span
                                              className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${booking.priceType ===
                                                  'half'
                                                  ? 'bg-emerald-50 text-emerald-700'
                                                  : 'bg-blue-50 text-blue-700'
                                                }`}
                                            >
                                              {booking.priceType ===
                                                'half'
                                                ? 'Half Price'
                                                : 'Full Price'}
                                            </span>

                                          </div>

                                        </div>

                                      )
                                    )}

                                  </div>

                                </div>
                              )}

                          </div>
                        )}


                      {/* ==================================================
                          SOLD OUT
                      =================================================== */}

                      {item.status ===
                        'sold_out' && (

                          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/70 p-3.5">

                            <div className="flex items-center gap-2">

                              <XCircle className="h-4 w-4 text-red-500" />

                              <p className="text-xs font-medium text-red-700">
                                No longer available
                                for rental
                              </p>

                            </div>

                          </div>
                        )}

                    </div>

                  </div>

                </article>
              );
            })}

          </div>
        )}


        {/* ======================================================
            EMPTY STATE
        ======================================================= */}

        {filteredItems.length === 0 && (
          <div className="mx-auto max-w-lg py-20 text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-50">

              <Search className="h-8 w-8 text-pink-400" />

            </div>

            <h3 className="mt-6 font-serif text-2xl font-semibold text-gray-900">
              No pieces found
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              We couldn't find anything matching
              your current search or filters.
            </p>

            <button
              onClick={clearFilters}
              className="mt-6 rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-300/30 transition-all hover:-translate-y-0.5 hover:bg-pink-600"
            >
              Clear Filters
            </button>

          </div>
        )}


        {/* ======================================================
            PAGINATION
        ======================================================= */}

        {filteredItems.length > 0 && (
          <div className="mt-12 border-t border-gray-100 pt-8">

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredItems.length}
              showItemsInfo={true}
            />

          </div>
        )}

      </main>


      {/* ======================================================
          IMAGE LIGHTBOX
      ======================================================= */}

      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/30 p-4 pt-8 backdrop-blur-sm"
          onClick={() =>
            setSelectedImage(null)
          }
        >

          <div
            className="relative flex max-h-[85vh] w-full max-w-5xl items-start justify-center overflow-hidden rounded-3xl bg-white/5 shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              onClick={() =>
                setSelectedImage(null)
              }
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-xl transition-all hover:scale-105 hover:bg-white hover:text-pink-600"
              aria-label="Close image"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex max-h-[85vh] w-full items-start justify-center p-3 sm:p-6">

              <img
                src={getImageUrl(selectedImage)}
                alt="Jewellery preview"
                className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
                onError={(e) => {
                  console.error('Lightbox image failed to load:', selectedImage);
                  e.currentTarget.src =
                    'https://via.placeholder.com/800x600.png?text=Image+Not+Available';
                }}
              />

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

