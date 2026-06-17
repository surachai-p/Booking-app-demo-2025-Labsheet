// src/pages/OrderDetailPage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import type { Order, MenuItem } from '../types'
import type { AxiosError } from 'axios'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [menu, setMenu]   = useState<MenuItem[]>([])
  const [selItem, setSel] = useState('')
  const [qty, setQty]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    const [o, m] = await Promise.all([
      api.get<Order>(`/orders/${id}`),
      api.get<MenuItem[]>('/menu'),
    ])
    setOrder(o.data); setMenu(m.data); setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const addItem = async () => {
    if (!selItem) return
    try {
      await api.post(`/orders/${id}/items`, { menuItemId: Number(selItem), quantity: qty })
      setMsg({ type: 'success', text: 'Item added' }); setSel(''); setQty(1); load()
    } catch (err) {
      const e = err as AxiosError<{ error: string }>
      setMsg({ type: 'error', text: e.response?.data?.error ?? 'Failed' })
    }
  }

  const removeItem = async (itemId: number) => {
    if (!confirm('Remove this item?')) return
    try { await api.delete(`/orders/${id}/items/${itemId}`); load() }
    catch { setMsg({ type: 'error', text: 'Failed to remove item' }) }
  }

  const confirmOrder = async () => {
    try { await api.put(`/orders/${id}/confirm`); setMsg({ type: 'success', text: 'Order confirmed!' }); load() }
    catch (err) {
      const e = err as AxiosError<{ error: string }>
      setMsg({ type: 'error', text: e.response?.data?.error ?? 'Failed' })
    }
  }

  const cancelOrder = async () => {
    if (!window.confirm('Cancel this order?')) return
    try { await api.put(`/orders/${id}/cancel`); navigate('/orders') }
    catch { setMsg({ type: 'error', text: 'Failed to cancel' }) }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>
  if (!order)  return <div className="text-center py-20 text-gray-400">Order not found</div>

  const isOpen      = order.status === 'open'
  const isConfirmed = order.status === 'confirmed'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Link to="/orders" className="btn-ghost btn-sm">← Back</Link>
          <h1 className="text-xl font-bold">Order #{order.id} — Table {order.table?.tableNumber}</h1>
          <span className={`badge-${order.status}`}>{order.status}</span>
        </div>
        <div className="flex gap-2">
          {isConfirmed && <Link to={`/payment/${order.id}`} className="btn-success">💳 Pay</Link>}
          {(isOpen || isConfirmed) && <button className="btn-danger" onClick={cancelOrder}>Cancel</button>}
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${
          msg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>{msg.text}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order items */}
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          {!order.items?.length ? (
            <p className="text-gray-400 text-center py-8">No items yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Item</th>
                  <th className="text-center py-2 text-gray-500 font-medium">Qty</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Unit</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Subtotal</th>
                  {isOpen && <th></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td className="py-2.5">{item.menuItem?.name ?? 'Unknown'}</td>
                    <td className="py-2.5 text-center">{item.quantity}</td>
                    <td className="py-2.5 text-right">฿{Number(item.unitPrice).toFixed(2)}</td>
                    <td className="py-2.5 text-right font-semibold">฿{Number(item.subtotal).toFixed(2)}</td>
                    {isOpen && (
                      <td className="py-2.5 text-right">
                        <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="text-right text-xl font-bold mt-4 pt-3 border-t border-gray-100">
            Total: ฿{Number(order.totalAmount).toFixed(2)}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {isOpen && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Add Item</h2>
              <div className="space-y-3">
                <div>
                  <label className="label">Menu Item</label>
                  <select className="input" value={selItem} onChange={e => setSel(e.target.value)}>
                    <option value="">Select item…</option>
                    {menu.map(m => (
                      <option key={m.id} value={m.id}>{m.name} — ฿{Number(m.price).toFixed(2)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input className="input" type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} />
                </div>
                <button className="btn-primary w-full justify-center" onClick={addItem}>Add to Order</button>
              </div>
            </div>
          )}
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Actions</h2>
            {isOpen && (
              <button className="btn-success w-full justify-center" onClick={confirmOrder}
                disabled={!order.items?.length}>✓ Confirm Order</button>
            )}
            {isConfirmed && (
              <Link to={`/payment/${order.id}`} className="btn-success w-full justify-center flex">💳 Process Payment</Link>
            )}
            {(order.status === 'paid' || order.status === 'cancelled') && (
              <p className="text-sm text-gray-500">Order is {order.status}.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
