'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, ArrowLeft, Play, CheckCircle, Square, Trash2, Edit, X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { checkBackendHealthWithRedirect } from '@/lib/backendHealth';

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
  additionalCharges?: number;
  totalAmount: number;
  status: 'booked' | 'running' | 'completed' | 'overdue';
  createdBy: string;
  createdAt: string;
  note?: string;
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

  useEffect(() => {
    checkAuth();
    fetchBookings();
  }, []);

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

      const response = await api.get('/bookings');
      setBookings(response.data);
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

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !search ||
      booking.bookingNumber.toLowerCase().includes(search) ||
      booking.customerName.toLowerCase().includes(search) ||
      booking.phone.toLowerCase().includes(search) ||
      booking.createdBy.toLowerCase().includes(search);

    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">Manage Bookings</h1>
            <Link
              href="/admin/bookings/new"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New Booking
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <label htmlFor="bookingStatusFilter" className="text-sm font-medium text-gray-700">Status</label>
              <select
                id="bookingStatusFilter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <option value="all">All</option>
                <option value="booked">Booked</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by booking #, customer, phone, or created by"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
          </div>
          {/* Mobile Card View */}
          <div className="md:hidden max-h-96 overflow-y-auto">
            {filteredBookings.map(booking => (
              <div 
                key={booking._id} 
                className="border-b border-gray-200 p-4 space-y-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleViewDetails(booking)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">{booking.bookingNumber}</p>
                    <p className="font-medium text-gray-900">{booking.customerName}</p>
                    <p className="text-sm text-gray-600">{booking.phone}</p>
                    <p className="text-xs text-gray-500">Created by: {booking.createdBy}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">Items:</p>
                    {booking.items.map((item: any, index: number) => (
                      <div key={index} className="text-gray-600">
                        • {item.itemName || item.itemId?.name || 'Unknown Item'}
                        {item.priceType && (
                          <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded ${item.priceType === 'half' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {item.priceType === 'half' ? 'Half' : 'Full'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Start:</p>
                      <p className="text-gray-600">{new Date(booking.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Return:</p>
                      <p className="text-gray-600">{new Date(booking.returnDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-900">₹{booking.totalAmount}</p>
                    <div className="text-xs text-gray-500">
                      <p>Total: Rent + Security - Discounts - Advance + Addl. Charges</p>
                    </div>
                  </div>

                  {booking.additionalCharges && booking.additionalCharges > 0 && (
                    <div className="bg-orange-50 p-2 rounded-lg">
                      <p className="text-xs font-medium text-orange-800 mb-1">Additional Charges:</p>
                      <p className="text-xs text-orange-700">₹{booking.additionalCharges}</p>
                    </div>
                  )}

                  {booking.note && (
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <p className="text-xs font-medium text-blue-800 mb-1">Admin Note:</p>
                      <p className="text-xs text-blue-700">{booking.note}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {booking.status === 'booked' && (
                      <>
                        <Link 
                          href={`/admin/bookings/${booking._id}/edit`} 
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRental(booking._id);
                          }} 
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBooking(booking._id);
                          }} 
                          className="p-2 bg-red-100 text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {booking.status === 'running' && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteRental(booking._id);
                          }} 
                          className="p-2 bg-green-100 text-green-600 rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStopRental(booking._id);
                          }} 
                          className="p-2 bg-red-100 text-red-600 rounded-lg"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBooking(booking._id);
                          }} 
                          className="p-2 bg-red-100 text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {booking.status === 'overdue' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteRental(booking._id);
                        }} 
                        className="p-2 bg-green-100 text-green-600 rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Addl. Charges</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.map(booking => (
                    <tr 
                      key={booking._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewDetails(booking)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{booking.bookingNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{booking.customerName}</p>
                          <p className="text-sm text-gray-600">{booking.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">
                          <p className="font-medium">{booking.createdBy}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">
                          {booking.items.map((item: any, index: number) => (
                            <div key={index}>
                              {item.itemId?.itemCode || item.itemCode || 'Unknown Item'}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">
                          {booking.items.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              {item.itemName || item.itemId?.name || 'Unknown Item'}
                              {item.priceType && (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${item.priceType === 'half' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                  {item.priceType === 'half' ? 'Half' : 'Full'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(booking.startDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(booking.returnDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ₹{booking.totalAmount}
                      </td>
                      <td className="px-4 py-3">
                        {booking.additionalCharges && booking.additionalCharges > 0 ? (
                          <div className="max-w-xs">
                            <p className="text-xs text-orange-700 truncate" title={`Additional charges: ₹${booking.additionalCharges}`}>
                              ₹{booking.additionalCharges}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                        {booking.note ? (
                          <div className="max-w-[150px]">
                            <p className="text-xs text-blue-700 truncate whitespace-nowrap" title={booking.note}>
                              {booking.note}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {booking.status === 'booked' && (
                            <>
                              <Link
                                href={`/admin/bookings/${booking._id}/edit`}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Edit Booking"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRental(booking._id);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Start Rental"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBooking(booking._id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Booking"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {booking.status === 'running' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteRental(booking._id);
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Complete Rental"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStopRental(booking._id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Stop Rental"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {booking.status === 'overdue' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteRental(booking._id);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Complete Rental"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {bookings.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings yet</h3>
                  <p className="text-gray-500">Create your first booking to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div >

      {/* Booking Details Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">Booking Details</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
              >
                <X className="w-5 h-5" />
                Close
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Booking Number</p>
                    <p className="font-medium text-gray-900">{selectedBooking.bookingNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer Name</p>
                    <p className="font-medium text-gray-900">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{selectedBooking.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{selectedBooking.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-medium text-gray-900">{selectedBooking.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rental Period */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Rental Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium text-gray-900">{new Date(selectedBooking.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Return Date</p>
                    <p className="font-medium text-gray-900">{new Date(selectedBooking.returnDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</p>
                  </div>
                  {selectedBooking.actualReturnDate && (
                    <div>
                      <p className="text-sm text-gray-600">Actual Return Date</p>
                      <p className="font-medium text-gray-900">{new Date(selectedBooking.actualReturnDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Items */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Booking Items</h3>
                <div className="space-y-4">
                  {selectedBooking.items.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-32 h-32 flex-shrink-0 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.itemId?.image ? (
                            <img
                              src={item.itemId.image.includes('drive.google.com')
                                ? `https://drive.google.com/thumbnail?id=${item.itemId.image.split('/file/d/')[1]?.split('/')[0]}&sz=w1000`
                                : item.itemId.image
                              }
                              alt={item.itemName || item.itemId?.name || 'Item'}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<span class="text-gray-500 text-sm">No Image</span>';
                                }
                              }}
                            />
                          ) : (
                            <span className="text-gray-500 text-sm">No Image</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{item.itemName || item.itemId?.name || 'Unknown Item'}</p>
                              <p className="text-sm text-gray-600">Code: {item.itemCode || item.itemId?.itemCode || 'N/A'}</p>
                            </div>
                            {item.priceType && (
                              <span className={`px-3 py-1 text-xs font-medium rounded ${item.priceType === 'half' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {item.priceType === 'half' ? 'Half Day' : 'Full Day'}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Rent Price</p>
                              <p className="font-medium text-gray-900">₹{item.rentPrice}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Security Deposit</p>
                              <p className="font-medium text-gray-900">₹{item.security}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Information</h3>
                <div className="space-y-2">
                  {selectedBooking.discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600">-₹{selectedBooking.discount}</span>
                    </div>
                  )}
                  {selectedBooking.additionalCharges && selectedBooking.additionalCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Additional Charges</span>
                      <span className="font-medium text-orange-600">+₹{selectedBooking.additionalCharges}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Total Amount</span>
                      <span className="text-lg font-bold text-pink-600">₹{selectedBooking.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.note && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Admin Note</h3>
                  <p className="text-blue-700">{selectedBooking.note}</p>
                </div>
              )}

              {/* Created At */}
              <div className="text-sm text-gray-500 text-center">
                <p>Created on {new Date(selectedBooking.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
