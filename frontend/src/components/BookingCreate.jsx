import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';

const BookingCreate = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    checkin: '',
    checkout: '',
    roomId: '',
    guests: 1,
    comment: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${API_URL}/api/rooms`, { headers });
        setRooms(response.data);
      } catch {
        setError('ไม่สามารถดึงข้อมูลห้องพักได้');
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [token]);

  const selectedRoom = rooms.find((room) => room.id === Number(formData.roomId));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.roomId) {
      setError('กรุณาเลือกประเภทห้องพัก');
      return;
    }

    const checkinDate = new Date(formData.checkin);
    const checkoutDate = new Date(formData.checkout);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkinDate < today) {
      setError('กรุณาเลือกวันเช็คอินที่ยังไม่ผ่านมา');
      return;
    }
    if (checkoutDate <= checkinDate) {
      setError('วันเช็คเอาท์ต้องมาหลังวันเช็คอิน');
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setError('กรุณากรอกเบอร์โทรศัพท์ 10 หลัก');
      return;
    }
    if (selectedRoom && formData.guests > selectedRoom.capacity) {
      setError(`จำนวนผู้เข้าพักสูงสุดสำหรับห้องนี้คือ ${selectedRoom.capacity} ท่าน`);
      return;
    }

    try {
      await axios.post(`${API_URL}/api/bookings`, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSuccess('เพิ่มการจองสำเร็จแล้ว');
      setFormData({ fullname: '', email: '', phone: '', checkin: '', checkout: '', roomId: '', guests: 1, comment: '' });
      setTimeout(() => navigate('/admin/bookings'), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">เพิ่มการจองใหม่</h2>

      {error && <div className="bg-red-100 text-red-700 border border-red-400 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 border border-green-400 px-4 py-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'ชื่อ-นามสกุล:', name: 'fullname', type: 'text' },
          { label: 'อีเมล:', name: 'email', type: 'email' },
          { label: 'เบอร์โทรศัพท์:', name: 'phone', type: 'tel' },
        ].map(({ label, name, type }) => (
          <div key={name}>
            <label className="block text-gray-700 mb-2">{label}</label>
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        ))}

        <div>
          <label className="block text-gray-700 mb-2">วันที่เช็คอิน:</label>
          <input
            type="date"
            name="checkin"
            value={formData.checkin}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">วันที่เช็คเอาท์:</label>
          <input
            type="date"
            name="checkout"
            value={formData.checkout}
            onChange={handleChange}
            min={formData.checkin}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">ประเภทห้องพัก:</label>
          <select
            name="roomId"
            value={formData.roomId}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            required
            disabled={loadingRooms || rooms.length === 0}
          >
            {loadingRooms ? (
              <option value="">กำลังโหลดประเภทห้องพัก...</option>
            ) : rooms.length === 0 ? (
              <option value="">ยังไม่มีห้องพักให้เลือก</option>
            ) : (
              <>
                <option value="">กรุณาเลือกประเภทห้องพัก</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.capacity} ท่าน, {room.price} บาท/คืน)
                  </option>
                ))}
              </>
            )}
          </select>
          {!loadingRooms && rooms.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">ยังไม่มีห้องพักให้เลือกในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 mb-2">จำนวนผู้เข้าพัก:</label>
          <input
            type="number"
            name="guests"
            value={formData.guests}
            onChange={handleChange}
            min="1"
            max={selectedRoom ? selectedRoom.capacity : 1}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">หมายเหตุ:</label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
        </div>

        <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          disabled={loadingRooms || rooms.length === 0}>
          บันทึกการจอง
        </button>
      </form>
    </div>
  );
};

export default BookingCreate;
