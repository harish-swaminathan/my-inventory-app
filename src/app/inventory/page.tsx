'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface InventoryItem {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  reorder_level: number
  last_updated: string
  product: {
    name: string
    sku: string
  }
  warehouse: {
    name: string
    location: string
  }
}

interface Product {
  id: string
  name: string
  sku: string
}

interface Warehouse {
  id: string
  name: string
  location: string
}

export default function InventoryPage() {
  const { user, loading } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loadingInventory, setLoadingInventory] = useState(true)
  const [error, setError] = useState('')
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  // Form state
  const [movementData, setMovementData] = useState({
    product_id: '',
    warehouse_id: '',
    type: 'IN',
    quantity: '',
    reference: '',
    notes: ''
  })

  const [updateData, setUpdateData] = useState({
    quantity: '',
    reorder_level: ''
  })

  useEffect(() => {
    if (user) {
      fetchInventory()
      fetchProducts()
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

  const fetchInventory = async () => {
    try {
      setLoadingInventory(true)
      const headers = await getAuthHeaders()
      const response = await fetch('/api/inventory', { headers })
      const data = await response.json()
      
      if (data.success) {
        setInventory(data.data)
      } else {
        setError(data.error?.message || 'Failed to fetch inventory')
      }
    } catch (err) {
      setError('Failed to fetch inventory')
    } finally {
      setLoadingInventory(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/products', { headers })
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch products')
    }
  }

  const fetchWarehouses = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/warehouses', { headers })
      const data = await response.json()
      
      if (data.success) {
        setWarehouses(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch warehouses')
    }
  }

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/inventory/movement', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...movementData,
          quantity: parseInt(movementData.quantity)
        })
      })

      const data = await response.json()

      if (data.success) {
        fetchInventory()
        setShowMovementForm(false)
        setMovementData({
          product_id: '',
          warehouse_id: '',
          type: 'IN',
          quantity: '',
          reference: '',
          notes: ''
        })
      } else {
        setError(data.error?.message || 'Failed to record movement')
      }
    } catch (err) {
      setError('Failed to record movement')
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    setError('')

    try {
      const headers = await getAuthHeaders()
      const updatePayload: Record<string, number> = {}
      
      if (updateData.quantity) {
        updatePayload.quantity = parseInt(updateData.quantity)
      }
      if (updateData.reorder_level) {
        updatePayload.reorder_level = parseInt(updateData.reorder_level)
      }

      const response = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatePayload)
      })

      const data = await response.json()

      if (data.success) {
        fetchInventory()
        setShowUpdateForm(false)
        setSelectedItem(null)
        setUpdateData({ quantity: '', reorder_level: '' })
      } else {
        setError(data.error?.message || 'Failed to update inventory')
      }
    } catch (err) {
      setError('Failed to update inventory')
    }
  }

  const startUpdate = (item: InventoryItem) => {
    setSelectedItem(item)
    setUpdateData({
      quantity: item.quantity.toString(),
      reorder_level: item.reorder_level.toString()
    })
    setShowUpdateForm(true)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    } else if (item.quantity <= item.reorder_level) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800' }
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
          <p className="text-gray-600 mb-6">Please sign in to access inventory management.</p>
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
              <span className="ml-2 text-sm text-gray-500">Inventory Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMovementForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Record Movement
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

          {/* Movement Form */}
          {showMovementForm && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Record Stock Movement</h3>
                <form onSubmit={handleMovementSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product</label>
                      <select
                        required
                        value={movementData.product_id}
                        onChange={(e) => setMovementData({...movementData, product_id: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                      <select
                        required
                        value={movementData.warehouse_id}
                        onChange={(e) => setMovementData({...movementData, warehouse_id: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select Warehouse</option>
                        {warehouses.map(warehouse => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} - {warehouse.location}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Movement Type</label>
                      <select
                        value={movementData.type}
                        onChange={(e) => setMovementData({...movementData, type: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="IN">Stock In</option>
                        <option value="OUT">Stock Out</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={movementData.quantity}
                        onChange={(e) => setMovementData({...movementData, quantity: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reference</label>
                      <input
                        type="text"
                        value={movementData.reference}
                        onChange={(e) => setMovementData({...movementData, reference: e.target.value})}
                        placeholder="PO-001, SO-123, etc."
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <input
                        type="text"
                        value={movementData.notes}
                        onChange={(e) => setMovementData({...movementData, notes: e.target.value})}
                        placeholder="Additional notes"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Record Movement
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMovementForm(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Update Form */}
          {showUpdateForm && selectedItem && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Update Inventory: {selectedItem.product.name}
                </h3>
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={updateData.quantity}
                        onChange={(e) => setUpdateData({...updateData, quantity: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
                      <input
                        type="number"
                        min="0"
                        value={updateData.reorder_level}
                        onChange={(e) => setUpdateData({...updateData, reorder_level: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Update Inventory
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUpdateForm(false)
                        setSelectedItem(null)
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Inventory List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Levels</h3>
              
              {loadingInventory ? (
                <div className="text-center py-4">Loading inventory...</div>
              ) : inventory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No inventory records found. Record some stock movements to get started.</p>
                </div>
              ) : (
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
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Available
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reorder Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventory.map((item) => {
                        const { status, color } = getStockStatus(item)
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
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
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.available_quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.reorder_level}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => startUpdate(item)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Update
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
