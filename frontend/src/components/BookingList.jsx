import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const { token, logout }       = useAuth();

  useEffect(() => { fetchBookings(); }, [token]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout(); // Token หมดอายุ — ล็อกเอาท์อัตโนมัติ
      } else {
        setError('ไม่สามารถดึงข้อมูลได้: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบข้อมูลการจองนี้?')) return;
    try {
      await axios.delete(`${API_URL}/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBookings();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  if (loading) return <div className="text-center py-4">กำลังโหลดข้อมูล...</div>;
  if (error)   return <div className="text-center py-4 text-red-500">{error}</div>;

  const roomLabel = { standard: 'ห้องมาตรฐาน', deluxe: 'ห้องดีลักซ์', suite: 'ห้องสวีท' };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">รายการจองห้องพัก</h2>
          <p className="text-gray-600 mt-1">จัดการการจอง ดูรายละเอียด และแก้ไขสถานะ</p>
        </div>
        <Link to="/admin/bookings/new"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          + เพิ่มการจอง
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="text-center py-4 text-gray-500">ไม่พบข้อมูลการจอง</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold">{booking.fullname}</h3>
                  <p className="text-xs text-gray-500">สร้างเมื่อ {new Date(booking.createdAt).toLocaleDateString('th-TH')}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  booking.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {booking.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm">อีเมล: {booking.email}</p>
              <p className="text-gray-600 text-sm">เบอร์โทร: {booking.phone}</p>
              <p className="text-gray-600 text-sm">ประเภทห้อง: {roomLabel[booking.roomtype]}</p>
              <p className="text-gray-600 text-sm">
                เช็คอิน: {new Date(booking.checkin).toLocaleDateString('th-TH')}
              </p>
              <p className="text-gray-600 text-sm">
                เช็คเอาท์: {new Date(booking.checkout).toLocaleDateString('th-TH')}
              </p>
              <p className="text-gray-600 text-sm">ผู้เข้าพัก: {booking.guests} ท่าน</p>
              {booking.comment && (
                <p className="text-gray-500 text-sm mt-1 italic">หมายเหตุ: {booking.comment}</p>
              )}
              <div className="mt-4 flex items-center justify-between gap-2">
                <Link to={`/admin/bookings/edit/${booking.id}`}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium">แก้ไข</Link>
                <button onClick={() => handleDelete(booking.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium">ลบ</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingList;