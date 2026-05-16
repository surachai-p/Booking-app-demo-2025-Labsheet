// src/routes/reports.ts
import { Router } from 'express'
import prisma from '../lib/prisma'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()

// GET /api/reports/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// ⚠️ BUG-005 [Date Filter]: Uses strictly-greater-than (gt) for startDate
// Orders exactly at midnight of startDate are excluded from results
router.get('/sales', authenticate, requireRole('admin', 'cashier'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string }

    const dateFilter: { gt?: Date; lte?: Date } = {}

    if (startDate) {
      // ⚠️ BUG-005: Should be 'gte' (>=) not 'gt' (>) — off-by-one error
      dateFilter.gt = new Date(startDate)   // WRONG: should be gte
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    const payments = await prisma.payment.findMany({
      where: Object.keys(dateFilter).length ? { createdAt: dateFilter as any } : {},
      include: {
        order: {
          include: {
            items: { include: { menuItem: true } },
          },
        },
        cashier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalRevenue = payments.reduce((s: number, p: any) => s + Number(p.totalAmount), 0)

    // Top selling items
    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {}
    payments.forEach((p: any) => {
      p.order.items.forEach((i: any) => {
        const name = i.menuItem.name
        if (!itemMap[name]) itemMap[name] = { name, quantity: 0, revenue: 0 }
        itemMap[name].quantity += i.quantity
        itemMap[name].revenue += Number(i.subtotal)
      })
    })
    const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    res.json({ totalRevenue, totalOrders: payments.length, payments, topItems })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/reports/daily
router.get('/daily', authenticate, requireRole('admin', 'cashier'), async (_req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
    })
    const revenue = payments.reduce((s: number, p: any) => s + Number(p.totalAmount), 0)
    res.json({ date: today.toDateString(), totalOrders: payments.length, totalRevenue: revenue })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
