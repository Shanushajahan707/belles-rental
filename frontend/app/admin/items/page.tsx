'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, Edit, Trash2, ArrowLeft, Eye, Search, Package, LayoutDashboard, Calendar, FileText, Gem, Menu, X, RotateCcw, ChevronDown, ChevronRight, CheckCircle, LogOut } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { checkBackendHealthWithRedirect } from '@/lib/backendHealth';
import Pagination from '@/components/Pagination';
import { useDebounce } from '@/hooks/useDebounce';

interface RentalItem {
  _id: string;
  itemCode: string;
  barcode: string;
  name: string;
  category: string;
  image: string;
  rentPrice: number;
  halfRentPrice: number;
  securityDeposit: number;
  halfSecurityDeposit: number;
  purchasePrice: number;
  supportsHalfPricing: boolean;
  status: 'available' | 'booked' | 'running' | 'sold_out';
}

const categories = [
  'Antique Choker',
  'Antique Second Necklace',
  'Antique Necklace Set (Choker + Second Necklace)',
  'Normal Choker',
  'Normal Second Necklace',
  'Normal Necklace Set (Choker + Second Necklace)',
  'AD Choker',
  'Kerala Choker',
  'Kerala Second Necklace',
  'Kerala Necklace Set (Choker + Second Necklace)',
  'AD Second Necklace',
  'AD Necklace Set (Choker + Second Necklace)',
  'Chutty (Antique)',
  'Chutty (AD)',
  'Hip Chain',
  'Hair Accessories',
  'Bangles (Antique)',
  'Bangles (AD)',
  'Earrings (Antique)',
  'Earchain (Antique)'
];

