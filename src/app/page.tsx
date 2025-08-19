'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function Home() {
  const { user, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">My Inventory</h1>
              <span className="ml-2 text-sm text-gray-500">Inventory Management System</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700">Welcome, {user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="space-x-2">
                  <Link
                    href="/login"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
                    {user ? (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Welcome to your Inventory Management System
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Manage your products, inventory, warehouses, and purchase orders from this dashboard.
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                  href="/products"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">P</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Products
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            Manage Catalog
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/inventory"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">I</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Inventory
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            Track Stock
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/warehouses"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">W</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Warehouses
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            Manage Locations
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/purchase-orders"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">PO</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Purchase Orders
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            Manage Orders
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Reports and Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Link
                  href="/alerts"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Stock Alerts</h3>
                    <p className="text-gray-600">Monitor low stock and out-of-stock items</p>
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        View Alerts →
                      </span>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/reports"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Reports</h3>
                    <p className="text-gray-600">Generate inventory summaries and turnover reports</p>
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        View Reports →
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Quick Links */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
                  <div className="flex space-x-4">
                    <Link
                      href="/test"
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      Test API →
                    </Link>
                    <Link
                      href="/README.md"
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      Documentation →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Welcome to My Inventory
                  </h2>
                  <p className="text-gray-600 mb-6">
                    A complete inventory management system with API endpoints for managing products, 
                    inventory levels, purchase orders, and generating reports.
                  </p>
                  <div className="space-y-4">
                    <p className="text-gray-700">
                      Please sign in or create an account to access the inventory management system.
                    </p>
                    <div className="space-x-4">
                      <Link
                        href="/login"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Create Account
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
