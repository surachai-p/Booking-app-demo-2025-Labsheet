// src/pages/OrdersPage.tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import type { Order, RestaurantTable, OrderStatus } from '../types'
import type { AxiosError } from 'axios'

const STATUSES: (OrderStatus | '')[] = ['', 'open', 'confirmed', 'paid', 'cancelled']

export default function OrdersPage() {
  const [orders, setOrders]       = useState<Order[]>([])
  const [tables, setTables]       = useState<RestaurantTable[]>([])
  const [statusFilter, setStatus] = useState<OrderStatus | ''>('open')
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [newTableId, setNewTable] = useState('')
  const [errMsg, setErrMsg]       = useState('')
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const [o, t] = await Promise.all([
      api.get<Order[]>(`/orders${statusFilter ? `?status=${statusFilter}` : ''}`),
      api.get<RestaurantTable[]>('/orders/tables'),
    ])
    setOrders(o.data); setTables(t.data); setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  const handleNewOrder = async () => {
    if (!newTableId) { setErrMsg('Please select a table'); return }
    try {
      const { data } = await api.post<Order>('/orders', { tableId: Number(newTableId) })
      navigate(`/orders/${data.id}`)
    } catch (err) {
      const e = err as AxiosError<{ error: string }>
      setErrMsg(e.response?.data?.error ?? 'Failed to open order')
    }
  }

  const available = tables.filter(t => t.status === 'available')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <button className="btn-success" onClick={() => { setShowNew(!showNew); setErrMsg('') }}>
          + New Order
        </button>
      </div>

      {showNew && (
        <div className="card border-2 border-green-200">
          <h2 className="text-lg font-semibold mb-3">Open New Order</h2>
          {errMsg && <div className="mb-3 text-sm text-red-600">{errMsg}</div>}
          <div className="flex gap-3 items-center flex-wrap">
            <select className="input w-56" value={newTableId} onChange={e => setNewTable(e.target.value)}>
              <option value="">Select available table…</option>
              {available.map(t => (
                <option key={t.id} value={t.id}>Table #{t.tableNumber} (cap: {t.capacity})</option>
              ))}
            </select>
            <button className="btn-success" onClick={handleNewOrder}>Open Order</button>
            <button className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
          </div>
          {available.length === 0 && <p className="text-xs text-red-500 mt-2">No available tables right now</p>}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Order#', 'Table', 'Items', 'Total', 'Status', 'Time', ''].map(h => (
                    <th key={h} className="py-2.5 px-3 text-left text-xs text-gray-500 uppercase font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="py-3 px-3 font-bold">#{o.id}</td>
                    <td className="py-3 px-3">Table {o.table?.tableNumber ?? o.tableId}</td>
                    <td className="py-3 px-3">{o.items?.length ?? 0}</td>
                    <td className="py-3 px-3 font-semibold">฿{Number(o.totalAmount).toFixed(2)}</td>
                    <td className="py-3 px-3"><span className={`badge-${o.status}`}>{o.status}</span></td>
                    <td className="py-3 px-3 text-xs text-gray-400">{new Date(o.createdAt).toLocaleTimeString()}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1.5">
                        <Link to={`/orders/${o.id}`} className="btn-primary btn-sm">View</Link>
                        {o.status === 'confirmed' && (
                          <Link to={`/payment/${o.id}`} className="btn-success btn-sm">Pay</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
