import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';

const AdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const totals = response.data.reduce(
          (acc, booking) => {
            acc.total += 1;
            if (acc[booking.status] !== undefined) {
              acc[booking.status] += 1;
            }
            return acc;
          },
          { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 }
        );
        setStats(totals);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
          navigate('/login');
        }
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token, logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">ระบบจัดการห้องพัก</h1>
          <p className="text-gray-600 mt-2">ยินดีต้อนรับ <strong>{user?.username}</strong> ในหน้าหลักของผู้ดูแลระบบ</p>
        </div>
        <button onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          ออกจากระบบ
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">การจองทั้งหมด</h2>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">รอดำเนินการ</h2>
          <p className="text-3xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">ยืนยันแล้ว</h2>
          <p className="text-3xl font-bold">{stats.confirmed}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/bookings"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-2">📋 จัดการการจอง</h2>
          <p className="text-gray-600">ดู แก้ไข และลบข้อมูลการจอง</p>
        </Link>
        <Link to="/admin/rooms"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-2">🏨 จัดการห้องพัก</h2>
          <p className="text-gray-600">จัดการประเภทห้องพักและราคา</p>
        </Link>
        <Link to="/admin/reports"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-2">📊 รายงานการจอง</h2>
          <p className="text-gray-600">สรุปสถานะและสถิติการจอง</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;