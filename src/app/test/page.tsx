'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import Link from 'next/link'

export default function TestPage() {
  const { user, loading } = useAuth()
  const [apiData, setApiData] = useState<Record<string, unknown> | null>(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const testApi = async () => {
    if (!user) return
    
    setApiLoading(true)
    setApiError('')
    
    try {
      // Get the current session token from Supabase
      const supabase = await import('@/utils/supabase/client').then(m => m.createClient())
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        setApiError('No access token available')
        return
      }
      
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setApiData(data.data)
      } else {
        setApiError(data.error?.message || 'API call failed')
      }
    } catch (error) {
      setApiError('Failed to test API')
    } finally {
      setApiLoading(false)
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
          <p className="text-gray-600 mb-6">Please sign in to access the API test page.</p>
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
              <span className="ml-2 text-sm text-gray-500">API Test Page</span>
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
          <div className="space-y-6">
            {/* API Test Section */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  API Authentication Test
                </h2>
                <p className="text-gray-600 mb-6">
                  Test your API authentication and Bearer token functionality.
                </p>
                
                <button
                  onClick={testApi}
                  disabled={apiLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {apiLoading ? 'Testing...' : 'Test API Authentication'}
                </button>
                
                {apiError && (
                  <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <p className="font-medium">Error:</p>
                    <p>{apiError}</p>
                  </div>
                )}
                
                {apiData && (
                  <div className="mt-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    <p className="font-medium">API Test Successful!</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">View Response Data</summary>
                      <pre className="mt-2 text-xs overflow-auto bg-green-100 p-2 rounded">
                        {JSON.stringify(apiData, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>

            {/* API Documentation */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Available API Endpoints</h2>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Core Endpoints</h3>
                      <ul className="space-y-1 text-gray-600">
                        <li>• <code className="bg-gray-100 px-1 rounded">GET /api/products</code> - Get all products</li>
                        <li>• <code className="bg-gray-100 px-1 rounded">POST /api/products</code> - Create product</li>
                        <li>• <code className="bg-gray-100 px-1 rounded">GET /api/inventory</code> - Get inventory levels</li>
                        <li>• <code className="bg-gray-100 px-1 rounded">POST /api/inventory/movement</code> - Record stock movement</li>
                        <li>• <code className="bg-gray-100 px-1 rounded">GET /api/warehouses</code> - Get warehouses</li>
                        <li>• <code className="bg-gray-100 px-1 rounded">GET /api/purchase-orders</code> - Get purchase orders</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Reports & Alerts</h3>
                      <ul className="space-y-1 text-gray-600">
                        <li>• <code className="bg-gray-100 px-1 rounded">GET /api/alerts</code> - Get stock alerts</li>
                        <li>• <code className="bg-gray-100 px-1 rounded">GET /api/reports/inventory-summary</code> - Inventory summary</li>
                        <li>• <code className="bg-gray-100 px-1 rounded">GET /api/reports/turnover</code> - Stock turnover</li>
                        <li>• <code className="bg-gray-100 px-1 rounded">GET /api/reports/low-stock</code> - Low stock report</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <p className="text-blue-800 text-sm">
                      <strong>Note:</strong> All API calls require authentication. Include your Bearer token in the Authorization header.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
