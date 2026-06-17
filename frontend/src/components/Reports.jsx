import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';

const Reports = () => {
  const { token, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchReports(); }, [token]);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data.bookings);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      } else {
        setError('ไม่สามารถดึงข้อมูลรายงานได้');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const response = await axios.get(`${API_URL}/api/reports/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') || `report.${format}`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('ไม่สามารถดาวน์โหลดไฟล์รายงานได้');
    }
  };

  const summaryByRoom = bookings.reduce((acc, booking) => {
    const roomName = booking.room?.name || booking.roomtype;
    acc[roomName] = (acc[roomName] || 0) + 1;
    return acc;
  }, {});

  const summaryByStatus = bookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});

  const totalNights = bookings.reduce((acc, booking) => {
    const checkin = new Date(booking.checkin);
    const checkout = new Date(booking.checkout);
    return acc + Math.max(0, Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24)));
  }, 0);

  if (loading) return <div className="text-center py-8">กำลังสร้างรายงาน...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">รายงานการจอง</h1>
          <p className="text-gray-600 mt-2">ดาวน์โหลด report เป็นไฟล์ CSV หรือ JSON ได้ทันที</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportReport('csv')} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            ดาวน์โหลด CSV
          </button>
          <button onClick={() => exportReport('json')} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            ดาวน์โหลด JSON
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">ยอดการจองทั้งหมด</h2>
          <p className="text-3xl font-bold">{bookings.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">จำนวนคืนทั้งหมด</h2>
          <p className="text-3xl font-bold">{totalNights}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">สถานะการจอง</h2>
          {Object.entries(summaryByStatus).map(([status, count]) => (
            <p key={status} className="text-gray-700">{status}: {count}</p>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">การจองตามประเภทห้อง</h2>
          {Object.entries(summaryByRoom).map(([room, count]) => (
            <p key={room} className="text-gray-700">{room}: {count}</p>
          ))}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">รายการการจองล่าสุด</h2>
          {bookings.slice(0, 5).map((booking) => (
            <div key={booking.id} className="border-b border-gray-200 pb-3 mb-3 last:mb-0 last:border-none">
              <p className="font-medium">{booking.fullname}</p>
              <p className="text-sm text-gray-600">{new Date(booking.createdAt).toLocaleDateString('th-TH')}</p>
              <p className="text-sm text-gray-600">{booking.room?.name || booking.roomtype} | {booking.status}</p>
            </div>
          ))}
          {bookings.length === 0 && <p className="text-gray-500">ยังไม่มีการจอง</p>}
        </div>
      </div>
    </div>
  );
};

export default Reports;
