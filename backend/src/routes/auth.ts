// src/routes/auth.ts
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { authenticate, JWT_SECRET } from '../middleware/auth'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string }
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' }); return
    }
    const user = await prisma.user.findFirst({ where: { username, isActive: true } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' }); return
    }
    const payload = { id: user.id, username: user.username, role: user.role, name: user.name }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })
    res.json({ token, user: payload })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user })
})

export default router
