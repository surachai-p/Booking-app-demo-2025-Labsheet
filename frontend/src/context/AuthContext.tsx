// src/context/AuthContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react'
import api from '../services/api'
import type { User } from '../types'

interface AuthCtxType {
  user: User | null
  login: (username: string, password: string) => Promise<User>
  logout: () => void
}

const AuthCtx = createContext<AuthCtxType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('rms_user') ?? 'null') as User | null }
    catch { return null }
  })

  const login = async (username: string, password: string): Promise<User> => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', { username, password })
    localStorage.setItem('rms_token', data.token)
    localStorage.setItem('rms_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('rms_token')
    localStorage.removeItem('rms_user')
    setUser(null)
  }

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
