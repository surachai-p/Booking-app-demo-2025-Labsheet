require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const db = require('./database');
const REPORT_DIR = path.join(__dirname, 'reports');
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'เข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณาลองใหม่ใน 1 ชั่วโมง' }
});

app.use('/api/login', loginLimiter);
app.use('/api', generalLimiter);
app.use(express.json({ limit: '10kb' }));

const STATUS_VALUES = ['pending', 'confirmed', 'cancelled', 'completed'];

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'ผู้ใช้ไม่มีสิทธิ์เข้าถึง' });
  }
  next();
};

const validateBookingData = async (data, isUpdate = false) => {
  const errors = [];
  const requiredFields = ['fullname', 'email', 'phone', 'checkin', 'checkout', 'roomId', 'guests'];

  if (!isUpdate) {
    requiredFields.forEach((field) => {
      if (!data[field] && data[field] !== 0) {
        errors.push(`${field} is required`);
      }
    });
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('อีเมลไม่ถูกต้อง');
  }

  if (data.phone && !/^[0-9]{10}$/.test(data.phone)) {
    errors.push('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');
  }

  if (data.checkin && data.checkout) {
    const checkin = new Date(data.checkin);
    const checkout = new Date(data.checkout);
    if (isNaN(checkin) || isNaN(checkout)) {
      errors.push('วันที่ไม่ถูกต้อง');
    } else if (checkout <= checkin) {
      errors.push('วันเช็คเอาท์ต้องอยู่หลังวันเช็คอิน');
    }
  }

  let room = null;
  if (data.roomId !== undefined && data.roomId !== null) {
    room = await db.room.findUnique({ where: { id: Number(data.roomId) } });
    if (!room) {
      errors.push('ไม่พบห้องพักที่เลือก');
    } else if (data.guests !== undefined && Number(data.guests) > room.capacity) {
      errors.push(`จำนวนผู้เข้าพักสูงสุดสำหรับห้องนี้คือ ${room.capacity} ท่าน`);
    }
  } else if (!isUpdate) {
    errors.push('กรุณาเลือกห้องพัก');
  }

  if (data.status && !STATUS_VALUES.includes(data.status)) {
    errors.push('สถานะการจองไม่ถูกต้อง');
  }

  return { errors, room };
};

const normalizeRoomData = (data) => ({
  roomType: data.roomType || data.type,
  name: data.name,
  description: data.description,
  capacity: data.capacity,
  price: data.price
});

const normalizeBookingData = (data) => ({
  ...data,
  fullname: data.fullname || data.guestName,
  email: data.email || data.guestEmail,
  checkin: data.checkin || data.checkIn,
  checkout: data.checkout || data.checkOut,
  guests: data.guests !== undefined ? data.guests : data.numberOfGuests
});

