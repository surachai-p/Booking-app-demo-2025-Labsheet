// src/pages/ReportsPage.tsx
import { useEffect, useState } from 'react'
import api from '../services/api'
import type { SalesReport } from '../types'

export default function ReportsPage() {
  const [data, setData]   = useState<SalesReport | null>(null)
  const [start, setStart] = useState('')
  const [end, setEnd]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const params: Record<string, string> = {}
      if (start) params.startDate = start
      if (end)   params.endDate   = end
      const { data: d } = await api.get<SalesReport>('/reports/sales', { params })
      setData(d)
    } catch { setError('Failed to load report') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sales Reports</h1>

      {/* Filter */}
      <div className="card py-4">
        <div className="flex gap-3 items-end flex-wrap">
          {[{ label: 'Start Date', val: start, set: setStart }, { label: 'End Date', val: end, set: setEnd }].map(f => (
            <div key={f.label}>
              <label className="label">{f.label}</label>
              <input type="date" className="input w-40" value={f.val} onChange={e => f.set(e.target.value)} />
            </div>
          ))}
          <button className="btn-primary" onClick={load}>Generate</button>
        </div>
        {start && (
          <p className="mt-2 text-xs text-amber-600">
            ⚠️ BUG-005: Orders from {start} 00:00:00 may be excluded (Op.gt instead of Op.gte).
          </p>
        )}
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {loading && <div className="text-center py-12 text-gray-400">Loading…</div>}

      {data && !loading && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="card text-center">
              <div className="text-3xl font-bold text-blue-600">฿{Number(data.totalRevenue).toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Total Revenue</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-blue-600">{data.totalOrders}</div>
              <div className="text-xs text-gray-500 mt-1">Orders Paid</div>
            </div>
          </div>

          {data.topItems.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Top Selling Items</h2>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  {['#', 'Item', 'Qty', 'Revenue'].map(h => (
                    <th key={h} className="text-left py-2 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {data.topItems.map((item, i) => (
                    <tr key={item.name}>
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 font-medium">{item.name}</td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2 font-semibold text-green-700">฿{item.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  {['ID', 'Order#', 'Total', 'Paid', 'Change', 'Method', 'Time'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-gray-500 font-medium text-xs">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {data.payments.map(p => {
                    const change = Number(p.change)
                    return (
                      <tr key={p.id} className={change < 0 ? 'bg-red-50' : ''}>
                        <td className="py-2 px-2">{p.id}</td>
                        <td className="py-2 px-2">#{p.orderId}</td>
                        <td className="py-2 px-2">฿{Number(p.totalAmount).toFixed(2)}</td>
                        <td className="py-2 px-2">฿{Number(p.amountPaid).toFixed(2)}</td>
                        <td className={`py-2 px-2 font-semibold ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ฿{change.toFixed(2)}{change < 0 ? ' ⚠️' : ''}
                        </td>
                        <td className="py-2 px-2 capitalize">{String(p.method)}</td>
                        <td className="py-2 px-2 text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                  {data.payments.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-gray-400">No payments in range</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
