// src/pages/MenuPage.tsx
import { useEffect, useState, FormEvent } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { MenuItem, Category } from '../types'
import type { AxiosError } from 'axios'

const cats: Category[] = ['food', 'drink', 'dessert']
const catColors: Record<Category, string> = {
  food: 'bg-orange-100 text-orange-700',
  drink: 'bg-blue-100 text-blue-700',
  dessert: 'bg-pink-100 text-pink-700',
}

export default function MenuPage() {
  const { user } = useAuth()
  const [items, setItems]     = useState<MenuItem[]>([])
  const [search, setSearch]   = useState('')
  const [cat, setCat]         = useState<Category | ''>('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [form, setForm]       = useState({ name: '', description: '', price: '', category: 'food' as Category })
  const [msg, setMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (cat)    params.category = cat
      const { data } = await api.get<MenuItem[]>('/menu', { params })
      setItems(data)
    } catch { setMsg({ type: 'error', text: 'Failed to load menu' }) }
    setLoading(false)
  }

  useEffect(() => { load() }, [cat])

  const openForm = (item?: MenuItem) => {
    setEditing(item ?? null)
    setForm(item
      ? { name: item.name, description: item.description ?? '', price: String(item.price), category: item.category }
      : { name: '', description: '', price: '', category: 'food' })
    setShowForm(true); setMsg(null)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/menu/${editing.id}`, form)
        setMsg({ type: 'success', text: 'Menu item updated' })
      } else {
        await api.post('/menu', form)
        setMsg({ type: 'success', text: 'Menu item added' })
      }
      setShowForm(false); load()
    } catch (err) {
      const e = err as AxiosError<{ error: string }>
      setMsg({ type: 'error', text: e.response?.data?.error ?? 'Failed to save' })
    }
  }

  const handleDisable = async (id: number) => {
    if (!confirm('Disable this item?')) return
    try { await api.delete(`/menu/${id}`); load() }
    catch { setMsg({ type: 'error', text: 'Failed to disable item' }) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        {user?.role === 'admin' && (
          <button className="btn-success" onClick={() => openForm()}>+ Add Item</button>
        )}
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${
          msg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>{msg.text}</div>
      )}

      {/* Filter bar */}
      <div className="card py-3">
        <div className="flex gap-2 flex-wrap items-center">
          <input className="input flex-1 min-w-40" value={search}
            onChange={e => setSearch(e.target.value)} placeholder="Search menu…"
            onKeyDown={e => e.key === 'Enter' && load()} />
          <select className="input w-40" value={cat} onChange={e => setCat(e.target.value as Category | '')}>
            <option value="">All categories</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn-primary" onClick={load}>Search</button>
        </div>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="card border-2 border-blue-200">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Item' : 'Add New Item'}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name} required
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Price (THB) *</label>
              <input className="input" type="number" step="0.01" value={form.price} required
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <input className="input" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value as Category }))}>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-success">Save</button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Menu grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColors[item.category]}`}>
                  {item.category}
                </span>
                <span className="text-lg font-bold text-green-600">฿{Number(item.price).toFixed(2)}</span>
              </div>
              <p className="font-semibold text-gray-900">{item.name}</p>
              {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
              <div className="flex gap-2 mt-3">
                <button className="btn-warning btn-sm" onClick={() => openForm(item)}>Edit</button>
                {user?.role === 'admin' && (
                  <button className="btn-danger btn-sm" onClick={() => handleDisable(item.id)}>Disable</button>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">No menu items found</div>
          )}
        </div>
      )}
    </div>
  )
}