const validateRoomData = (data) => {
  const normalized = normalizeRoomData(data);
  const errors = [];
  if (!normalized.roomType) errors.push('roomType is required');
  if (!normalized.name) errors.push('name is required');
  if (!normalized.description) errors.push('description is required');
  if (normalized.capacity === undefined || normalized.capacity === null || Number.isNaN(Number(normalized.capacity)) || Number(normalized.capacity) < 1) {
    errors.push('capacity ต้องเป็นจำนวนเต็มมากกว่า 0');
  }
  if (normalized.price === undefined || normalized.price === null || Number.isNaN(Number(normalized.price)) || Number(normalized.price) < 0) {
    errors.push('price ต้องเป็นจำนวนเต็มไม่ติดลบ');
  }
  return errors;
};

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'กรุณากรอก username และ password' });
  }

  try {
    const user = await db.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  const bookingData = normalizeBookingData(req.body);
  const { errors, room } = await validateBookingData(bookingData);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    const booking = await db.booking.create({
      data: {
        fullname: bookingData.fullname,
        email: bookingData.email,
        phone: bookingData.phone,
        checkin: new Date(bookingData.checkin),
        checkout: new Date(bookingData.checkout),
        roomtype: room ? room.roomType : bookingData.roomtype,
        roomId: room ? room.id : undefined,
        guests: Number(bookingData.guests),
        comment: bookingData.comment || undefined,
        status: bookingData.status || 'pending'
      }
    });
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const rows = await db.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: { room: true }
    });
    res.json(rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await db.booking.findUnique({
      where: { id: Number(req.params.id) },
      include: { room: true }
    });
    if (!booking) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลการจอง' });
    }
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/bookings/:id', authenticateToken, async (req, res) => {
  const bookingData = normalizeBookingData(req.body);
  const { errors, room } = await validateBookingData(bookingData, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    const updated = await db.booking.update({
      where: { id: Number(req.params.id) },
      data: {
        fullname: bookingData.fullname,
        email: bookingData.email,
        phone: bookingData.phone,
        checkin: new Date(bookingData.checkin),
        checkout: new Date(bookingData.checkout),
        roomtype: room ? room.roomType : bookingData.roomtype,
        roomId: room ? room.id : undefined,
        guests: Number(bookingData.guests),
        comment: bookingData.comment || undefined,
        status: bookingData.status || 'pending'
      }
    });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'ไม่พบข้อมูลการจอง' });
    }
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    await db.booking.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'ลบข้อมูลสำเร็จ', id: req.params.id });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'ไม่พบข้อมูลการจอง' });
    }
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await db.room.findMany({ orderBy: { roomType: 'asc' } });
    res.json(rooms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/rooms', authenticateToken, requireAdmin, async (req, res) => {
  const roomData = normalizeRoomData(req.body);
  const errors = validateRoomData(roomData);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    const room = await db.room.create({
      data: {
        roomType: roomData.roomType,
        name: roomData.name,
        description: roomData.description,
        capacity: Number(roomData.capacity),
        price: Number(roomData.price)
      }
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/rooms/:id', authenticateToken, requireAdmin, async (req, res) => {
  const errors = validateRoomData(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  try {
    const updated = await db.room.update({
      where: { id: Number(req.params.id) },
      data: {
        roomType: req.body.roomType,
        name: req.body.name,
        description: req.body.description,
        capacity: Number(req.body.capacity),
        price: Number(req.body.price)
      }
    });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'ไม่พบข้อมูลห้องพัก' });
    }
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/rooms/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.room.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'ลบห้องพักสำเร็จ', id: req.params.id });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'ไม่พบข้อมูลห้องพัก' });
    }
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const bookings = await db.booking.findMany({ include: { room: true }, orderBy: { createdAt: 'desc' } });
    const summaryByRoom = bookings.reduce((acc, booking) => {
      const name = booking.room?.name || booking.roomtype;
      acc[name] = (acc[name] || 0) + 1;
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
    res.json({ bookings, summaryByRoom, summaryByStatus, totalNights, totalBookings: bookings.length });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/reports/export', authenticateToken, async (req, res) => {
  const format = req.query.format === 'json' ? 'json' : 'csv';
  try {
    const bookings = await db.booking.findMany({ include: { room: true }, orderBy: { createdAt: 'desc' } });
    const reportData = bookings.map((booking) => ({
      id: booking.id,
      fullname: booking.fullname,
      email: booking.email,
      phone: booking.phone,
      room: booking.room?.name || booking.roomtype,
      roomType: booking.room?.roomType || booking.roomtype,
      guests: booking.guests,
      status: booking.status,
      checkin: booking.checkin.toISOString(),
      checkout: booking.checkout.toISOString(),
      comment: booking.comment || '',
      createdAt: booking.createdAt.toISOString(),
      roomPrice: booking.room?.price || ''
    }));

    const fileName = `report-${Date.now()}.${format}`;
    const filePath = path.join(REPORT_DIR, fileName);

    if (format === 'json') {
      const content = JSON.stringify(reportData, null, 2);
      fs.writeFileSync(filePath, content, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(content);
    } else {
      const header = 'id,fullname,email,phone,room,roomType,guests,status,checkin,checkout,comment,createdAt,roomPrice';
      const rows = reportData.map((row) =>
        [row.id, row.fullname, row.email, row.phone, row.room, row.roomType, row.guests, row.status,
          row.checkin, row.checkout, `"${String(row.comment).replace(/"/g, '""')}"`, row.createdAt, row.roomPrice]
          .join(',')
      );
      const content = [header, ...rows].join('\n');
      fs.writeFileSync(filePath, content, 'utf-8');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(content);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
