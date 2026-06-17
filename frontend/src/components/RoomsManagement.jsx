import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';

const RoomsManagement = () => {
  const { token, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ roomType: '', name: '', description: '', capacity: 1, price: 0 });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      } else {
        setError('ไม่สามารถดึงข้อมูลห้องพักได้');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'capacity' || name === 'price' ? Number(value) : value }));
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ roomType: '', name: '', description: '', capacity: 1, price: 0 });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editId) {
        await axios.put(`${API_URL}/api/rooms/${editId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/api/rooms`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      resetForm();
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = (room) => {
    setEditId(room.id);
    setForm({
      roomType: room.roomType,
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      price: room.price,
    });
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ยืนยันการลบห้องพักนี้?')) return;
    try {
      await axios.delete(`${API_URL}/api/rooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการลบห้องพัก');
    }
  };

  if (loading) return <div className="text-center py-8">กำลังโหลดข้อมูลห้องพัก...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">จัดการประเภทห้องพัก</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">รายการห้องพัก</h2>
          {rooms.length === 0 ? (
            <p className="text-gray-500">ยังไม่มีข้อมูลห้องพักในระบบ</p>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div key={room.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                      <p className="text-gray-600">{room.description}</p>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => handleEdit(room)} className="text-blue-500 hover:text-blue-700 text-sm">
                        แก้ไข
                      </button>
                      <button onClick={() => handleDelete(room.id)} className="text-red-500 hover:text-red-700 text-sm">
                        ลบ
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">ชนิด: {room.roomType}</p>
                  <p className="text-gray-600 text-sm">ความจุ: {room.capacity} ท่าน</p>
                  <p className="text-gray-600 text-sm">ราคา: {room.price} บาท/คืน</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{editId ? 'แก้ไขประเภทห้อง' : 'เพิ่มประเภทห้องใหม่'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Room Type (ตัวอักษรไม่ซ้ำ):</label>
              <input
                type="text"
                name="roomType"
                value={form.roomType}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">ชื่อห้องพัก:</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">รายละเอียด:</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">ความจุ:</label>
              <input
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                min="1"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">ราคา (บาท/คืน):</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
                {editId ? 'บันทึกการแก้ไข' : 'เพิ่มห้องพัก'}
              </button>
              <button type="button" onClick={resetForm} className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600">
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomsManagement;
