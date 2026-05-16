// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { RestaurantTable, Order, DailyReport } from '../types'

const fmt = (n: string | number) => Number(n).toFixed(2)

export default function DashboardPage() {
  const { user } = useAuth()
  const [tables, setTables]     = useState<RestaurantTable[]>([])
  const [openOrders, setOrders] = useState<Order[]>([])
  const [daily, setDaily]       = useState<DailyReport | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const requests = [
      api.get<RestaurantTable[]>('/orders/tables'),
      api.get<Order[]>('/orders?status=open'),
      user!.role !== 'waiter' ? api.get<DailyReport>('/reports/daily') : Promise.resolve({ data: null }),
    ] as const
    Promise.all(requests).then(([t, o, d]) => {
      setTables(t.data); setOrders(o.data); setDaily(d.data)
    }).finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>

  const occupied  = tables.filter(t => t.status === 'occupied').length
  const available = tables.filter(t => t.status === 'available').length

  const tableColor: Record<string, string> = {
    available: 'bg-green-50 border-green-200 text-green-700',
    occupied:  'bg-orange-50 border-orange-200 text-orange-700',
    reserved:  'bg-purple-50 border-purple-200 text-purple-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tables', value: tables.length, color: 'text-gray-900' },
          { label: 'Occupied', value: occupied, color: 'text-orange-600' },
          { label: 'Available', value: available, color: 'text-green-600' },
          { label: 'Open Orders', value: openOrders.length, color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {daily && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">฿{fmt(daily.totalRevenue)}</div>
            <div className="text-xs text-gray-500 mt-1">Today's Revenue</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">{daily.totalOrders}</div>
            <div className="text-xs text-gray-500 mt-1">Today's Orders Paid</div>
          </div>
        </div>
      )}

      {/* Table Map */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Table Status</h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {tables.map(t => (
            <div key={t.id}
              className={`border-2 rounded-xl p-3 text-center ${tableColor[t.status] ?? ''}`}>
              <div className="text-lg font-bold">#{t.tableNumber}</div>
              <div className="text-xs mt-1 capitalize">{t.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Open Orders */}
      {openOrders.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Open Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Order#', 'Table', 'Items', 'Total', 'Status', ''].map(h => (
                    <th key={h} className="py-2 px-3 text-left text-xs text-gray-500 uppercase font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openOrders.map(o => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-semibold">#{o.id}</td>
                    <td className="py-2.5 px-3">Table {o.table?.tableNumber ?? o.tableId}</td>
                    <td className="py-2.5 px-3">{o.items?.length ?? 0} items</td>
                    <td className="py-2.5 px-3 font-semibold">฿{fmt(o.totalAmount)}</td>
                    <td className="py-2.5 px-3"><span className={`badge-${o.status}`}>{o.status}</span></td>
                    <td className="py-2.5 px-3">
                      <Link to={`/orders/${o.id}`} className="btn-primary btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
