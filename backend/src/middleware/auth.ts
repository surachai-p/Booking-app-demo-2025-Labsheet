// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET ?? 'rms-secret-key-2024'

export interface JwtPayload {
  id: number
  username: string
  role: 'admin' | 'cashier' | 'waiter'
  name: string
}

declare global {
  namespace Express {
    interface Request { user?: JwtPayload }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1]
  if (!token) { res.status(401).json({ error: 'Access token required' }); return }
  try {
    req.user = jwt.verify(token, JWT_SECRET) as JwtPayload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export const requireRole = (...roles: Array<'admin' | 'cashier' | 'waiter'>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' }); return
    }
    next()
  }
