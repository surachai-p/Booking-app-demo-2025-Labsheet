import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BookingForm      from './components/BookingForm';
import BookingList      from './components/BookingList';
import BookingCreate    from './components/BookingCreate';
import BookingEdit      from './components/BookingEdit';
import AdminDashboard   from './components/AdminDashboard';
import RoomsManagement  from './components/RoomsManagement';
import Reports          from './components/Reports';
import ProtectedRoute   from './components/ProtectedRoute';
import Login            from './components/Login';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <NavBar />
          <Routes>
            <Route path="/"       element={<HomePage />} />
            <Route path="/booking" element={<BookingForm />} />
            <Route path="/login"  element={<Login />} />
            <Route path="/admin"
              element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/bookings"
              element={<ProtectedRoute><BookingList /></ProtectedRoute>} />
            <Route path="/admin/bookings/new"
              element={<ProtectedRoute><BookingCreate /></ProtectedRoute>} />
            <Route path="/admin/bookings/edit/:id"
              element={<ProtectedRoute><BookingEdit /></ProtectedRoute>} />
            <Route path="/admin/rooms"
              element={<ProtectedRoute><RoomsManagement /></ProtectedRoute>} />
            <Route path="/admin/reports"
              element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Navigation Bar — แสดงปุ่ม Login หรือ Admin ตาม auth state
const NavBar = () => {
  const { user } = useAuth();
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">ระบบจองห้องพัก</Link>
          <div className="space-x-4">
            <Link to="/"        className="text-gray-600 hover:text-gray-900">หน้าแรก</Link>
            <Link to="/booking" className="text-gray-600 hover:text-gray-900">จองห้องพัก</Link>
            {user ? (
              <Link to="/admin" className="text-gray-600 hover:text-gray-900">สำหรับผู้ดูแล</Link>
            ) : (
              <Link to="/login" className="text-blue-500 hover:text-blue-700 font-medium">เข้าสู่ระบบ</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const HomePage = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold text-center mb-8">ยินดีต้อนรับสู่ระบบจองห้องพัก</h1>
    <div className="text-center">
      <Link to="/booking"
        className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
        จองห้องพักเลย
      </Link>
    </div>
  </div>
);

export default App;