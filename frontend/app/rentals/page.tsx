'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import { Search, Filter, Gem, CheckCircle, Clock, XCircle } from 'lucide-react';
import { checkBackendHealth, getCachedBackendStatus } from '@/lib/backendHealth';
import { format } from 'date-fns';
import Link from 'next/link';

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
  customerName: string;
  startDate: string;
  returnDate: string;
  status: string;
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

export default function RentalsPage() {
  const [items, setItems] = useState<RentalItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<RentalItem[]>([]);
  const [bookingInfo, setBookingInfo] = useState<{ [itemId: string]: BookingInfo }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  const fetchItems = async () => {
    try {
      // Check backend health first
      const backendStatus = await checkBackendHealth();
      if (backendStatus === 'disconnected') {
        setError('Backend is not reachable. Please check your connection or try again in 50 seconds.');
        return;   
      }

      const response = await fetch(`${API_URL}/items`);
      if (!response.ok) {
        if (response.status === 401) {
          setError('Unable to load rentals right now. Please refresh or contact support.');
          return;
        }
        throw new Error(`Failed to load items: ${response.status}`);
      }

      const data = await response.json();
      setItems(data);

      // Fetch booking info for booked/running items
      const bookings: { [itemId: string]: BookingInfo } = {};
      for (const item of data) {
        if (item.status === 'booked' || item.status === 'running') {
          try {
            const bookingRes = await fetch(`${API_URL}/bookings/public/item/${item._id}`);
            if (!bookingRes.ok) {
              console.error(`Booking fetch failed for item ${item._id}:`, bookingRes.status);
              continue;
            }
            const bookingData = await bookingRes.json();
            const bookingArray = Array.isArray(bookingData) ? bookingData : [bookingData];
            if (bookingArray.length > 0) {
              const activeBooking = bookingArray[0]; // Get first booking
              bookings[item._id] = {
                bookingNumber: activeBooking.bookingNumber,
                customerName: activeBooking.customerName,
                startDate: activeBooking.startDate,
                returnDate: activeBooking.returnDate,
                status: activeBooking.status,
              };
            }
            // console.log(`Fetched booking for item ${item._id}:`, bookings[item._id],bookingData);
          } catch (bookingError) {
            console.error(`Error fetching booking for item ${item._id}:`, bookingError);
          }
        }
      }
      setBookingInfo(bookings);
    } catch (fetchError: any) {
      console.error('Error fetching items:', fetchError);
      setError('Unable to load rentals right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (img: string) => {
    if (!img) return '';

    if (img.includes('drive.google.com')) {
      const id = img.split('/file/d/')[1]?.split('/')[0];
      return `https://drive.google.com/uc?export=view&id=${id}`;
    }

    return img;
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(item => item.status === selectedStatus.toLowerCase());
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.itemCode.toLowerCase() === searchQuery.toLowerCase()
      );
    }

    setFilteredItems(filtered);
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBookingDate = (dateString?: string) => {
    if (!dateString) return 'Date unavailable';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return format(date, 'd/MMMM/yyyy');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700 font-medium">Loading rentals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Unable to load rentals</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError('');
              fetchItems();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Gem className="w-8 h-8 text-pink-600" />
              <span className="text-xl font-bold text-gray-800">Belles Avenue</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-pink-600 transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                href="/admin/login"
                className="text-gray-600 hover:text-pink-600 transition-colors font-medium"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Our Rental Collection</h1>
          <p className="text-base sm:text-lg text-pink-100 max-w-2xl mx-auto">
            Discover exquisite jewelry and premium items for your special occasions
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 overflow-hidden">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by item code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 text-black rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div className="relative min-w-0">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 text-sm pr-10 py-3 border border-gray-200 text-black rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white w-full max-w-full truncate shadow-sm cursor-pointer hover:border-pink-300 transition-all"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="relative min-w-0">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-10 text-sm pr-10 py-3 border border-gray-200 text-black rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white w-full max-w-full shadow-sm cursor-pointer hover:border-pink-300 transition-all"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Running">Running</option>
                <option value="Sold_out">Sold Out</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div
              key={item._id}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 cursor-pointer"
              onClick={() => item.image && setSelectedImage(item.image)}
            >
              <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center relative overflow-hidden group">
                {item.image ? (
                  <img
                    src={item.image.includes('drive.google.com')
                      ? `https://drive.google.com/thumbnail?id=${item.image.split('/file/d/')[1]?.split('/')[0]}&sz=w1000`
                      : item.image
                    }
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300.png?text=Image+Not+Available';
                    }}
                  />
                ) : (
                  <div className="text-6xl">💎</div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
              </div>

              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-800 line-clamp-2">{item.name}</h3>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)} w-fit shrink-0 flex items-center gap-1`}>
                    {item.status === 'available' && <CheckCircle className="w-3 h-3" />}
                    {item.status === 'booked' && <Clock className="w-3 h-3" />}
                    {item.status === 'running' && <XCircle className="w-3 h-3" />}
                    {item.status === 'sold_out' && <XCircle className="w-3 h-3" />}
                    {item.status === 'sold_out' ? 'Sold Out' : item.status}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  <span className="font-medium">Code:</span> {item.itemCode}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-1">
                  <span className="font-medium">Category:</span> {item.category}
                </p>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Full Price:</span>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-gray-600">Rent: ₹{item.rentPrice}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Security: ₹{item.securityDeposit}</p>
                      </div>
                    </div>
                    {item.supportsHalfPricing && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-medium text-green-700">Half Price:</span>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm text-green-600">Rent: ₹{item.halfRentPrice}</p>
                          <p className="text-xs sm:text-sm text-green-600">Security: ₹{item.halfSecurityDeposit}</p>
                        </div>
                      </div>
                    )}

                  </div>
                  {item.status === 'booked' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-xs sm:text-sm text-yellow-800 font-medium flex items-center gap-2 mb-2">
                        <span className="text-yellow-600">⚠️</span>
                        Currently Booked
                      </p>
                      {bookingInfo[item._id] && (
                        <div className="text-xs text-yellow-700 space-y-1">
                          <p><span className="font-semibold">Booked:</span> {formatBookingDate(bookingInfo[item._id]?.startDate)} to {formatBookingDate(bookingInfo[item._id]?.returnDate)}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {item.status === 'running' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      {bookingInfo[item._id] && (
                        <div className="text-xs text-blue-700 space-y-1">
                          <p><span className="font-semibold">Return By:</span> {formatBookingDate(bookingInfo[item._id]?.returnDate)}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {item.status === 'sold_out' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs sm:text-sm text-red-800 font-medium flex items-center gap-2">
                        <span className="text-red-600">🚫</span>
                        This item has been sold out and is no longer available for rental
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>


          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="text-5xl sm:text-7xl mb-6">🔍</div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3">No items found</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedStatus('All');
              }}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-auto relative animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-all hover:scale-110 group"
              aria-label="Close"
            >
              <XCircle className="w-6 h-6 text-gray-700 group-hover:text-pink-600 transition-colors" />
            </button>
            <div className="relative w-full flex items-center justify-center bg-gray-100 p-4">
              <img
                src={selectedImage.includes('drive.google.com')
                  ? `https://drive.google.com/thumbnail?id=${selectedImage.split('/file/d/')[1]?.split('/')[0]}&sz=w1000`
                  : selectedImage
                }
                alt="Full View"
                className="max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
