'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, Edit, Trash2, ArrowLeft, Eye } from 'lucide-react';
import { useToast } from '@/components/Toast';

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
  status: 'available' | 'booked' | 'running';
}

const categories = [
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'booked' | 'running'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<RentalItem | null>(null);
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
    status: 'available' as 'available' | 'booked' | 'running',
  });

  useEffect(() => {
    checkAuth();
    fetchItems();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    }
  };

  const fetchItems = async () => {
    try {
      const response = await api.get('/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
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
        status: 'available',
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.itemCode.toLowerCase().includes(search) ||
      item.barcode.toLowerCase().includes(search);

    return matchesStatus && matchesCategory && matchesSearch;
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
          <div className="flex justify-between items-center">
            <Link href="/admin/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Manage Rental Items</h1>
            <div></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="itemStatusFilter" className="text-sm font-medium text-gray-700">Status</label>
          <select
            id="itemStatusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="running">Running</option>
          </select>
          <label htmlFor="itemCategoryFilter" className="text-sm font-medium text-gray-700">Category</label>
          <select
            id="itemCategoryFilter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, name, or barcode"
            className="w-full min-w-[200px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>
        <button
          onClick={() => {
            setFilterStatus('all');
            setFilterCategory('all');
            setSearchQuery('');
          }}
          className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Reset Filters
        </button>
      </div>
      <div className="flex justify-end mb-6">
          <button
            onClick={() => {
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
            }}
            className="flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Item
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Barcode</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Purchase</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rent Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Half Rent</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Security</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Half Security</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.itemCode}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.barcode}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">₹{item.purchasePrice}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">₹{item.rentPrice}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">₹{item.halfRentPrice}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">₹{item.securityDeposit}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">₹{item.halfSecurityDeposit}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/items/${item._id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                          title="View Item Details"
                        >
                          <span className="text-xs">View</span>
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2"
                          title="Edit Item"
                        >
                          <span className="text-xs">Edit</span>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                          title="Delete Item"
                        >
                          <span className="text-xs">Delete</span>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No items match your filters</h3>
                <p className="text-gray-500">Try clearing filters or adding more items.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Code</label>
                <input
                  type="text"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="e.g., ANC001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="e.g., Antique Gold Choker"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="e.g., BRC12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="15000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rent Price (₹)</label>
                  <input
                    type="number"
                    value={formData.rentPrice}
                    onChange={(e) => setFormData({ ...formData, rentPrice: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Half Rent Price (₹)</label>
                  <input
                    type="number"
                    value={formData.halfRentPrice}
                    onChange={(e) => setFormData({ ...formData, halfRentPrice: e.target.value })}
                    required={formData.supportsHalfPricing}
                    disabled={!formData.supportsHalfPricing}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 border text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                      formData.supportsHalfPricing
                        ? 'border-gray-300'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                    placeholder="250"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="2000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Half Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={formData.halfSecurityDeposit}
                    onChange={(e) => setFormData({ ...formData, halfSecurityDeposit: e.target.value })}
                    required={formData.supportsHalfPricing}
                    disabled={!formData.supportsHalfPricing}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 border text-black rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                      formData.supportsHalfPricing
                        ? 'border-gray-300'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.supportsHalfPricing}
                    onChange={(e) => setFormData({ ...formData, supportsHalfPricing: e.target.checked })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-gray-700">This item supports half pricing</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
