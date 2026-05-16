// src/types/index.ts

export type Role = 'admin' | 'cashier' | 'waiter'
export type Category = 'food' | 'drink' | 'dessert'
export type TableStatus = 'available' | 'occupied' | 'reserved'
export type OrderStatus = 'open' | 'confirmed' | 'paid' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'qr'

export interface User {
  id: number
  username: string
  role: Role
  name: string
}

export interface MenuItem {
  id: number
  name: string
  description?: string
  price: string | number
  category: Category
  isAvailable: boolean
  imageUrl?: string
}

export interface RestaurantTable {
  id: number
  tableNumber: number
  capacity: number
  status: TableStatus
}

export interface OrderItem {
  id: number
  orderId: number
  menuItemId: number
  quantity: number
  unitPrice: string | number
  subtotal: string | number
  menuItem?: MenuItem
}

export interface Order {
  id: number
  tableId: number
  waiterId?: number
  status: OrderStatus
  totalAmount: string | number
  note?: string
  createdAt: string
  table?: RestaurantTable
  waiter?: { id: number; name: string }
  items?: OrderItem[]
  payment?: Payment
}

export interface Payment {
  id: number
  orderId: number
  cashierId?: number
  totalAmount: string | number
  amountPaid: string | number
  change: string | number
  method: PaymentMethod
  createdAt: string
}

export interface DailyReport {
  date: string
  totalOrders: number
  totalRevenue: number
}

export interface SalesReport {
  totalRevenue: number
  totalOrders: number
  payments: Payment[]
  topItems: { name: string; quantity: number; revenue: number }[]
}
