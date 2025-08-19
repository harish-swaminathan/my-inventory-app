'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface InventorySummary {
  total_products: number
  total_stock_value: number
  low_stock_items: number
  out_of_stock_items: number
  warehouses: number
  categories: Array<{
    name: string
    product_count: number
    stock_value: number
  }>
}

interface TurnoverItem {
  product_id: string
  product_name: string
  sku: string
  beginning_inventory: number
  ending_inventory: number
  units_sold: number
  turnover_ratio: number
  average_inventory: number
}

interface LowStockReport {
  summary: {
    total_items: number
    critical_items: number
    high_priority_items: number
    medium_priority_items: number
    low_priority_items: number
    total_shortage_value: number
  }
  items: Array<{
    id: string
    product: {
      name: string
      sku: string
      category: string
      price: number
    }
    warehouse: {
      name: string
      location: string
    }
    current_quantity: number
    reorder_level: number
    shortage: number
    shortage_value: number
    priority: string
  }>
}

export default function ReportsPage() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('summary')
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null)
  const [turnoverData, setTurnoverData] = useState<TurnoverItem[]>([])
  const [lowStockReport, setLowStockReport] = useState<LowStockReport | null>(null)
  const [loadingReports, setLoadingReports] = useState(false)
  const [error, setError] = useState('')
  const [turnoverPeriod, setTurnoverPeriod] = useState('30d')

  useEffect(() => {
    if (user) {
      loadReport(activeTab)
    }
  }, [user, activeTab, turnoverPeriod])

  const getAuthHeaders = async () => {
    const supabase = await import('@/utils/supabase/client').then(m => m.createClient())
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  const loadReport = async (reportType: string) => {
    try {
      setLoadingReports(true)
      setError('')
      const headers = await getAuthHeaders()

      switch (reportType) {
        case 'summary':
          const summaryResponse = await fetch('/api/reports/inventory-summary', { headers })
          const summaryData = await summaryResponse.json()
          if (summaryData.success) {
            setInventorySummary(summaryData.data)
          } else {
            setError(summaryData.error?.message || 'Failed to load inventory summary')
          }
          break

        case 'turnover':
          const turnoverResponse = await fetch(`/api/reports/turnover?period=${turnoverPeriod}`, { headers })
          const turnoverData = await turnoverResponse.json()
          if (turnoverData.success) {
            setTurnoverData(turnoverData.data)
          } else {
            setError(turnoverData.error?.message || 'Failed to load turnover report')
          }
          break

        case 'lowstock':
          const lowStockResponse = await fetch('/api/reports/low-stock', { headers })
          const lowStockData = await lowStockResponse.json()
          if (lowStockData.success) {
            setLowStockReport(lowStockData.data)
          } else {
            setError(lowStockData.error?.message || 'Failed to load low stock report')
          }
          break
      }
    } catch (err) {
      setError('Failed to load report')
    } finally {
      setLoadingReports(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access reports.</p>
          <Link
            href="/login"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
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
              <Link href="/" className="text-3xl font-bold text-gray-900 hover:text-indigo-600">
                My Inventory
              </Link>
              <span className="ml-2 text-sm text-gray-500">Reports Dashboard</span>
            </div>
            <Link
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('summary')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'summary'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Inventory Summary
              </button>
              <button
                onClick={() => setActiveTab('turnover')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'turnover'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Stock Turnover
              </button>
              <button
                onClick={() => setActiveTab('lowstock')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'lowstock'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Low Stock Report
              </button>
            </nav>
          </div>

          {loadingReports && (
            <div className="text-center py-8">
              <div className="text-lg">Loading report...</div>
            </div>
          )}

          {/* Inventory Summary Tab */}
          {activeTab === 'summary' && inventorySummary && !loadingReports && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">📦</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                          <dd className="text-lg font-medium text-gray-900">{inventorySummary.total_products}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">💰</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Stock Value</dt>
                          <dd className="text-lg font-medium text-gray-900">${inventorySummary.total_stock_value.toFixed(2)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">⚠️</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                          <dd className="text-lg font-medium text-gray-900">{inventorySummary.low_stock_items}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">🚨</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                          <dd className="text-lg font-medium text-gray-900">{inventorySummary.out_of_stock_items}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories Breakdown */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Categories Breakdown</h3>
                  {inventorySummary.categories.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product Count
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stock Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {inventorySummary.categories.map((category, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {category.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {category.product_count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${category.stock_value.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No category data available.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Turnover Tab */}
          {activeTab === 'turnover' && !loadingReports && (
            <div className="space-y-6">
              {/* Period Selector */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Turnover Analysis</h3>
                  <div className="flex items-center space-x-4 mb-4">
                    <label className="text-sm font-medium text-gray-700">Period:</label>
                    <select
                      value={turnoverPeriod}
                      onChange={(e) => setTurnoverPeriod(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                    </select>
                  </div>
                  
                  {turnoverData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Beginning Inventory
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ending Inventory
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Units Sold
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Turnover Ratio
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {turnoverData.map((item) => (
                            <tr key={item.product_id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                  <div className="text-sm text-gray-500">{item.sku}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.beginning_inventory}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.ending_inventory}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.units_sold}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.turnover_ratio}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No turnover data available for the selected period.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Low Stock Tab */}
          {activeTab === 'lowstock' && lowStockReport && !loadingReports && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{lowStockReport.summary.total_items}</div>
                      <div className="text-xs text-gray-500">Total Items</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{lowStockReport.summary.critical_items}</div>
                      <div className="text-xs text-gray-500">Critical</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{lowStockReport.summary.high_priority_items}</div>
                      <div className="text-xs text-gray-500">High Priority</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">{lowStockReport.summary.medium_priority_items}</div>
                      <div className="text-xs text-gray-500">Medium Priority</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{lowStockReport.summary.low_priority_items}</div>
                      <div className="text-xs text-gray-500">Low Priority</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">${lowStockReport.summary.total_shortage_value.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Shortage Value</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Items */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Low Stock Items</h3>
                  {lowStockReport.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Warehouse
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Current / Reorder
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Shortage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Priority
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Shortage Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {lowStockReport.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                                  <div className="text-sm text-gray-500">{item.product.sku}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm text-gray-900">{item.warehouse.name}</div>
                                  <div className="text-sm text-gray-500">{item.warehouse.location}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.current_quantity} / {item.reorder_level}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.shortage}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  item.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                  item.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                  item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {item.priority}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${item.shortage_value.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No low stock items found.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
