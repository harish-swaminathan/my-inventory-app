'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Alert {
  id: string
  type: 'LOW_STOCK' | 'OUT_OF_STOCK'
  product_id: string
  warehouse_id: string
  current_quantity: number
  reorder_level: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  created_at: string
  is_acknowledged: boolean
  product: {
    name: string
    sku: string
  }
  warehouse: {
    name: string
  }
}

export default function AlertsPage() {
  const { user, loading } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchAlerts()
    }
  }, [user])

  const getAuthHeaders = async () => {
    const supabase = await import('@/utils/supabase/client').then(m => m.createClient())
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchAlerts = async () => {
    try {
      setLoadingAlerts(true)
      const headers = await getAuthHeaders()
      const response = await fetch('/api/alerts', { headers })
      const data = await response.json()
      
      if (data.success) {
        setAlerts(data.data)
      } else {
        setError(data.error?.message || 'Failed to fetch alerts')
      }
    } catch (err) {
      setError('Failed to fetch alerts')
    } finally {
      setLoadingAlerts(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers
      })

      const data = await response.json()

      if (data.success) {
        fetchAlerts() // Refresh alerts
      } else {
        setError(data.error?.message || 'Failed to acknowledge alert')
      }
    } catch (err) {
      setError('Failed to acknowledge alert')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'OUT_OF_STOCK':
        return '🚨'
      case 'LOW_STOCK':
        return '⚠️'
      default:
        return '📊'
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
          <p className="text-gray-600 mb-6">Please sign in to access alerts.</p>
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

  const criticalAlerts = alerts.filter(alert => alert.severity === 'HIGH')
  const mediumAlerts = alerts.filter(alert => alert.severity === 'MEDIUM')
  const lowAlerts = alerts.filter(alert => alert.severity === 'LOW')

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
              <span className="ml-2 text-sm text-gray-500">Stock Alerts</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchAlerts}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Refresh Alerts
              </button>
              <Link
                href="/"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Critical</dt>
                      <dd className="text-lg font-medium text-gray-900">{criticalAlerts.length}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Medium</dt>
                      <dd className="text-lg font-medium text-gray-900">{mediumAlerts.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">ℹ️</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Low</dt>
                      <dd className="text-lg font-medium text-gray-900">{lowAlerts.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                      <dd className="text-lg font-medium text-gray-900">{alerts.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Alerts</h3>
              
              {loadingAlerts ? (
                <div className="text-center py-4">Loading alerts...</div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-gray-500">No active alerts! All your inventory levels look good.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">
                            {getTypeIcon(alert.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-medium text-gray-900">
                                {alert.product.name}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              SKU: {alert.product.sku} • Warehouse: {alert.warehouse.name}
                            </p>
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Current Stock:</span>
                              <span className={`ml-1 font-medium ${alert.current_quantity === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                                {alert.current_quantity}
                              </span>
                              <span className="text-gray-500 ml-3">Reorder Level:</span>
                              <span className="ml-1 font-medium text-gray-900">{alert.reorder_level}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Acknowledge
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {alerts.length > 0 && (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex space-x-4">
                  <Link
                    href="/inventory"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Manage Inventory
                  </Link>
                  <Link
                    href="/purchase-orders"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Create Purchase Order
                  </Link>
                  <Link
                    href="/reports"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    View Reports
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
