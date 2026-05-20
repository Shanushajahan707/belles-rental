'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-6">
          {backendStatus === 'checking' ? (
            <div className="inline-flex items-center justify-center rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
              Checking backend connection...
              <br />
              Wait 60s...
            </div>
          ) : backendStatus === 'connected' ? (
            <div className="inline-flex items-center justify-center rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700 border border-green-200 shadow-sm">
              Backend is connected and responding.
            </div>
          ) : (
            <div className="inline-flex items-center justify-center rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 border border-red-200 shadow-sm">
              Backend is not reachable right now. Please refresh or try again later after 60s.
            </div>
          )}
        </div>

        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-4">
            Belles Avenue
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">
            Premium Rental & Fancy Shop
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link
            href="/rentals"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            View Rentals
          </Link>
          <Link
            href="/admin/login"
            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-800 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-pink-300"
          >
            Admin Login
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-lg font-semibold mb-2">Exquisite Jewelry</h3>
            <p className="text-gray-600 text-sm">
              Premium antique and AD jewelry for every occasion
            </p>
          </div>
        
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Quality Assured</h3>
            <p className="text-gray-600 text-sm">
              All items inspected and maintained to perfection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
