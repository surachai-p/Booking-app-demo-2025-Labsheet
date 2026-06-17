import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';

const BookingEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    fullname: '', email: '', phone: '',
    checkin: '', checkout: '', roomId: '', guests: 1, comment: '', status: 'pending',
  });

  useEffect(() => {
    fetchRooms();
    fetchBooking();
  }, [id]);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(response.data);
    } catch (err) {
      alert('ไม่สามารถดึงรายการห้องพักได้');
    }
  };

  const fetchBooking = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const booking = response.data;
      booking.checkin = booking.checkin.split('T')[0];
      booking.checkout = booking.checkout.split('T')[0];
      booking.roomId = booking.roomId || '';
      setFormData(booking);
      setLoading(false);
    } catch (err) {
      alert('ไม่สามารถดึงข้อมูลการจอง');
      navigate('/admin/bookings');
    }
  };

  const selectedRoom = rooms.find((room) => room.id === Number(formData.roomId));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/bookings/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('แก้ไขข้อมูลสำเร็จ');
      navigate('/admin/bookings');
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  if (loading) return <div className="text-center py-4">กำลังโหลด...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">แก้ไขข้อมูลการจอง</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'ชื่อ-นามสกุล:', name: 'fullname', type: 'text' },
          { label: 'อีเมล:', name: 'email', type: 'email' },
          { label: 'เบอร์โทรศัพท์:', name: 'phone', type: 'tel' },
        ].map(({ label, name, type }) => (
          <div key={name}>
            <label className="block text-gray-700 mb-2">{label}</label>
            <input type={type} name={name} value={formData[name]} onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" required />
          </div>
        ))}

        <div>
          <label className="block text-gray-700 mb-2">วันที่เช็คอิน:</label>
          <input type="date" name="checkin" value={formData.checkin} onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" required />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">วันที่เช็คเอาท์:</label>
          <input type="date" name="checkout" value={formData.checkout} onChange={handleChange}
            min={formData.checkin}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">ประเภทห้องพัก:</label>
          <select name="roomId" value={formData.roomId} onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" required>
            <option value="">กรุณาเลือกประเภทห้องพัก</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} ({room.capacity} ท่าน, {room.price} บาท/คืน)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-2">สถานะการจอง:</label>
          <select name="status" value={formData.status || 'pending'} onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" required>
            <option value="pending">รอดำเนินการ</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="cancelled">ยกเลิก</option>
            <option value="completed">เสร็จสิ้น</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-2">จำนวนผู้เข้าพัก:</label>
          <input type="number" name="guests" value={formData.guests} onChange={handleChange}
            min="1" max={selectedRoom ? selectedRoom.capacity : 4}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">หมายเหตุ:</label>
          <input type="text" name="comment" value={formData.comment || ''} onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex space-x-4">
          <button type="submit"
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
            บันทึก
          </button>
          <button type="button" onClick={() => navigate('/admin/bookings')}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingEdit;