export default function ItemsManagement() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'booked' | 'running' | 'sold_out'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<RentalItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    category: categories[0],
    image: '',
    rentPrice: '',
    halfRentPrice: '',
    securityDeposit: '',
    halfSecurityDeposit: '',
    barcode: '',
    purchasePrice: '',
    supportsHalfPricing: false,
    status: 'available' as 'available' | 'booked' | 'running' | 'sold_out',
  });

  useEffect(() => {
    checkAuth();
    fetchItems();
  }, [currentPage, filterStatus, filterCategory, debouncedSearchQuery]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    }
  };

  const fetchItems = async () => {
    try {
      // Check backend health first and redirect if disconnected
      const isConnected = await checkBackendHealthWithRedirect(router);
      if (!isConnected) {
        return;
      }

      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterCategory !== 'all') {
        params.append('category', filterCategory);
      }
      if (debouncedSearchQuery) {
        params.append('search', debouncedSearchQuery);
      }

      const response = await api.get(`/items?${params.toString()}`);
      setItems(response.data.items || response.data);
      setTotalItems(response.data.total || response.data.length);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.addToast({
        message: 'Error fetching items',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`/items/${id}`);
      setItems(items.filter(item => item._id !== id));
      toast.addToast({
        message: 'Item deleted successfully!',
        type: 'success',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.addToast({
        message: 'Error deleting item',
        type: 'error',
      });
    }
  };

  const handleEdit = (item: RentalItem) => {
    setEditingItem(item);
    setFormData({
      itemCode: item.itemCode,
      barcode: item.barcode,
      name: item.name,
      category: item.category,
      image: item.image,
      rentPrice: item.rentPrice.toString(),
      halfRentPrice: item.halfRentPrice.toString(),
      securityDeposit: item.securityDeposit.toString(),
      halfSecurityDeposit: item.halfSecurityDeposit.toString(),
      purchasePrice: item.purchasePrice.toString(),
      supportsHalfPricing: item.supportsHalfPricing,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        rentPrice: parseFloat(formData.rentPrice),
        halfRentPrice: formData.supportsHalfPricing ? parseFloat(formData.halfRentPrice) : 0,
        securityDeposit: parseFloat(formData.securityDeposit),
        halfSecurityDeposit: formData.supportsHalfPricing ? parseFloat(formData.halfSecurityDeposit) : 0,
        purchasePrice: parseFloat(formData.purchasePrice),
        supportsHalfPricing: formData.supportsHalfPricing,
      };

      if (editingItem) {
        await api.put(`/items/${editingItem._id}`, payload);
        setItems(items.map(item => item._id === editingItem._id ? { ...item, ...payload } : item));
        toast.addToast({
          message: 'Item updated successfully!',
          type: 'success',
        });
      } else {
        const response = await api.post('/items', payload);
        setItems([...items, response.data]);
        toast.addToast({
          message: 'Item created successfully!',
          type: 'success',
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({
        itemCode: '',
        name: '',
        category: categories[0],
        image: '',
        rentPrice: '',
        halfRentPrice: '',
        securityDeposit: '',
        halfSecurityDeposit: '',
        barcode: '',
        purchasePrice: '',
        supportsHalfPricing: false,
        status: 'available' as 'available' | 'booked' | 'running' | 'sold_out',
      });
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast.addToast({
        message: error.response?.data?.error || 'Error saving item',
        type: 'error',
      });
    }
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

  const filteredItems = items.sort((a, b) => {
    // Sort by itemCode numerically/alphabetically
    return a.itemCode.localeCompare(b.itemCode, undefined, { numeric: true, sensitivity: 'base' });
  });

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleFilterChange = (filterType: 'status' | 'category' | 'search', value: string) => {
    if (filterType === 'status') {
      setFilterStatus(value as typeof filterStatus);
    } else if (filterType === 'category') {
      setFilterCategory(value);
    } else if (filterType === 'search') {
      setSearchQuery(value);
    }
    setCurrentPage(1);
  };

  const getImageUrl = (image: string) => {
    if (!image) return '';
    if (image.includes('drive.google.com')) {
      const id = image.split('/file/d/')[1]?.split('/')[0];
      if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
    }
    return image;
  };

  const statusMeta = {
    available: { label: 'Available', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' },
    booked: { label: 'Booked', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 ring-amber-600/10' },
    running: { label: 'Running', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 ring-blue-600/10' },
    sold_out: { label: 'Sold Out', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 ring-red-600/10' },
  } as const;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterCategory('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      itemCode: '',
      name: '',
      category: categories[0],
      image: '',
      rentPrice: '',
      halfRentPrice: '',
      securityDeposit: '',
      halfSecurityDeposit: '',
      barcode: '',
      purchasePrice: '',
      supportsHalfPricing: false,
      status: 'available',
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-950 text-white shadow-lg">
            <Gem className="h-7 w-7" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
            Loading jewellery collection...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8fb] text-gray-900">
      {/* Desktop + mobile sidebar — shared Belles Avenue admin navigation */}
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-white/10 bg-[#21131d] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/admin/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg shadow-pink-950/30">
              <Gem className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-serif text-lg font-semibold tracking-wide">Belles Avenue</p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-pink-200/70">Admin Portal</p>
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 px-4 py-7">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Workspace</p>

          <nav className="space-y-1">
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3"><LayoutDashboard className="h-4.5 w-4.5" /> Dashboard</span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            <Link
              href="/admin/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3"><Calendar className="h-4.5 w-4.5" /> Bookings</span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            <Link
              href="/admin/items"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/10 px-3 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-pink-300/10"
            >
              <Package className="h-4.5 w-4.5 text-pink-300" />
              Jewellery
            </Link>

            <Link
              href="/admin/invoices"
              onClick={() => setMobileMenuOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3"><FileText className="h-4.5 w-4.5" /> Invoices</span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="flex items-center gap-3"><CheckCircle className="h-4.5 w-4.5" /> Availability</span>
              <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
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
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-[#faf8fb]/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="rounded-xl border border-gray-200 bg-white p-2.5 lg:hidden">
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Inventory</p>
                <h1 className="font-serif text-lg font-medium sm:text-xl">Jewellery Collection</h1>
              </div>
            </div>
            <Link href="/admin/dashboard" className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-950 sm:flex">
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Intro */}
          <section className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-gray-400">Collection Management</p>
              <h2 className="font-serif text-3xl font-medium tracking-tight text-gray-950 sm:text-4xl">Your jewellery, beautifully organised.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Manage rental pieces, pricing, availability and collection details from one place.</p>
            </div>
            <button onClick={openAddModal} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-950/10 transition hover:-translate-y-0.5 hover:bg-gray-800 md:w-auto">
              <Plus className="h-4 w-4" /> Add Jewellery
            </button>
          </section>

          {/* Stats */}
          <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Total Pieces', totalItems, 'Collection'],
              ['Available', items.filter(i => i.status === 'available').length, 'Ready to rent'],
              ['Booked', items.filter(i => i.status === 'booked').length, 'Upcoming'],
              ['Running', items.filter(i => i.status === 'running').length, 'Currently out'],
            ].map(([label, value, hint]) => (
              <div key={label as string} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">{value}</p>
                <p className="mt-1 text-[11px] text-gray-400">{hint}</p>
              </div>
            ))}
          </section>

          {/* Filters */}
          <section className="mb-5 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search by item code, name or barcode..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
                <div className="relative">
                  <select value={filterStatus} onChange={(e) => handleFilterChange('status', e.target.value)} className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm text-gray-700 outline-none focus:border-gray-400 focus:bg-white sm:min-w-[155px]">
                    <option value="all">All statuses</option>
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="running">Running</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative">
                  <select value={filterCategory} onChange={(e) => handleFilterChange('category', e.target.value)} className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm text-gray-700 outline-none focus:border-gray-400 focus:bg-white sm:min-w-[220px]">
                    <option value="all">All categories</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                <button onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
              </div>
            </div>
          </section>

          {/* Desktop collection table */}
          <section className="hidden overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm lg:block">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="font-serif text-xl text-gray-950">Collection</h3>
                <p className="mt-0.5 text-xs text-gray-400">{totalItems} items in your inventory</p>
              </div>
              <span className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500">20 per page</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gray-50/80">
                  <tr className="border-b border-gray-100">
                    {['#', 'Piece', 'Category', 'Pricing', 'Security', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item, index) => {
                    const meta = statusMeta[item.status] || statusMeta.available;
                    return (
                      <tr key={item._id} onClick={() => router.push(`/admin/items/${item._id}`)} className="group cursor-pointer transition hover:bg-gray-50/70">
                        <td className="px-5 py-4 text-xs font-medium text-gray-400">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                              {item.image ? <img src={getImageUrl(item.image)} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="flex h-full items-center justify-center"><Gem className="h-5 w-5 text-gray-300" /></div>}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-950">{item.name}</p>
                              <p className="mt-0.5 text-xs text-gray-400">{item.itemCode} · {item.barcode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[230px] px-5 py-4 text-xs leading-5 text-gray-500">{item.category}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-950">₹{item.rentPrice.toLocaleString('en-IN')}</p>
                          {item.supportsHalfPricing && <p className="mt-0.5 text-[11px] text-gray-400">Half ₹{item.halfRentPrice.toLocaleString('en-IN')}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-700">₹{item.securityDeposit.toLocaleString('en-IN')}</p>
                          {item.supportsHalfPricing && <p className="mt-0.5 text-[11px] text-gray-400">Half ₹{item.halfSecurityDeposit.toLocaleString('en-IN')}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 ring-inset ${meta.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/items/${item._id}`} title="View" className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"><Eye className="h-4 w-4" /></Link>
                            <button onClick={() => handleEdit(item)} title="Edit" className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(item._id)} title="Delete" className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredItems.length === 0 && <EmptyState />}
          </section>

          {/* Mobile/tablet cards */}
          <section className="space-y-3 lg:hidden">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="font-serif text-xl text-gray-950">Collection</h3>
                <p className="text-xs text-gray-400">{totalItems} items</p>
              </div>
            </div>
            {filteredItems.map((item, index) => {
              const meta = statusMeta[item.status] || statusMeta.available;
              return (
                <article key={item._id} onClick={() => router.push(`/admin/items/${item._id}`)} className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition active:scale-[0.995]">
                  <div className="flex gap-3">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      {item.image ? <img src={getImageUrl(item.image)} alt={item.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="flex h-full items-center justify-center"><Gem className="h-7 w-7 text-gray-300" /></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-950">{item.name}</p>
                          <p className="mt-0.5 text-xs text-gray-400">{item.itemCode} · {item.barcode}</p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${meta.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-gray-500">{item.category}</p>
                      <div className="mt-2 flex items-end justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-950">₹{item.rentPrice.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-gray-400">rent</span></p>
                          <p className="text-[10px] text-gray-400">Security ₹{item.securityDeposit.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/admin/items/${item._id}`} className="rounded-lg bg-gray-50 p-2 text-gray-600"><Eye className="h-4 w-4" /></Link>
                          <button onClick={() => handleEdit(item)} className="rounded-lg bg-gray-50 p-2 text-gray-600"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(item._id)} className="rounded-lg bg-red-50 p-2 text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
            {filteredItems.length === 0 && <EmptyState />}
          </section>

          {totalItems > 0 && (
            <div className="mt-5">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={totalItems} showItemsInfo={true} />
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-gray-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Collection</p>
                <h2 className="mt-1 font-serif text-2xl text-gray-950">{editingItem ? 'Edit Jewellery' : 'Add New Jewellery'}</h2>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-full bg-gray-100 p-2.5 text-gray-600 hover:bg-gray-200"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Item Code">
                  <input type="text" value={formData.itemCode} onChange={(e) => setFormData({ ...formData, itemCode: e.target.value.toUpperCase() })} required placeholder="e.g. ANC001" className={inputClass} />
                </Field>
                <Field label="Barcode">
                  <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value.toUpperCase() })} required placeholder="e.g. BRC12345" className={inputClass} />
                </Field>
                <Field label="Name" className="sm:col-span-2">
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Antique Gold Choker" className={inputClass} />
                </Field>
                <Field label="Category" className="sm:col-span-2">
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required className={inputClass}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </Field>
                <Field label="Image URL" className="sm:col-span-2">
                  <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="Google Drive or image URL" className={inputClass} />
                </Field>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-950">Pricing & deposit</p>
                  <p className="mt-1 text-xs text-gray-400">Set the rental and refundable security amounts.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Purchase Price (₹)"><input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} required min="0" step="0.01" placeholder="15000" className={inputClass} /></Field>
                  <Field label="Rent Price (₹)"><input type="number" value={formData.rentPrice} onChange={(e) => setFormData({ ...formData, rentPrice: e.target.value })} required min="0" step="0.01" placeholder="500" className={inputClass} /></Field>
                  <Field label="Half Rent Price (₹)"><input type="number" value={formData.halfRentPrice} onChange={(e) => setFormData({ ...formData, halfRentPrice: e.target.value })} required={formData.supportsHalfPricing} disabled={!formData.supportsHalfPricing} min="0" step="0.01" placeholder="250" className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`} /></Field>
                  <Field label="Security Deposit (₹)"><input type="number" value={formData.securityDeposit} onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })} required min="0" step="0.01" placeholder="2000" className={inputClass} /></Field>
                  <Field label="Half Security Deposit (₹)"><input type="number" value={formData.halfSecurityDeposit} onChange={(e) => setFormData({ ...formData, halfSecurityDeposit: e.target.value })} required={formData.supportsHalfPricing} disabled={!formData.supportsHalfPricing} min="0" step="0.01" placeholder="1000" className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`} /></Field>
                </div>
                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                  <input type="checkbox" checked={formData.supportsHalfPricing} onChange={(e) => setFormData({ ...formData, supportsHalfPricing: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                  <span><span className="block text-sm font-medium text-gray-800">Supports half pricing</span><span className="block text-xs text-gray-400">Enable separate half-set rent and security values.</span></span>
                </label>
              </div>

              <Field label="Status">
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'available' | 'booked' | 'running' | 'sold_out' })} className={inputClass}>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="running">Running</option>
                  <option value="sold_out">Sold Out</option>
                </select>
              </Field>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="rounded-full bg-gray-950 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-950/10 hover:bg-gray-800">{editingItem ? 'Save Changes' : 'Add Jewellery'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-4 focus:ring-gray-100";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
        <Package className="h-6 w-6 text-gray-300" />
      </div>
      <h3 className="font-serif text-xl text-gray-800">No jewellery found</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-400">Try adjusting your filters or add a new piece to the collection.</p>
    </div>
  );
}
