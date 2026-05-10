'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, ArrowLeft, Play, CheckCircle, Square, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Booking {
  _id: string;
  bookingNumber: string;
  customerName: string;
  phone: string;
  address: string;
  items: any[];
  startDate: string;
  returnDate: string;
  actualReturnDate?: string;
  discount: number;
  totalAmount: number;
  status: 'booked' | 'running' | 'completed' | 'overdue';
  createdBy: string;
  createdAt: string;
}

export default function BookingsManagement() {
  const router = useRouter();
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

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
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
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
          <div className="flex justify-between items-center">
            <Link href="/admin/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Manage Bookings</h1>
            <Link
              href="/admin/bookings/new"
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Booking
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Mobile Card View */}
          <div className="md:hidden">
            {bookings.map(booking => (
              <div key={booking._id} className="border-b border-gray-200 p-4 space-y-3">
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
                        • {item.itemId?.name || item.itemName || 'Unknown Item'}
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
                    <div className="flex gap-2">
                      {booking.status === 'booked' && (
                        <>
                          <Link href={`/admin/bookings/${booking._id}/edit`} className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleStartRental(booking._id)} className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Play className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteBooking(booking._id)} className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {booking.status === 'running' && (
                        <>
                          <button onClick={() => handleCompleteRental(booking._id)} className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleStopRental(booking._id)} className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <Square className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {booking.status === 'overdue' && (
                        <button onClick={() => handleCompleteRental(booking._id)} className="p-2 bg-green-100 text-green-600 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map(booking => (
                    <tr key={booking._id} className="hover:bg-gray-50">
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
                            <div key={index}>
                              {item.itemId?.name || item.itemName || 'Unknown Item'}
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
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleStartRental(booking._id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Start Rental"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBooking(booking._id)}
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
                                onClick={() => handleCompleteRental(booking._id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Complete Rental"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStopRental(booking._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Stop Rental"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {booking.status === 'overdue' && (
                            <button
                              onClick={() => handleCompleteRental(booking._id)}
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
      </div>
    </div>
  );
}
