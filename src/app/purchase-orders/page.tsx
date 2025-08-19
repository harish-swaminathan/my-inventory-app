'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PurchaseOrder {
  id: string
  po_number: string
  supplier_name: string
  status: 'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
  total_amount: number
  order_date: string
  expected_date: string
  items: Array<{
    id: string
    product_id: string
    quantity: number
    unit_price: number
    total_price: number
    product: {
      name: string
      sku: string
    }
  }>
}

interface Product {
  id: string
  name: string
  sku: string
}

export default function PurchaseOrdersPage() {
  const { user, loading } = useAuth()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingPOs, setLoadingPOs] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    supplier_name: '',
    expected_date: '',
    items: [{ product_id: '', quantity: '', unit_price: '' }]
  })

  useEffect(() => {
    if (user) {
      fetchPurchaseOrders()
      fetchProducts()
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

  const fetchPurchaseOrders = async () => {
    try {
      setLoadingPOs(true)
      const headers = await getAuthHeaders()
      const response = await fetch('/api/purchase-orders', { headers })
      const data = await response.json()
      
      if (data.success) {
        setPurchaseOrders(data.data)
      } else {
        setError(data.error?.message || 'Failed to fetch purchase orders')
      }
    } catch (err) {
      setError('Failed to fetch purchase orders')
    } finally {
      setLoadingPOs(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const headers = await getAuthHeaders()
      
      const poData = {
        supplier_name: formData.supplier_name,
        expected_date: formData.expected_date,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price)
        }))
      }

      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(poData)
      })

      const data = await response.json()

      if (data.success) {
        fetchPurchaseOrders()
        resetForm()
        setShowCreateForm(false)
      } else {
        setError(data.error?.message || 'Failed to create purchase order')
      }
    } catch (err) {
      setError('Failed to create purchase order')
    }
  }

  const updatePOStatus = async (id: string, status: string) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/purchase-orders/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (data.success) {
        fetchPurchaseOrders()
      } else {
        setError(data.error?.message || 'Failed to update status')
      }
    } catch (err) {
      setError('Failed to update status')
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: '', unit_price: '' }]
    })
  }

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const resetForm = () => {
    setFormData({
      supplier_name: '',
      expected_date: '',
      items: [{ product_id: '', quantity: '', unit_price: '' }]
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ORDERED':
        return 'bg-blue-100 text-blue-800'
      case 'RECEIVED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <p className="text-gray-600 mb-6">Please sign in to access purchase orders.</p>
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
              <span className="ml-2 text-sm text-gray-500">Purchase Orders</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Purchase Order
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Purchase Order</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.supplier_name}
                        onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="ABC Supplier Co."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expected Date</label>
                      <input
                        type="date"
                        value={formData.expected_date}
                        onChange={(e) => setFormData({...formData, expected_date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-900">Items</h4>
                      <button
                        type="button"
                        onClick={addItem}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Add Item
                      </button>
                    </div>
                    
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Product</label>
                          <select
                            required
                            value={item.product_id}
                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
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
                          <label className="block text-sm font-medium text-gray-700">Quantity</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex items-end">
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Create Purchase Order
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false)
                        resetForm()
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

          {/* Purchase Orders List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Orders</h3>
              
              {loadingPOs ? (
                <div className="text-center py-4">Loading purchase orders...</div>
              ) : purchaseOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No purchase orders found. Create your first purchase order to get started.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {purchaseOrders.map((po) => (
                    <div key={po.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{po.po_number}</h4>
                          <p className="text-sm text-gray-600">Supplier: {po.supplier_name}</p>
                          <p className="text-sm text-gray-600">
                            Order Date: {new Date(po.order_date).toLocaleDateString()}
                          </p>
                          {po.expected_date && (
                            <p className="text-sm text-gray-600">
                              Expected: {new Date(po.expected_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                              {po.status}
                            </span>
                            <select
                              value={po.status}
                              onChange={(e) => updatePOStatus(po.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-900 bg-white"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="ORDERED">Ordered</option>
                              <option value="RECEIVED">Received</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            ${po.total_amount?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                      
                      {po.items && po.items.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {po.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-4 py-2 text-sm">
                                    <div>
                                      <div className="font-medium text-gray-900">{item.product?.name}</div>
                                      <div className="text-gray-500">{item.product?.sku}</div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">${item.unit_price?.toFixed(2)}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">${item.total_price?.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
