'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, Search, Plus, Eye, LayoutDashboard, Calendar, Package, Gem, Menu, X, ChevronRight, LogOut } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { checkBackendHealthWithRedirect } from '@/lib/backendHealth';
import Pagination from '@/components/Pagination';
import { useDebounce } from '@/hooks/useDebounce';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  bookingNumber: string;
  startDate: string;
  returnDate: string;
  totalAmount: number;
  createdAt: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, debouncedSearchQuery]);

  const fetchInvoices = async () => {
    try {
      // Check backend health first and redirect if disconnected
      const isConnected = await checkBackendHealthWithRedirect(router);
      if (!isConnected) {
        return;
      }

      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (debouncedSearchQuery) {
        params.append('search', debouncedSearchQuery);
      }

      const response = await api.get(`/invoices?${params.toString()}`);
      console.log('Invoices response:', response.data);

      setInvoices(response.data.invoices || response.data);
      setTotalItems(response.data.total || response.data.length);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.addToast({
        message: 'Failed to load invoices. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (bookingId: string) => {
    try {
      const response = await api.post('/invoices/generate', { bookingId });
      if (response.data.invoiceNumber) {
        // Open invoice in new tab
        window.open(`/admin/invoices/${response.data.invoiceNumber}`, '_blank');
      }
    } catch (error: any) {
      console.error('Error generating invoice:', error);
    }
  };

  const handleDownloadInvoice = async (invoiceNumber: string) => {
    try {
      const response = await api.get(`/invoices/download/${invoiceNumber}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.addToast({
        message: 'Failed to download invoice',
        type: 'error',
      });
    }
  };

  const handleViewDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setDetailsModalOpen(true);
  };

  const handleManualInvoiceGeneration = async () => {
    if (!selectedBookingId) {
      toast.addToast({
        message: 'Please enter a booking number',
        type: 'error',
      });
      return;
    }

    try {
      console.log('here');

      const response = await api.post('/invoices/generate', { bookingId: selectedBookingId });
      toast.addToast({
        message: 'Invoice generated successfully!',
        type: 'success',
      });
      console.log('reposns', response);

      setIsModalOpen(false);
      setSelectedBookingId('');
      fetchInvoices(); // Refresh invoice list
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      const errorMessage = error.response?.data?.error || 'Error generating invoice';
      toast.addToast({
        message: errorMessage,
        type: 'error',
      });
    }
  };

  const filteredInvoices = invoices;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#f8f5f7] text-[#24151e]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Shared Belles Avenue Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-white/10 bg-[#21131d] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/admin/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg shadow-pink-950/30">
              <Gem className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-serif text-lg font-semibold tracking-wide">Belles Avenue</p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-pink-200/70">
                Admin Portal
              </p>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 px-4 py-7">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Workspace
          </p>

          <nav className="space-y-1">
            <Link
              href="/admin/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <LayoutDashboard className="h-[18px] w-[18px]" />
                Dashboard
              </span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50" />
            </Link>

            <Link
              href="/admin/bookings"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Calendar className="h-[18px] w-[18px]" />
                Bookings
              </span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50" />
            </Link>

            <Link
              href="/admin/items"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Package className="h-[18px] w-[18px]" />
                Jewellery
              </span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50" />
            </Link>

            <Link
              href="/admin/invoices"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/10 px-3 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-pink-300/10"
            >
              <FileText className="h-[18px] w-[18px] text-pink-300" />
              Invoices
            </Link>

            <Link
              href="/admin/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3">
                <Eye className="h-[18px] w-[18px]" />
                Availability
              </span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50" />
            </Link>
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-2xl bg-white/5 p-4">
            <p className="text-xs font-semibold text-white/80">Store status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs text-white/50">Management portal active</span>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.push('/admin/login');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main workspace */}
      <main className="min-h-screen lg:ml-[270px]">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 border-b border-[#eadfe5] bg-white/90 px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-[#eadfe5] p-2.5 text-[#5d4350] shadow-sm"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500">
                <Gem className="h-4 w-4 text-white" />
              </div>
              <span className="font-serif text-lg font-semibold">Belles Avenue</span>
            </div>

            <div className="w-10" />
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          {/* Page heading */}
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 hidden items-center gap-2 text-xs font-medium text-[#927683] lg:flex">
                <Link href="/admin/dashboard" className="hover:text-pink-600">
                  Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-[#5d4350]">Invoices</span>
              </div>

              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
                Finance & records
              </p>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#2a1722] sm:text-4xl">
                Invoice Management
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#806c76] sm:text-base">
                Manage customer invoices, download PDF records, and generate invoices for bookings.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => router.push('/admin/bookings')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Plus className="h-4 w-4" />
                Generate Invoice
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4d6de] bg-white px-5 py-3 text-sm font-semibold text-[#5d4350] shadow-sm transition hover:border-purple-300 hover:bg-purple-50"
              >
                <Plus className="h-4 w-4 text-purple-500" />
                Manual Invoice
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#eadfe5] bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
                <FileText className="h-5 w-5 text-pink-500" />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9a8790]">Invoices shown</p>
              <p className="mt-1 text-2xl font-semibold text-[#2a1722]">{invoices.length}</p>
            </div>

            <div className="rounded-2xl border border-[#eadfe5] bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <Download className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9a8790]">Total records</p>
              <p className="mt-1 text-2xl font-semibold text-[#2a1722]">{totalItems}</p>
            </div>

            <div className="rounded-2xl border border-[#eadfe5] bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9a8790]">Per page</p>
              <p className="mt-1 text-2xl font-semibold text-[#2a1722]">{itemsPerPage}</p>
            </div>
          </div>

          {/* Invoice panel */}
          <section className="overflow-hidden rounded-3xl border border-[#eadfe5] bg-white shadow-sm">
            <div className="border-b border-[#eee4e9] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#2a1722]">Invoices</h2>
                  <p className="mt-1 text-sm text-[#8b7680]">
                    Search, filter, view and download invoice records.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 sm:w-[360px]">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8959d]" />
                    <input
                      type="text"
                      placeholder="Search customer, phone or invoice..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#e4d8df] bg-[#fcfafb] pl-10 pr-4 text-sm text-[#2a1722] outline-none transition placeholder:text-[#b1a1a8] focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center px-6 py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-pink-100 border-t-pink-500" />
                <p className="mt-4 text-sm font-medium text-[#806c76]">Loading invoices...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-50">
                  <FileText className="h-7 w-7 text-pink-400" />
                </div>
                <h3 className="mt-5 font-serif text-xl font-semibold text-[#2a1722]">
                  No invoices found
                </h3>
                <p className="mt-2 max-w-md text-sm text-[#8b7680]">
                  Try adjusting your search or generate an invoice from a booking.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-[#eee4e9] bg-[#fcfafb]">
                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8790]">
                          Invoice
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8790]">
                          Customer
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8790]">
                          Booking
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8790]">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8790]">
                          Created
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a8790]">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#f0e7eb]">
                      {filteredInvoices.map((invoice: Invoice) => (
                        <tr key={invoice._id} className="transition hover:bg-[#fffafd]">
                          <td className="whitespace-nowrap px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
                                <FileText className="h-4 w-4 text-pink-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[#2a1722]">
                                  {invoice.invoiceNumber}
                                </p>
                                <p className="mt-0.5 text-xs text-[#a08e96]">Invoice</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <p className="text-sm font-semibold text-[#3a2630]">{invoice.customerName}</p>
                            <p className="mt-1 text-xs text-[#918088]">{invoice.customerPhone}</p>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-sm font-medium text-[#5d4350]">
                            {invoice.bookingNumber}
                          </td>

                          <td className="whitespace-nowrap px-6 py-5">
                            <p className="text-sm font-bold text-[#2a1722]">
                              ₹{Number(invoice.totalAmount || 0).toLocaleString('en-IN')}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-6 py-5 text-sm text-[#6f5b65]">
                            {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleViewDetails(invoice)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6dbe1] px-3 py-2 text-xs font-semibold text-[#5d4350] transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                                title="View Invoice"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>

                              <button
                                onClick={() => handleDownloadInvoice(invoice.invoiceNumber)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#21131d] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#36202f]"
                                title="Download PDF Invoice"
                              >
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </button>

                              <button
                                onClick={() =>
                                  router.push(
                                    `/booking-confirmation?bookingNumber=${invoice.bookingNumber}`
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6dbe1] px-3 py-2 text-xs font-semibold text-[#5d4350] transition hover:bg-gray-50"
                                title="View Booking"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Booking
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 p-4 md:hidden">
                  {filteredInvoices.map((invoice: Invoice) => (
                    <div
                      key={invoice._id}
                      className="rounded-2xl border border-[#eadfe5] bg-[#fffdfd] p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50">
                            <FileText className="h-4 w-4 text-pink-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#2a1722]">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-xs text-[#918088]">{invoice.bookingNumber}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#faf7f9] p-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a08e96]">
                            Customer
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-[#3a2630]">
                            {invoice.customerName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[#918088]">
                            {invoice.customerPhone}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a08e96]">
                            Amount
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#2a1722]">
                            ₹{Number(invoice.totalAmount || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-[#918088]">
                          {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(invoice)}
                            className="rounded-lg border border-[#e6dbe1] p-2 text-[#5d4350] hover:bg-pink-50 hover:text-pink-600"
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(invoice.invoiceNumber)}
                            className="rounded-lg bg-[#21131d] p-2 text-white hover:bg-[#36202f]"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/booking-confirmation?bookingNumber=${invoice.bookingNumber}`
                              )
                            }
                            className="rounded-lg border border-[#e6dbe1] p-2 text-[#5d4350] hover:bg-gray-50"
                            title="View Booking"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {totalItems > 0 && (
              <div className="border-t border-[#eee4e9] px-4 py-4 sm:px-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  showItemsInfo={true}
                />
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Manual Invoice Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#21131d]/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/40 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eee4e9] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-500">
                  Invoice
                </p>
                <h3 className="mt-1 font-serif text-2xl font-semibold text-[#2a1722]">
                  Generate Manual Invoice
                </h3>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-[#8b7680] transition hover:bg-[#f8f2f5] hover:text-[#2a1722]"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="mb-4 text-sm leading-6 text-[#806c76]">
                Enter the booking number to generate an invoice manually.
              </p>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#6f5b65]">
                Booking number
              </label>

              <input
                type="text"
                placeholder="Enter booking number..."
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#e4d8df] bg-[#fcfafb] px-4 text-sm text-[#2a1722] outline-none transition placeholder:text-[#b1a1a8] focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10"
              />

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#e4d8df] px-5 py-3 text-sm font-semibold text-[#6f5b65] transition hover:bg-[#faf7f9]"
                >
                  Cancel
                </button>

                <button
                  onClick={handleManualInvoiceGeneration}
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:-translate-y-0.5"
                >
                  Generate Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {detailsModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#21131d]/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/40 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eee4e9] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-500">
                  Invoice details
                </p>
                <h3 className="mt-1 font-serif text-2xl font-semibold text-[#2a1722]">
                  {selectedInvoice.invoiceNumber}
                </h3>
              </div>

              <button
                onClick={() => {
                  setDetailsModalOpen(false);
                  setSelectedInvoice(null);
                }}
                className="rounded-xl p-2 text-[#8b7680] transition hover:bg-[#f8f2f5] hover:text-[#2a1722]"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl bg-[#faf7f9] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#a08e96]">
                  Customer
                </p>
                <p className="mt-1 font-semibold text-[#2a1722]">{selectedInvoice.customerName}</p>
                <p className="mt-1 text-sm text-[#806c76]">{selectedInvoice.customerPhone}</p>
                {selectedInvoice.customerAddress && (
                  <p className="mt-1 text-sm text-[#806c76]">{selectedInvoice.customerAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#eadfe5] p-4">
                  <p className="text-xs text-[#a08e96]">Booking</p>
                  <p className="mt-1 font-semibold text-[#2a1722]">{selectedInvoice.bookingNumber}</p>
                </div>
                <div className="rounded-2xl border border-[#eadfe5] p-4">
                  <p className="text-xs text-[#a08e96]">Amount</p>
                  <p className="mt-1 font-semibold text-[#2a1722]">
                    ₹{Number(selectedInvoice.totalAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#eadfe5] p-4">
                  <p className="text-xs text-[#a08e96]">Start date</p>
                  <p className="mt-1 text-sm font-semibold text-[#2a1722]">
                    {selectedInvoice.startDate
                      ? new Date(selectedInvoice.startDate).toLocaleDateString('en-IN')
                      : '—'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#eadfe5] p-4">
                  <p className="text-xs text-[#a08e96]">Return date</p>
                  <p className="mt-1 text-sm font-semibold text-[#2a1722]">
                    {selectedInvoice.returnDate
                      ? new Date(selectedInvoice.returnDate).toLocaleDateString('en-IN')
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => handleDownloadInvoice(selectedInvoice.invoiceNumber)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#21131d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#36202f]"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  onClick={() =>
                    router.push(
                      `/booking-confirmation?bookingNumber=${selectedInvoice.bookingNumber}`
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4d8df] px-5 py-3 text-sm font-semibold text-[#5d4350] transition hover:bg-[#faf7f9]"
                >
                  <FileText className="h-4 w-4" />
                  View Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}
