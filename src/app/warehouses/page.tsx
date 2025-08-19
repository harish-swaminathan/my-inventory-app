'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Warehouse {
  id: string
  name: string
  location: string
  address: string
  is_active: boolean
  created_at: string
}

export default function WarehousesPage() {
  const { user, loading } = useAuth()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loadingWarehouses, setLoadingWarehouses] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    is_active: true
  })

  useEffect(() => {
    if (user) {
      fetchWarehouses()
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

  const fetchWarehouses = async () => {
    try {
      setLoadingWarehouses(true)
      const headers = await getAuthHeaders()
      const response = await fetch('/api/warehouses', { headers })
      const data = await response.json()
      
      if (data.success) {
        setWarehouses(data.data)
      } else {
        setError(data.error?.message || 'Failed to fetch warehouses')
      }
    } catch (err) {
      setError('Failed to fetch warehouses')
    } finally {
      setLoadingWarehouses(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const headers = await getAuthHeaders()
      
      const response = await fetch('/api/warehouses', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        fetchWarehouses()
        resetForm()
        setShowCreateForm(false)
      } else {
        setError(data.error?.message || 'Failed to create warehouse')
      }
    } catch (err) {
      setError('Failed to create warehouse')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      address: '',
      is_active: true
    })
  }

  const cancelCreate = () => {
    setShowCreateForm(false)
    resetForm()
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
          <p className="text-gray-600 mb-6">Please sign in to access warehouse management.</p>
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
              <span className="ml-2 text-sm text-gray-500">Warehouse Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Warehouse
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

          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Warehouse</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Main Warehouse"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="New York, NY"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="123 Storage Street, New York, NY 10001"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Active warehouse
                    </label>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Create Warehouse
                    </button>
                    <button
                      type="button"
                      onClick={cancelCreate}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Warehouses List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Warehouses</h3>
              
              {loadingWarehouses ? (
                <div className="text-center py-4">Loading warehouses...</div>
              ) : warehouses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No warehouses found. Create your first warehouse to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {warehouses.map((warehouse) => (
                    <div key={warehouse.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            {warehouse.name}
                          </h4>
                          {warehouse.location && (
                            <p className="text-sm text-gray-600 mb-2">
                              📍 {warehouse.location}
                            </p>
                          )}
                          {warehouse.address && (
                            <p className="text-sm text-gray-500 mb-3">
                              {warehouse.address}
                            </p>
                          )}
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              warehouse.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {warehouse.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Created: {new Date(warehouse.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          {warehouses.length > 0 && (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {warehouses.length}
                    </div>
                    <div className="text-sm text-gray-500">Total Warehouses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {warehouses.filter(w => w.is_active).length}
                    </div>
                    <div className="text-sm text-gray-500">Active Warehouses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {new Set(warehouses.map(w => w.location?.split(',')[0])).size}
                    </div>
                    <div className="text-sm text-gray-500">Unique Locations</div>
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
