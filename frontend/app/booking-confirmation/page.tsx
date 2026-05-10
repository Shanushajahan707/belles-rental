'use client';

import { useEffect, useState, Suspense } from 'react';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Calendar, Clock, User, Phone, MapPin, DollarSign, Download } from 'lucide-react';

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
  totalDeposit: number;
  discount: number;
  totalAmount: number;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  createdAt: string;
}

function BookingConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingNumber = searchParams.get('bookingNumber');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (bookingNumber) {
      fetchBooking();
    }
  }, [bookingNumber]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/number/${bookingNumber}`);
      console.log('booking data', response.data);
      setBooking(response.data);

      // Fetch corresponding invoice
      try {
        const invoiceResponse = await api.get(`/invoices/booking/${response.data._id}`);
        setInvoice(invoiceResponse.data);
      } catch (invoiceError) {
        console.log('No invoice found for this booking:', invoiceError);
        setInvoice(null);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-4">The booking number you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/rentals" className="text-pink-500 hover:text-pink-600 underline">
            Browse Available Items
          </Link>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/admin/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
              Back to Admin Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Booking Confirmation</h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-lg opacity-90">Your rental has been successfully booked</p>
          </div>

          {/* Booking Details */}
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-pink-600">{booking.bookingNumber}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Booking Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-medium">Name:</span>
                    <span className="text-gray-900 font-medium">{booking.customerName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-600 font-medium">Phone:</span>
                    <span className="text-gray-900 font-medium">{booking.phone}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-600 mt-1" />
                    <div>
                      <span className="text-gray-600 font-medium">Address:</span>
                      <span className="text-gray-900 font-medium">{booking.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rental Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Rental Information
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-medium">Booking Period:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.returnDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-600 font-medium">Duration:</span>
                    <span className="text-gray-900 font-medium">
                      {Math.ceil((new Date(booking.returnDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Information */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Rented Items
              </h4>

              <div className="space-y-2">
                {booking.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.itemName}</p>
                      <p className="text-sm text-gray-600">{item.itemCode}</p>
                      <p className="text-sm text-gray-600">Rent: ₹{item.rentPrice}/day</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Subtotal:</p>
                  <p className="text-2xl font-bold text-gray-900">₹{booking.totalAmount + booking.discount}</p>
                </div>
                <div className="text-right">
                  {booking.discount > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Discount:</p>
                      <p className="text-lg font-semibold text-red-600">-₹{booking.discount}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Total Amount:</p>
                    <p className="text-2xl font-bold text-green-600">₹{booking.totalAmount}</p>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Booking Status
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(booking.status)}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.status === 'booked' && 'Your booking is confirmed and being prepared'}
                        {booking.status === 'running' && 'Your rental is currently in progress'}
                        {booking.status === 'completed' && 'Your rental has been completed successfully'}
                        {booking.status === 'overdue' && 'Your rental is overdue - please contact us'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.actualReturnDate ? `Actual return: ${new Date(booking.actualReturnDate).toLocaleDateString()}` : 'Expected return: ' + new Date(booking.returnDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-center gap-4">
                  <Link href="/admin/dashboard" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    Continue
                  </Link>
                  <Link href="/admin/invoices" className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    View Invoices
                  </Link>
                  {invoice ? (
                    <button
                      onClick={() => window.open(`/admin/invoices?search=${booking.bookingNumber}`, '_blank')}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Download Invoice"
                    >
                      <Download className="w-4 h-4" />
                      Download Invoice
                    </button>
                  ) : (
                    <div className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
                      <Download className="w-4 h-4" />
                      Invoice Not Available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  );
}
