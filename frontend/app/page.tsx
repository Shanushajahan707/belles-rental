'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Sparkles,
  Shield,
  Clock,
  Heart,
  ArrowRight,
  Gem,
  ShoppingBag,
  Star,
  Crown,
  CheckCircle2,
} from 'lucide-react';

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<
    'checking' | 'connected' | 'disconnected'
  >('checking');

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
        setBackendStatus('disconnected');
      }
    };

    checkBackendHealth();
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-[#fffafb] text-gray-900">

      {/* =========================================================
          NAVIGATION
      ========================================================= */}
      <nav className="sticky top-0 z-50 border-b border-pink-100/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 shadow-md shadow-pink-200 transition-transform duration-300 group-hover:scale-105">
              <Gem className="h-5 w-5 text-white" />
            </div>

            <div>
              <div className="font-serif text-xl font-semibold tracking-wide text-gray-900">
                Belles Avenue
              </div>
              <div className="-mt-0.5 text-[9px] font-medium uppercase tracking-[0.28em] text-pink-500">
                Jewellery & Rentals
              </div>
            </div>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-3 sm:gap-5">

            {backendStatus === 'connected' && (
              <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 sm:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-emerald-700">
                  Online
                </span>
              </div>
            )}

            <Link
              href="/admin/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-pink-50 hover:text-pink-600"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* =========================================================
          HERO
      ========================================================= */}
      <main>

        <section className="relative isolate">
          {/* Decorative background */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />
            <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-rose-100/30 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8 lg:pt-24">

            {/* Status */}
            <div className="mb-8 flex justify-center">
              {backendStatus === 'checking' && (
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 shadow-sm">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
                  <span className="text-xs font-medium text-gray-600">
                    Connecting...
                  </span>
                </div>
              )}

              {backendStatus === 'connected' && (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Experience Us Online
                  </span>
                </div>
              )}

              {backendStatus === 'disconnected' && (
                <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-red-700">
                    Connection Issue
                  </span>
                </div>
              )}
            </div>

            {/* Hero content */}
            <div className="mx-auto max-w-4xl text-center">

              {/* Eyebrow */}
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-5 py-2 shadow-sm backdrop-blur">
                <Crown className="h-4 w-4 text-pink-500" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
                  Elegance for Every Occasion
                </span>
              </div>

              {/* Heading */}
              <h1 className="font-serif text-5xl font-medium leading-[1.05] tracking-tight text-gray-900 sm:text-6xl md:text-7xl lg:text-[88px]">
                Jewellery that
                <span className="block bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 bg-clip-text pb-2 text-transparent">
                  makes moments shine.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
                Discover exquisite antique and AD jewellery, thoughtfully
                curated for weddings, engagements, celebrations and every
                moment worth remembering.
              </p>

              {/* CTA */}
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">

                <Link
                  href="/rentals"
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-pink-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-200 sm:w-auto"
                >
                  <ShoppingBag className="h-4.5 w-4.5" />
                  Explore Collection
                  <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/admin/login"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-4 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 sm:w-auto"
                >
                  <Gem className="h-4 w-4" />
                  Admin Portal
                </Link>
              </div>

              {/* Trust points */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-500" />
                  Quality Assured
                </div>

                <div className="hidden h-1 w-1 rounded-full bg-pink-300 sm:block" />

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-500" />
                  Premium Collection
                </div>

                <div className="hidden h-1 w-1 rounded-full bg-pink-300 sm:block" />

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-500" />
                  Flexible Rentals
                </div>
              </div>
            </div>

            {/* =====================================================
                HERO VISUAL PANEL
            ===================================================== */}
            <div className="mx-auto mt-16 max-w-5xl sm:mt-20">

              <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-pink-100 via-white to-purple-100 p-2 shadow-2xl shadow-pink-100/70">

                <div className="relative overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-[#fff1f6] via-white to-[#f4edff] px-6 py-10 sm:px-12 sm:py-14">

                  {/* Decorative circles */}
                  <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border border-pink-200/60" />
                  <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full border border-purple-200/60" />

                  <div className="relative grid items-center gap-10 md:grid-cols-3">

                    {/* Left */}
                    <div className="text-center md:text-left">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md md:mx-0">
                        <Sparkles className="h-6 w-6 text-pink-500" />
                      </div>

                      <h3 className="font-serif text-2xl text-gray-800">
                        Timeless
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        Elegant designs that complement every celebration.
                      </p>
                    </div>

                    {/* Center */}
                    <div className="relative flex justify-center">
                      <div className="flex h-44 w-44 items-center justify-center rounded-full border border-pink-200 bg-white/80 shadow-xl shadow-pink-100 sm:h-52 sm:w-52">

                        <div className="flex h-32 w-32 items-center justify-center rounded-full border border-pink-100 bg-gradient-to-br from-pink-50 to-purple-50 sm:h-40 sm:w-40">
                          <Gem className="h-16 w-16 text-pink-500 sm:h-20 sm:w-20" />
                        </div>

                      </div>

                      <div className="absolute -right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg sm:right-4">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      </div>

                      <div className="absolute -bottom-1 -left-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg sm:left-4">
                        <Heart className="h-4 w-4 fill-pink-400 text-pink-400" />
                      </div>
                    </div>

                    {/* Right */}
                    <div className="text-center md:text-right">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md md:ml-auto">
                        <Crown className="h-6 w-6 text-purple-500" />
                      </div>

                      <h3 className="font-serif text-2xl text-gray-800">
                        Effortless
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        Premium jewellery made accessible for your occasions.
                      </p>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================
            FEATURES
        ========================================================= */}
        <section className="border-y border-pink-100/70 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-500">
                The Belles Avenue Difference
              </span>

              <h2 className="mt-3 font-serif text-3xl text-gray-900 sm:text-4xl">
                Beautiful details. Thoughtful service.
              </h2>

              <p className="mt-4 text-sm leading-6 text-gray-500 sm:text-base">
                Everything you need to complete your special occasion look
                with confidence.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">

              {/* Feature 1 */}
              <div className="group rounded-3xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/70 p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-pink-100/60">

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-200 transition-transform duration-300 group-hover:scale-110">
                  <Gem className="h-6 w-6 text-white" />
                </div>

                <h3 className="font-serif text-2xl text-gray-900">
                  Exquisite Jewellery
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Premium antique and AD jewellery carefully selected for
                  weddings, engagements and special occasions.
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-pink-600">
                  <Sparkles className="h-4 w-4" />
                  Curated with care
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group rounded-3xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/70 p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-100/60">

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-200 transition-transform duration-300 group-hover:scale-110">
                  <Shield className="h-6 w-6 text-white" />
                </div>

                <h3 className="font-serif text-2xl text-gray-900">
                  Quality Assured
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Every piece is inspected and maintained with attention to
                  detail before it reaches you.
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-purple-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Quality you can trust
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/70 p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-rose-100/60">

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-purple-500 shadow-lg shadow-rose-200 transition-transform duration-300 group-hover:scale-110">
                  <Clock className="h-6 w-6 text-white" />
                </div>

                <h3 className="font-serif text-2xl text-gray-900">
                  Flexible Rentals
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Choose jewellery for your occasion with convenient rental
                  options designed around your needs.
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-rose-600">
                  <Heart className="h-4 w-4" />
                  Made for your moments
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================
            TESTIMONIALS
        ========================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50 py-20 sm:py-24">

          <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-pink-200/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-purple-200/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="mx-auto mb-12 max-w-2xl text-center">

              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md">
                <Heart className="h-5 w-5 fill-pink-400 text-pink-400" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-500">
                Customer Love
              </span>

              <h2 className="mt-3 font-serif text-3xl text-gray-900 sm:text-4xl">
                Loved by our customers
              </h2>

              <p className="mt-4 text-sm text-gray-500 sm:text-base">
                Moments made memorable, one beautiful piece at a time.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">

              {/* Testimonial 1 */}
              <div className="rounded-3xl border border-white bg-white/80 p-7 shadow-lg shadow-pink-100/40 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

                <div className="mb-5 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <p className="text-sm leading-7 text-gray-600">
                  “The jewellery we rented for my sister's wedding was
                  absolutely beautiful. Very good quality and the service was
                  excellent. It made our special day even more memorable.”
                </p>

                <div className="mt-7 flex items-center gap-3 border-t border-gray-100 pt-5">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-sm font-bold text-white">
                    L
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Lakshmi Devi
                    </p>
                    <p className="text-xs text-gray-400">
                      Thiruvananthapuram
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="rounded-3xl border border-white bg-white/80 p-7 shadow-lg shadow-pink-100/40 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

                <div className="mb-5 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <p className="text-sm leading-7 text-gray-600">
                  “My daughter's wedding jewellery was appreciated by everyone.
                  The collection is beautiful and the prices are reasonable.
                  The staff were very polite and helpful.”
                </p>

                <div className="mt-7 flex items-center gap-3 border-t border-gray-100 pt-5">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-sm font-bold text-white">
                    R
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Radhamani
                    </p>
                    <p className="text-xs text-gray-400">
                      Kochi
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="rounded-3xl border border-white bg-white/80 p-7 shadow-lg shadow-pink-100/40 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

                <div className="mb-5 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <p className="text-sm leading-7 text-gray-600">
                  “For my niece's engagement function, we took jewellery from
                  this shop. The designs were unique and the quality was
                  superb. Highly recommended for special occasions.”
                </p>

                <div className="mt-7 flex items-center gap-3 border-t border-gray-100 pt-5">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-sm font-bold text-white">
                    F
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Fatima Beevi
                    </p>
                    <p className="text-xs text-gray-400">
                      Kozhikode
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================
            FINAL CTA
        ========================================================= */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 px-6 py-14 text-center shadow-2xl shadow-pink-200/50 sm:px-12">

              <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-purple-900/10 blur-2xl" />

              <div className="relative">

                <Sparkles className="mx-auto mb-5 h-8 w-8 text-white/90" />

                <h2 className="font-serif text-3xl text-white sm:text-4xl">
                  Your special moment deserves something beautiful.
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-pink-50 sm:text-base">
                  Explore our collection and find the perfect jewellery for
                  your next celebration.
                </p>

                <Link
                  href="/rentals"
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-pink-600 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  View Collection
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

              </div>
            </div>
          </div>
        </section>

      </main>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t border-pink-100 bg-[#fffafb]">

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

          <div className="flex flex-col items-center justify-between gap-7 md:flex-row">

            {/* Brand */}
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
                <Gem className="h-5 w-5 text-white" />
              </div>

              <div>
                <div className="font-serif text-lg font-semibold text-gray-900">
                  Belles Avenue
                </div>

                <div className="text-[9px] uppercase tracking-[0.25em] text-pink-500">
                  Jewellery & Rentals
                </div>
              </div>
            </Link>

            {/* Links */}
            <div className="flex items-center gap-6">

              <Link
                href="/rentals"
                className="text-sm font-medium text-gray-500 transition-colors hover:text-pink-600"
              >
                Rentals
              </Link>

              <Link
                href="/admin/login"
                className="text-sm font-medium text-gray-500 transition-colors hover:text-pink-600"
              >
                Admin
              </Link>

            </div>

            {/* Copyright */}
            <p className="text-center text-xs text-gray-400 md:text-right">
              © {new Date().getFullYear()} Belles Avenue.
              <span className="hidden sm:inline"> </span>
              All rights reserved.
            </p>

          </div>

        </div>
      </footer>

    </div>
  );
}