// แก้ไข IP ด้านล่างให้ตรงกับเครื่องที่รัน backend server
// ตัวอย่าง: ถ้า backend รันที่ IP 192.168.1.100 ให้เปลี่ยนเป็น http://192.168.1.100:3001
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default API_URL;