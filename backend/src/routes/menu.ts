// src/routes/menu.ts
import { Router } from 'express'
import { Category } from '@prisma/client'
import prisma from '../lib/prisma'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()

// GET /api/menu  — list / search
// ⚠️ BUG-003 [SQL Injection]: Raw query with string interpolation
// Students should test: ?search=' OR '1'='1
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, category } = req.query as { search?: string; category?: string }

    if (search) {
      // ✅ FIX BUG-003: Use safe findMany with parameterized search
      const results = await prisma.menuItem.findMany({
        where: {
          isAvailable: true,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      })
      res.json(results)
      return
    }

    const items = await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        ...(category ? { category: category as any } : {}),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/menu/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: Number(req.params.id) } })
    if (!item) { res.status(404).json({ error: 'Menu item not found' }); return }
    res.json(item)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/menu — admin only ✅
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, price, category, imageUrl } = req.body as {
      name?: string; description?: string; price?: number
      category?: Category; imageUrl?: string
    }
    if (!name || price === undefined) {
      res.status(400).json({ error: 'Name and price required' }); return
    }
    const item = await prisma.menuItem.create({ data: { name, description, price, category, imageUrl } })
    res.status(201).json(item)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// PUT /api/menu/:id — ✅ FIXED: admin only
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: Number(req.params.id) } })
    if (!item) { res.status(404).json({ error: 'Menu item not found' }); return }
    const { name, description, price, category, isAvailable, imageUrl } = req.body
    const updated = await prisma.menuItem.update({
      where: { id: Number(req.params.id) },
      data: { name, description, price, category, isAvailable, imageUrl },
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// DELETE /api/menu/:id — soft delete, admin only ✅
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: Number(req.params.id) } })
    if (!item) { res.status(404).json({ error: 'Menu item not found' }); return }
    await prisma.menuItem.update({ where: { id: Number(req.params.id) }, data: { isAvailable: false } })
    res.json({ message: 'Menu item disabled' })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
