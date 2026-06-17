const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { spawnSync } = require('child_process');
const path = require('path');

const db = new PrismaClient();

function runPrismaPush() {
  console.log('Applying Prisma schema to database...');
  const result = spawnSync('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error('Prisma schema push failed');
  }
}

async function initDatabase() {
  try {
    await db.$connect();
    console.log('เชื่อมต่อฐานข้อมูล PostgreSQL สำเร็จ');

    runPrismaPush();

    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: adminPassword,
        role: 'admin'
      }
    });

    const defaultRooms = [
      {
        roomType: 'standard',
        name: 'ห้องมาตรฐาน',
        description: 'ห้องพักสำหรับ 1-2 ท่าน พร้อมสิ่งอำนวยความสะดวกพื้นฐาน',
        capacity: 2,
        price: 1200
      },
      {
        roomType: 'deluxe',
        name: 'ห้องดีลักซ์',
        description: 'พื้นที่กว้างขึ้น เหมาะสำหรับ 2-3 ท่าน',
        capacity: 3,
        price: 1800
      },
      {
        roomType: 'suite',
        name: 'ห้องสวีท',
        description: 'ห้องพักขนาดใหญ่สำหรับครอบครัวหรือกลุ่ม',
        capacity: 4,
        price: 2500
      }
    ];

    for (const room of defaultRooms) {
      await db.room.upsert({
        where: { roomType: room.roomType },
        update: room,
        create: room
      });
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล:', error);
    process.exit(1);
  }
}

module.exports = { db, initDatabase };
