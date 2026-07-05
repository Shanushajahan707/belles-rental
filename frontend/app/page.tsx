'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Sparkles, Shield, Clock, Heart, ArrowRight, Gem, ShoppingBag } from 'lucide-react';

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await api.get('/public/health');
        if (response.data?.status === 'ok') {
          localStorage.setItem('backendStatus', 'connected');
          setBackendStatus('connected');  
        } else {
          setBackendStatus('disconnected');
        }
      } catch (error) {
        // console.error('Backend health check failed:', error);
        setBackendStatus('disconnected');
      }
    };

    checkBackendHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Gem className="w-8 h-8 text-pink-600" />
              <span className="text-xl font-bold text-gray-800">Belles Avenue</span>
            </div>
            <div className="flex items-center gap-4">
              {backendStatus === 'connected' && (
                <div className="hidden sm:flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-700">Online</span>
                </div>
              )}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          {/* Backend Status Banner */}
          <div className="mb-8 inline-block">
            {backendStatus === 'checking' ? (
              <div className="inline-flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-gray-700">Connecting...</span>
              </div>
            ) : backendStatus === 'connected' ? (
              <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full shadow-sm border border-green-200">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">System Online</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full shadow-sm border border-red-200">
                <div className="w-4 h-4 bg-red-500 rounded-full" />
                <span className="text-sm font-medium text-red-700">Connection Issue</span>
              </div>
            )}
          </div>

          {/* Main Hero Content */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-pink-100 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-pink-600" />
              <span className="text-sm font-medium text-pink-700">Premium Quality</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Belles Avenue
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto">
              Premium Rental & Fancy Shop
            </p>
            
            <p className="text-base text-gray-500 max-w-xl mx-auto mb-8">
              Discover exquisite jewelry and premium rentals for every special occasion. Quality assured, always.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/rentals"
              className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Explore Rentals
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/admin/login"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-800 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-pink-300 hover:border-pink-400"
            >
              Admin Portal
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Gem className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Exquisite Jewelry</h3>
            <p className="text-gray-600 text-sm">
              Premium antique and AD jewelry curated for every special occasion
            </p>
          </div>
        
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Quality Assured</h3>
            <p className="text-gray-600 text-sm">
              Every item inspected and maintained to perfection before delivery
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Flexible Rentals</h3>
            <p className="text-gray-600 text-sm">
              Choose your rental duration with convenient pickup and delivery options
            </p>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 sm:p-12 mb-16 border border-gray-100">
          <div className="text-center mb-8">
            <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Loved by Our Customers</h2>
            <p className="text-gray-600">Join thousands of satisfied customers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-2xl">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "The jewelry we rented for my sister's wedding was absolutely beautiful. Very good quality and the service was excellent. Thank you so much for making our special day even more memorable. Will definitely recommend to others."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                  L
                </div>
                <div>
                  <p className="font-medium text-gray-800">Lakshmi Devi</p>
                  <p className="text-sm text-gray-500">Thiruvananthapuram</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-2xl">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "My daughter's wedding jewelry from here was appreciated by everyone. The collection is very nice and the prices are reasonable. The staff was very polite and helpful. Very satisfied with the overall experience. God bless you."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                  R
                </div>
                <div>
                  <p className="font-medium text-gray-800">Radhamani</p>
                  <p className="text-sm text-gray-500">Kochi</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-2xl">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "For my niece's engagement function, we took jewelry from this shop. The designs were very unique and the quality was superb. The owner was very kind and understanding. Highly recommended for all special occasions."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                  F
                </div>
                <div>
                  <p className="font-medium text-gray-800">Fatima Beevi</p>
                  <p className="text-sm text-gray-500">Kozhikode</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Gem className="w-6 h-6 text-pink-600" />
              <span className="font-semibold text-gray-800">Belles Avenue</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 Belles Avenue. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/rentals" className="text-sm text-gray-600 hover:text-pink-600 transition-colors">
                Rentals
              </Link>
              <Link href="/admin/login" className="text-sm text-gray-600 hover:text-pink-600 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
