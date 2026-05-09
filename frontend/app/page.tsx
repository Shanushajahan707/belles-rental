import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            Belles Avenue
          </h1>
          <p className="text-xl text-gray-600">
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

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-lg font-semibold mb-2">Exquisite Jewelry</h3>
            <p className="text-gray-600 text-sm">
              Premium antique and AD jewelry for every occasion
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
            <p className="text-gray-600 text-sm">
              Simple and hassle-free rental process
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
