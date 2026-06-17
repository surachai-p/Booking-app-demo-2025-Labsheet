// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MenuPage from './pages/MenuPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import PaymentPage from './pages/PaymentPage'
import ReportsPage from './pages/ReportsPage'
import type { Role } from './types'

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Layout><PrivateRoute><DashboardPage /></PrivateRoute></Layout>} />
          <Route path="/menu" element={<Layout><PrivateRoute><MenuPage /></PrivateRoute></Layout>} />
          <Route path="/orders" element={<Layout><PrivateRoute><OrdersPage /></PrivateRoute></Layout>} />
          <Route path="/orders/:id" element={<Layout><PrivateRoute><OrderDetailPage /></PrivateRoute></Layout>} />
          <Route path="/payment/:orderId" element={<Layout><PrivateRoute><PaymentPage /></PrivateRoute></Layout>} />
          <Route path="/reports" element={
            <Layout>
              <PrivateRoute roles={['admin', 'cashier']}>
                <ReportsPage />
              </PrivateRoute>
            </Layout>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
