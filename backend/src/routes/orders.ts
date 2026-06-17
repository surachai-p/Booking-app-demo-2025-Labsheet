// src/routes/orders.ts
import { Router } from 'express'
import prisma from '../lib/prisma'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()

// GET /api/orders/tables
router.get('/tables', authenticate, async (_req, res) => {
  try {
    const tables = await prisma.restaurantTable.findMany({ orderBy: { tableNumber: 'asc' } })
    res.json(tables)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, tableId } = req.query as { status?: string; tableId?: string }
    const orders = await prisma.order.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(tableId ? { tableId: Number(tableId) } : {}),
      },
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
        payment: true,
      },
    })
    if (!order) { res.status(404).json({ error: 'Order not found' }); return }
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/orders — open new order
// ⚠️ BUG-002 [Double Booking]: No check for existing open order on same table
router.post('/', authenticate, async (req, res) => {
  try {
    const { tableId, note } = req.body as { tableId?: number; note?: string }
    if (!tableId) { res.status(400).json({ error: 'tableId required' }); return }

    const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } })
    if (!table) { res.status(404).json({ error: 'Table not found' }); return }

    // ✅ FIX BUG-002: Prevent opening an order on a table that already has an 'open' order
    const existing = await prisma.order.findFirst({ where: { tableId, status: 'open' } })
    if (existing) {
      res.status(409).json({ error: 'Table already has an open order' })
      return
    }

    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: { tableId, waiterId: req.user!.id, status: 'open', note },
      }),
      prisma.restaurantTable.update({ where: { id: tableId }, data: { status: 'occupied' } }),
    ])

    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/orders/:id/items
router.post('/:id/items', authenticate, async (req, res) => {
  try {
    const orderId = Number(req.params.id)
    const { menuItemId, quantity = 1 } = req.body as { menuItemId?: number; quantity?: number }

    const [order, menuItem] = await Promise.all([
      prisma.order.findUnique({ where: { id: orderId } }),
      menuItemId ? prisma.menuItem.findUnique({ where: { id: menuItemId } }) : null,
    ])

    if (!order) { res.status(404).json({ error: 'Order not found' }); return }
    if (order.status !== 'open') { res.status(400).json({ error: 'Order is not open' }); return }
    if (!menuItem?.isAvailable) { res.status(404).json({ error: 'Menu item unavailable' }); return }

    const qty = Number(quantity) || 1
    const unitPrice = Number(menuItem.price)
    const subtotal = unitPrice * qty

    const item = await prisma.orderItem.create({
      data: { orderId, menuItemId: menuItem.id, quantity: qty, unitPrice, subtotal },
      include: { menuItem: true },
    })

    // Recalculate total
    const allItems = await prisma.orderItem.findMany({ where: { orderId } })
    const total = allItems.reduce((s: number, i: {subtotal: any}) => s + Number(i.subtotal), 0)
    await prisma.order.update({ where: { id: orderId }, data: { totalAmount: total } })

    res.status(201).json({ item, totalAmount: total })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// DELETE /api/orders/:id/items/:itemId
router.delete('/:id/items/:itemId', authenticate, async (req, res) => {
  try {
    const orderId = Number(req.params.id)
    const itemId  = Number(req.params.itemId)

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) { res.status(404).json({ error: 'Order not found' }); return }
    if (order.status !== 'open') { res.status(400).json({ error: 'Cannot modify confirmed order' }); return }

    await prisma.orderItem.deleteMany({ where: { id: itemId, orderId } })

    const allItems = await prisma.orderItem.findMany({ where: { orderId } })
    const total = allItems.reduce((s: number, i: {subtotal: any}) => s + Number(i.subtotal), 0)
    await prisma.order.update({ where: { id: orderId }, data: { totalAmount: total } })

    res.json({ message: 'Item removed', totalAmount: total })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// PUT /api/orders/:id/confirm
router.put('/:id/confirm', authenticate, async (req, res) => {
  try {
    const orderId = Number(req.params.id)
    const order = await prisma.order.findUnique({
      where: { id: orderId }, include: { items: true },
    })
    if (!order) { res.status(404).json({ error: 'Order not found' }); return }
    if (order.status !== 'open') { res.status(400).json({ error: 'Order is not open' }); return }
    if (!order.items.length) { res.status(400).json({ error: 'Cannot confirm empty order' }); return }
    const updated = await prisma.order.update({ where: { id: orderId }, data: { status: 'confirmed' } })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', authenticate, requireRole('admin', 'cashier'), async (req, res) => {
  try {
    const orderId = Number(req.params.id)
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) { res.status(404).json({ error: 'Order not found' }); return }
    if (order.status === 'paid') { res.status(400).json({ error: 'Cannot cancel paid order' }); return }
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: 'cancelled' } }),
      prisma.restaurantTable.update({ where: { id: order.tableId }, data: { status: 'available' } }),
    ])
    res.json({ message: 'Order cancelled' })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
