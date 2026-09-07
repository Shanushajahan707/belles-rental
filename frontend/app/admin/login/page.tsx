'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Gem,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem(
        'user',
        JSON.stringify(response.data.user)
      );

      toast.addToast({
        message: 'Login successful! Welcome to Belles Avenue.',
        type: 'success',
      });

      setEmail('');
      setPassword('');

      router.push('/admin/dashboard');
    } catch (error: any) {
      toast.addToast({
        message:
          error.response?.data?.error || 'Login failed',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#170b13]">

      {/* =====================================================
          BACKGROUND IMAGE
      ===================================================== */}

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/images/login-jewellery.jpg')",
        }}
      />

      {/* Dark luxury overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Pink / purple glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-900/45 via-transparent to-purple-950/60" />

      {/* Soft glow effects */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">

        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-sm lg:grid-cols-2">

          {/* =================================================
              LEFT BRAND PANEL
          ================================================= */}

          <div className="relative hidden min-h-[650px] overflow-hidden lg:flex">

            {/* Background overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-950/80 via-black/40 to-purple-950/80" />

            <div className="relative z-10 flex w-full flex-col justify-between p-12">

              {/* Logo */}
              <Link
                href="/"
                className="group inline-flex w-fit items-center gap-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg shadow-pink-900/30 transition-transform duration-300 group-hover:scale-105">
                  <Gem className="h-6 w-6 text-white" />
                </div>

                <div>
                  <div className="font-serif text-2xl font-semibold tracking-wide text-white">
                    Belles Avenue
                  </div>

                  <div className="text-[9px] uppercase tracking-[0.3em] text-pink-200">
                    Jewellery & Rentals
                  </div>
                </div>
              </Link>

              {/* Center content */}
              <div className="max-w-md">

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                  <Sparkles className="h-6 w-6 text-pink-200" />
                </div>

                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-pink-200">
                  Management Portal
                </p>

                <h1 className="font-serif text-5xl leading-tight text-white">
                  Manage your
                  <span className="block bg-gradient-to-r from-pink-200 via-white to-purple-200 bg-clip-text text-transparent">
                    beautiful collection.
                  </span>
                </h1>

                <p className="mt-6 max-w-sm text-sm leading-7 text-white/65">
                  Access your Belles Avenue management dashboard to manage
                  jewellery, rentals, bookings and your store operations.
                </p>

                {/* Trust items */}
                <div className="mt-8 space-y-3">

                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                      <ShieldCheck className="h-4 w-4 text-pink-200" />
                    </div>
                    Secure management access
                  </div>

                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                      <Gem className="h-4 w-4 text-pink-200" />
                    </div>
                    Jewellery & rental management
                  </div>

                </div>
              </div>

              {/* Bottom */}
              <div>
                <div className="mb-4 h-px w-20 bg-gradient-to-r from-pink-300 to-transparent" />

                <p className="text-xs text-white/45">
                  Premium jewellery. Exceptional moments.
                </p>
              </div>

            </div>
          </div>

          {/* =================================================
              RIGHT LOGIN PANEL
          ================================================= */}

          <div className="flex min-h-[650px] items-center justify-center bg-white/95 p-6 sm:p-10 lg:p-12">

            <div className="w-full max-w-md">

              {/* Mobile logo */}
              <div className="mb-8 text-center lg:hidden">

                <Link
                  href="/"
                  className="inline-flex items-center gap-3"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-200">
                    <Gem className="h-5 w-5 text-white" />
                  </div>

                  <div className="text-left">
                    <div className="font-serif text-xl font-semibold text-gray-900">
                      Belles Avenue
                    </div>

                    <div className="text-[8px] uppercase tracking-[0.25em] text-pink-500">
                      Jewellery & Rentals
                    </div>
                  </div>
                </Link>

              </div>

              {/* Back */}
              <Link
                href="/"
                className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-pink-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>

              {/* Heading */}
              <div className="mb-8">

                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
                  <ShieldCheck className="h-5 w-5 text-pink-500" />
                </div>

                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-pink-500">
                  Welcome Back
                </p>

                <h2 className="font-serif text-4xl font-medium tracking-tight text-gray-900">
                  Admin Login
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Sign in to access your Belles Avenue management portal.
                </p>

              </div>

              {/* Form */}
              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >

                {/* Email */}
                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100"
                    placeholder="admin@gmail.com"
                  />

                </div>

                {/* Password */}
                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Password
                    </label>

                  </div>

                  <div className="relative">

                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100"
                      placeholder="••••••••"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-500 focus:outline-none"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>

                  </div>

                </div>

                {/* Login button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-pink-200/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-200/70 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowLeft className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>

              </form>

              {/* Security note */}
              <div className="mt-7 rounded-xl border border-pink-100 bg-pink-50/60 p-4">

                <div className="flex gap-3">

                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />

                  <div>
                    <p className="text-xs font-semibold text-gray-700">
                      Secure access
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-gray-500">
                      This area is restricted to authorized Belles Avenue
                      administrators.
                    </p>
                  </div>

                </div>

              </div>

              {/* Footer */}
              <p className="mt-8 text-center text-xs text-gray-400">
                © {new Date().getFullYear()} Belles Avenue
              </p>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}