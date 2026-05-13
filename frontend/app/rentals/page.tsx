'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Search, Filter } from 'lucide-react';

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
  status: 'available' | 'booked' | 'running';
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
  'Antique Necklace (Choker)',
  'Antique Necklace (Layered)',
  'Antique Earrings (Jhumka)',
  'Bangles (Antique)',
  'Bangles (Normal)',
  'Earchain',
  'Chutty',
  'Hip Chain',
  'AD Necklace',
];

export default function RentalsPage() {
  const [items, setItems] = useState<RentalItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<RentalItem[]>([]);
  const [bookingInfo, setBookingInfo] = useState<{ [itemId: string]: BookingInfo }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  const fetchItems = async () => {
    try {
      const response = await api.get('/items');
      setItems(response.data);

      // Fetch booking info for booked/running items
      const bookings: { [itemId: string]: BookingInfo } = {};
      for (const item of response.data) {
        if (item.status === 'booked' || item.status === 'running') {
          try {
            const bookingRes = await api.get(`/bookings/item/${item._id}`);
            if (bookingRes.data && bookingRes.data.length > 0) {
              const activeBooking = bookingRes.data[0]; // Get first booking
              bookings[item._id] = {
                bookingNumber: activeBooking.bookingNumber,
                customerName: activeBooking.customerName,
                startDate: activeBooking.startDate,
                returnDate: activeBooking.returnDate,
                status: activeBooking.status,
              };
            }
          } catch (error) {
            console.error(`Error fetching booking for item ${item._id}:`, error);
          }
        }
      }
      setBookingInfo(bookings);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
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
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.itemCode.toLowerCase().includes(searchQuery.toLowerCase())
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Our Rentals</h1>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or item code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Running">Running</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div key={item._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                {item.image ? (
                  <img
                    src={item.image.includes('drive.google.com')
                      ? `https://drive.google.com/thumbnail?id=${item.image.split('/file/d/')[1]?.split('/')[0]}&sz=w1000`
                      : item.image
                    }
                    alt={item.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300.png?text=Image+Not+Available';
                    }}
                  />
                ) : (
                  <div className="text-6xl">💎</div>
                )}
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>

                </div>

                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Code:</span> {item.itemCode}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Category:</span> {item.category}
                </p>

                <div className="border-t pt-3 mt-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Full Price:</span>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Rent: ₹{item.rentPrice}</p>
                        <p className="text-sm text-gray-600">Security: ₹{item.securityDeposit}</p>
                      </div>
                    </div>
                    {item.supportsHalfPricing && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-700">Half Price:</span>
                        <div className="text-right">
                          <p className="text-sm text-green-600">Rent: ₹{item.halfRentPrice}</p>
                          <p className="text-sm text-green-600">Security: ₹{item.halfSecurityDeposit}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {item.status === 'booked' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium flex items-center gap-2 mb-2">
                        <span className="text-yellow-600">⚠️</span>
                        Currently Booked
                      </p>
                      {bookingInfo[item._id] && (
                        <div className="text-xs text-yellow-700 space-y-1">
                          <p><span className="font-semibold">Booked:</span> {new Date(bookingInfo[item._id].startDate).toLocaleDateString()} to {new Date(bookingInfo[item._id].returnDate).toLocaleDateString()}</p>
                          {/* <p><span className="font-semibold">Customer:</span> {bookingInfo[item._id].customerName}</p> */}
                        </div>
                      )}
                    </div>
                  )}
                  {item.status === 'running' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    
                      {bookingInfo[item._id] && (
                        <div className="text-xs text-blue-700 space-y-1">
                          <p><span className="font-semibold">Return By:</span> {new Date(bookingInfo[item._id].returnDate).toLocaleDateString()}</p>
                          {/* <p><span className="font-semibold">Customer:</span> {bookingInfo[item._id].customerName}</p> */}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
