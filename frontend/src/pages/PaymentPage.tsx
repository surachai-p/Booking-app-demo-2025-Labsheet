// src/pages/PaymentPage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import type { Order, PaymentMethod } from '../types'
import type { AxiosError } from 'axios'

interface PaymentResult {
  payment: { totalAmount: number; amountPaid: number; change: number; method: string }
  change: number
}

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder]       = useState<Order | null>(null)
  const [amountPaid, setAmount] = useState('')
  const [method, setMethod]     = useState<PaymentMethod>('cash')
  const [result, setResult]     = useState<PaymentResult | null>(null)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get<Order>(`/orders/${orderId}`).then(r => { setOrder(r.data); setLoading(false) })
  }, [orderId])

  const handlePay = async () => {
    setError('')
    try {
      const { data } = await api.post<PaymentResult>('/payments', {
        orderId: Number(orderId),
        amountPaid: parseFloat(amountPaid),
        method,
      })
      setResult(data)
    } catch (err) {
      const e = err as AxiosError<{ error: string }>
      setError(e.response?.data?.error ?? 'Payment failed')
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>
  if (!order)  return <div className="text-center py-20 text-gray-400">Order not found</div>

  const total   = Number(order.totalAmount)
  const paid    = parseFloat(amountPaid) || 0
  const preview = paid - total

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">💳 Payment — Order #{order.id}</h1>

      {result ? (
        <div className="card text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-4">Payment Successful!</h2>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-semibold">฿{Number(result.payment.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid</span>
              <span>฿{Number(result.payment.amountPaid).toFixed(2)}</span>
            </div>
            <div className={`flex justify-between text-base font-bold pt-2 border-t ${
              result.change < 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              <span>Change</span>
              <span>฿{Number(result.change).toFixed(2)}{result.change < 0 ? ' ⚠️' : ''}</span>
            </div>
          </div>
          {result.change < 0 && (
            <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left">
              ⚠️ <strong>BUG-001 DETECTED:</strong> System accepted underpayment!
              Change is negative (฿{Number(result.change).toFixed(2)}).
              This should have returned HTTP 400.
            </div>
          )}
          <button className="btn-primary mt-4" onClick={() => navigate('/orders')}>Back to Orders</button>
        </div>
      ) : (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Item</th>
                  <th className="text-center py-2 text-gray-500 font-medium">Qty</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items?.map(i => (
                  <tr key={i.id}>
                    <td className="py-2">{i.menuItem?.name}</td>
                    <td className="py-2 text-center">{i.quantity}</td>
                    <td className="py-2 text-right">฿{Number(i.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-right text-2xl font-bold text-gray-900 mb-6">
            Total: ฿{total.toFixed(2)}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="qr">QR Code</option>
              </select>
            </div>
            <div>
              <label className="label">Amount Paid (THB)</label>
              <input className="input text-lg" type="number" step="0.01" value={amountPaid}
                placeholder={`Min: ${total.toFixed(2)}`}
                onChange={e => setAmount(e.target.value)} />
              {amountPaid && (
                <p className={`text-sm mt-1 font-medium ${preview >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  Change: ฿{preview.toFixed(2)}{preview < 0 ? ' (⚠️ Underpayment — BUG!)' : ''}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-success flex-1 justify-center py-3" onClick={handlePay} disabled={!amountPaid}>
                Process Payment
              </button>
              <button className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
