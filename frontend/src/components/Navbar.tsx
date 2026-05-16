// src/components/Navbar.tsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav className="bg-gray-900 text-white h-14 flex items-center px-6 shadow-lg">
      <span className="text-lg font-bold tracking-wide mr-8">🍽️ RMS</span>
      <div className="flex gap-1 flex-1">
        {[
          { to: '/', label: 'Dashboard', end: true },
          { to: '/menu', label: 'Menu', end: false },
          { to: '/orders', label: 'Orders', end: false },
          ...(user?.role !== 'waiter' ? [{ to: '/reports', label: 'Reports', end: false }] : []),
        ].map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`
            }
          >{label}</NavLink>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-300">{user?.name}</span>
        <span className={`badge-${user?.role} text-xs`}>{user?.role}</span>
        <button onClick={handleLogout}
          className="text-xs px-3 py-1 border border-gray-600 rounded-md text-gray-300 hover:border-red-400 hover:text-red-400 transition-colors">
          Logout
        </button>
      </div>
    </nav>
  )
}
