// tests/api/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// Mock Prisma before importing app
vi.mock('../../src/lib/prisma', () => ({
  default: {
    user: {
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
      createMany: vi.fn(),
    },
    menuItem: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
    },
    restaurantTable: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
    },
    order: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    orderItem: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn() },
    payment: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn(), create: vi.fn() },
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
    $transaction: vi.fn().mockResolvedValue([]),
  },
}))

import app from '../../src/app'

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.version).toBe('2.0.0')
  })
})

describe('POST /api/auth/login — input validation', () => {
  it('returns 400 when body is empty', async () => {
    const res = await request(app).post('/api/auth/login').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 400 when username is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'x' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin' })
    expect(res.status).toBe(400)
  })

  it('returns 401 when user does not exist', async () => {
    const { default: prisma } = await import('../../src/lib/prisma')
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null)
    const res = await request(app).post('/api/auth/login').send({ username: 'ghost', password: 'pw' })
    expect(res.status).toBe(401)
  })
})

describe('Protected routes — 401 without token', () => {
  const tests: [string, string, string][] = [
    ['GET',  '/api/menu',         'Menu list'],
    ['GET',  '/api/orders',       'Order list'],
    ['POST', '/api/orders',       'Create order'],
    ['POST', '/api/payments',     'Create payment'],
    ['GET',  '/api/reports/sales','Sales report'],
    ['GET',  '/api/auth/me',      'Me endpoint'],
  ]

  tests.forEach(([method, path, label]) => {
    it(`${label}: ${method} ${path} → 401`, async () => {
      const res = await (request(app) as any)[method.toLowerCase()](path)
      expect(res.status).toBe(401)
    })
  })
})

describe('GET /api/auth/me — invalid token', () => {
  it('returns 401 for malformed JWT', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.invalid')
    expect(res.status).toBe(401)
  })
})
