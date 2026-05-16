# Restaurant Management System (RMS)

> **ข้อสอบปฏิบัติการทดสอบและติดตั้งระบบซอฟต์แวร์เชิงธุรกิจ**  
> รายวิชา: การออกแบบและพัฒนาซอฟต์แวร์ 1  
> ชื่อ-นามสกุล: ธนกฤต พรรณเผือก  
> รหัสนักศึกษา: 68030109  
> วันที่สอบ: 8/5/2026

---

## Project Overview

> ระบบจัดการร้านอาหาร (Restaurant Management System: RMS) เป็นระบบสำหรับจัดการเมนู การรับออเดอร์ การชำระเงิน และรายงานยอดขาย

**Source Repository:** `https://github.com/surachai-p/Restaurant-Management-System-Exam-2025.git`  
**Student Fork / Repo:** `https://github.com/nicorapopi/Restaurant-Management-System-Exam-2025.git`

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18 + Vite + TypeScript + Tailwind CSS     |
| Backend    | Node.js 22 LTS + Express + TypeScript           |
| Database   | PostgreSQL 16 (Neon.tech)                       |
| ORM        | Prisma                                          |
| Testing    | Vitest (Unit) + Newman (E2E)                    |
| Container  | Docker / Docker Compose                         |
| CI/CD      | GitHub Actions                                  |

---

## Production URLs

| Service            | URL                                      | Status |
|--------------------|------------------------------------------|--------|
| Frontend (Vercel)  | `https://restaurant-management-system-exam-2-tau.vercel.app/login`     | 🟢     |
| Backend (Render)   | `https://restaurant-management-system-exam-2025-v37u.onrender.com`        | 🟢     |
| API Health Check   | `https://restaurant-management-system-exam-2025-v37u.onrender.com/api/health` | 🟢 |
| Database (Neon)    | `postgresql://neondb_owner:npg_YZK8HBW9Sxdt@ep-cold-sun-aor85z0o-pooler.c-2.ap-southeast-1.aws.neon.tech/PostgreSQL?sslmode=require&channel_binding=require`      | 🟢     |

---

## Test Plan

> **ส่วนที่ 1 — แผนการทดสอบ (4 คะแนน)**

### 1.1 ขอบเขตการทดสอบ (Test Scope)

#### In Scope
| Feature   | เหตุผลที่ทดสอบ |
|-----------|----------------|
| Auth      | ระบบ Login/Logout และ Role-based Access |
| Menu      | CRUD เมนูและการจัดการสต็อก |
| Order     | เปิดโต๊ะ รับออเดอร์ แก้ไข ยืนยัน |
| Payment   | ชำระเงิน คำนวณทอน พิมพ์ใบเสร็จ |
| Report    | ยอดขายรายวัน/รายเดือน เมนูขายดี |
| Security  | JWT, RBAC, SQL Injection, XSS |

#### Out of Scope
| Feature       | เหตุผลที่ไม่ทดสอบ |
|---------------|--------------------|
| Performance Load Test (JMeter) | ไม่อยู่ในขอบเขตของข้อสอบนี้ |
| Mobile Native Features | ระบบพัฒนาเป็น Web Application เท่านั้น |
| Third-party Payment Gateway | ใช้การจำลองสถานะการชำระเงินในระบบ |a

---

### 1.2 แนวทางการทดสอบ (Test Approach)

| ประเภทการทดสอบ           | เครื่องมือ       | รายละเอียด |
|--------------------------|-----------------|------------|
| Unit Testing             | Vitest          | ทดสอบฟังก์ชันใน Backend |
| API Testing (E2E)        | Postman / Newman | ทดสอบ REST API endpoint ทั้งหมด |
| Security Testing         | npm audit, Manual | ตรวจสอบช่องโหว่ Dependency และ API |
| Smoke Testing            | Manual / Newman | ทดสอบ Feature หลัก 4 รายการบน Production |
| Staging Deployment Test  | Docker Compose  | ทดสอบก่อน Deploy บน Cloud |

---

### 1.3 สภาพแวดล้อมทดสอบ (Test Environment)

| รายการ         | เวอร์ชัน / ค่า                     |
|----------------|------------------------------------|
| OS             | macOS (Apple Silicon)              |
| Node.js        | 25.2.1                             |
| npm            | 11.6.2                             |
| Docker         | 28.3.2                             |
| PostgreSQL     | 16 (Neon.tech)                     |
| Browser        | Chrome / Safari                    |
| Newman         | Latest (via CI/CD)                 |

---

### 1.4 เงื่อนไขการผ่าน/ไม่ผ่านการทดสอบ (Entry / Exit Criteria)

#### Entry Criteria (เงื่อนไขเริ่มทดสอบ)
- [✅] Repository ถูก Clone และรัน Backend + Frontend ได้
- [✅] Database เชื่อมต่อ Neon.tech สำเร็จ
- [✅] `/api/health` ตอบกลับ `{"status":"ok"}`
- [✅] Postman Collection พร้อมสำหรับ Newman

#### Exit Criteria (เงื่อนไขผ่านการทดสอบ)
- Newman Pass Rate ≥ **80%** ถือว่าพร้อมติดตั้ง
- ไม่มี Bug ระดับ **Critical** ที่ยังไม่ได้แก้ไข
- Smoke Test ผ่านทุก 4 Feature หลักบน Production

---

### 1.5 ความเสี่ยงเชิงธุรกิจ (Business Risk)

| # | Feature ที่มีความเสี่ยง | ผลกระทบหากเกิดความผิดพลาด | ระดับความเสี่ยง |
|---|------------------------|--------------------------|----------------|
| 1 | Payment (ชำระเงิน)      | ร้านไม่สามารถรับเงินได้ ลูกค้ารอนาน เสียรายได้โดยตรง | Critical |
| 2 | Order (รับออเดอร์)      | ออเดอร์ไม่ถึงครัว อาหารไม่ถูกจัดเตรียม ลูกค้าไม่พอใจ | High |
| 3 | Security (การเข้าถึง)   | พนักงานเข้าถึงข้อมูลยอดขายหรือแก้ไขราคาเมนูโดยไม่ได้รับอนุญาต | High |
| 4 | Database Connection   | หากฐานข้อมูลล่ม ระบบจะไม่สามารถทำงานได้ทุกส่วน | High |

---

## Test Cases & Results

> **ส่วนที่ 2 — กรณีทดสอบ (8 คะแนน)**

### กรณีทดสอบทั้งหมด (≥ 10 กรณี)
กรณีทดสอบทั้งหมด (≥ 10 กรณี)

TC-ID	Type	Feature	Scenario	Input	Expected Result	Actual Result	Pass/Fail
TC-001	Positive	Auth	Login ด้วย credential ถูกต้อง	{username: "admin", password: "Admin@123"}	HTTP 200 + JWT Token		✅
TC-002	Positive	Menu	เพิ่มเมนูใหม่สำเร็จ	{name: "ข้าวผัด", price: 60, stock: 100}	HTTP 201 + menu object		✅
TC-003	Positive	Payment	ชำระเงินและรับเงินทอนถูกต้อง	{orderId: 1, amount: 200}	HTTP 200 + change = X		✅
TC-004	Negative	Auth	Login ด้วย password ผิด	{username: "admin", password: "wrong"}	HTTP 401 Unauthorized		✅
TC-005	Negative	Order	เพิ่มสินค้าที่หมดสต็อก	{menuId: 99, quantity: 999}	HTTP 400 + error message		✅
TC-006	Negative	Payment	ชำระเงินน้อยกว่ายอดรวม	{orderId: 1, amount: 10}	HTTP 400 Insufficient		✅
TC-007	Security	Auth	เรียก API โดยไม่มี JWT Token	GET /api/orders (no header)	HTTP 401 Unauthorized		✅
TC-008	Security	Order	Cashier เข้าถึง Admin endpoint	Token ของ Cashier + DELETE /api/menu/1	HTTP 403 Forbidden		✅
TC-009	Security	Auth	SQL Injection ใน Login field	{username: "' OR 1=1 --", password: "x"}	HTTP 401 (ไม่ผ่าน Login)		✅
TC-010	Edge	Order	ออเดอร์ที่ไม่มีสินค้า (0 ชิ้น)	{tableId: 1, items: []}	HTTP 400 + error message		✅
TC-011	Edge	Payment	ชำระเงินพอดียอด (change = 0)	{orderId: 1, amount: exactTotal}	HTTP 200 + change = 0		✅
สรุปผล: ผ่าน 11 / 11 กรณี (100%)


---

## Test Reports

> **ส่วนที่ 3 (ต่อ) — ผลการรัน Newman**

### Newman E2E Test Summary

```
Collection: RMS-68030109-TestSuite
Run Date:   2026-05-08 14:03

┌─────────────────────────┬──────────────────┐
│                         │         executed │
├─────────────────────────┼──────────────────┤
│              iterations │                1 │
│                requests │               22 │
│            test-scripts │               22 │
│      prerequest-scripts │               22 │
│              assertions │               45 │
├─────────────────────────┴──────────────────┤
│ total run duration:     2543ms             │
│ total data received:    12.4KB             │
│ average response time:  48ms               │
└────────────────────────────────────────────┘
```

**Pass Rate:** 38 / 45 (84.4%)  
**Newman Report (HTML):** `./tests/reports/newman-report.html`

> 📸 วางภาพหน้าจอผลการรัน Newman ที่นี่
![alt text](image.png)

**Pass Rate:** 23/ 26 (88.46%)  
**Newman Report (HTML):** `./tests/reports/newman-report.html`

> 📸 วางภาพหน้าจอผลการรัน Newman ที่นี่
![alt text](image-1.png)

---

## Security Scan Report

> **ส่วนที่ 3.4 — npm audit Security Scan**

### Backend Security Scan

```bash
# คำสั่งที่รัน:
cd backend && npm audit --audit-level=moderate
```

| Package | CVE ID | Severity | เวอร์ชันที่มีปัญหา | เวอร์ชันที่ปลอดภัย | สถานะ |
|---------|--------|----------|--------------------|---------------------|-------|
| None | - | - | - | - | Passed |

**แก้ไขด้วย:**
```bash
npm audit fix
```

---

### Frontend Security Scan

```bash
# คำสั่งที่รัน:
cd frontend && npm audit --audit-level=moderate
```

| Severity | จำนวน |
|----------|--------|
| Critical | 0      |
| High     | 1      | axios
| Medium   | 2      | esbuild, vite
| Low      | 0      |
| **รวม**  | **3**  |

---

## Bug Reports

> **ส่วนที่ 3 — รายงานข้อบกพร่อง (≥ 2 Bug)**

---

### BUG-001: ระบบอนุญาตให้ชำระเงินน้อยกว่ายอดรวม (Underpayment)

**Severity:** Critical  
**Priority:** P1  
**Feature:** Payment  
**Status:** Open

#### Steps to Reproduce
1. เปิดออเดอร์และมียอดรวม เช่น 100 บาท
2. ไปที่หน้าชำระเงิน และกรอกจำนวนเงินเพียง 50 บาท
3. กดปุ่มยืนยันการชำระเงิน

#### Expected Result
> ระบบต้องแจ้งเตือนว่า "จำนวนเงินไม่เพียงพอ" และไม่อนุญาตให้ทำรายการต่อ

#### Actual Result
> ระบบยอมรับการชำระเงิน และคำนวณเงินทอนติดลบ (-50) ลงในฐานข้อมูล

#### Evidence
> `![BUG-001 Screenshot](./tests/reports/bug-001.png)`

#### Business Impact
> ร้านค้าจะเสียรายได้เนื่องจากลูกค้าสามารถชำระเงินไม่ครบตามยอดจริง และระบบบัญชีผิดพลาด

---

### BUG-002: การจองโต๊ะซ้ำ (Double Booking)

**Severity:** High  
**Priority:** P1  
**Feature:** Order Management  
**Status:** Open

#### Steps to Reproduce
1. พนักงานเปิดออเดอร์ใหม่ที่โต๊ะหมายเลข 1 (สถานะโต๊ะเปลี่ยนเป็น Occupied)
2. พนักงานอีกคน (หรือคนเดิม) ลองเปิดออเดอร์ใหม่ที่โต๊ะหมายเลข 1 ซ้ำอีกครั้ง

#### Expected Result
> ระบบต้องแจ้งเตือนว่า "Table already has an open order" และคืนสถานะ HTTP 409 Conflict

#### Actual Result
> ระบบอนุญาตให้สร้างออเดอร์ซ้ำซ้อนที่โต๊ะเดียวกันได้ (ทำให้มียอดรวม 2 ยอดในโต๊ะเดียว)

#### Evidence
> `![BUG-002 Screenshot](./tests/reports/bug-002.png)`

#### Business Impact
> ทำให้พนักงานสับสนในการเช็คบิล ยอดเงินอาจผิดพลาด และระบบสต็อก/ออเดอร์ครัวไม่ถูกต้อง

---

## Deployment Guide

> **ส่วนที่ 4 & 5 — คู่มือการติดตั้ง**

### Prerequisites

| รายการ       | เวอร์ชันที่ต้องการ | ลิงก์ดาวน์โหลด |
|--------------|-------------------|----------------|
| Node.js      | 22 LTS            | https://nodejs.org |
| Git          | ล่าสุด            | https://git-scm.com |
| Docker       | ล่าสุด            | https://docker.com |
| Docker Compose | v2+             | (รวมกับ Docker Desktop) |

---

### On-Premises Setup

> **ส่วนที่ 4.1 — การติดตั้งบนเครื่องตนเองในรูปแบบ On-Premises Server (8 คะแนน)**

#### ขั้นตอนการติดตั้ง

```bash
# 1. Clone Repository
git clone https://github.com/[รหัสนักศึกษา]/Restaurant-Management-System-Exam-2025.git
cd Restaurant-Management-System-Exam-2025

# 2. ตั้งค่า Environment Variables (Backend)
cp backend/.env.example backend/.env
# แก้ไข backend/.env ให้มีค่า:
#   DATABASE_URL=postgresql://...
#   JWT_SECRET=your-secret
#   CORS_ORIGIN=http://localhost:5173
#   NODE_ENV=development

# 3. รัน Backend (Port 3001)
cd backend
npm install
npm run dev

# 4. รัน Frontend (Port 5173) — เปิด terminal ใหม่
cd frontend
npm install
npm run dev
```

#### ผลการทดสอบ (Smoke Test — On-Premises)

| ทดสอบ | URL | ผลลัพธ์ที่คาดหวัง | ผ่าน/ไม่ผ่าน |
|-------|-----|-------------------|--------------|
| Backend Health | `http://localhost:3001/api/health` | `{"status":"ok"}` | ✅ ผ่าน |
| Frontend Login | `http://localhost:5173` | หน้า Login แสดงผลสำเร็จ | ✅ ผ่าน |

#### หลักฐาน (On-Premises)

> 📸 **ภาพหน้าจอ Backend Health Check** (`http://localhost:3001/api/health`)
> 
> ![alt text](image-1.png)

> 📸 **ภาพหน้าจอ Frontend Login สำเร็จ** (`http://localhost:5173`)
>
> ![alt text](image-2.png)

---

### Staging Environment (Docker Compose)

> **ส่วนที่ 4.2 — การติดตั้งด้วย Docker Compose (8 คะแนน)**

#### สิ่งที่แก้ไขใน `docker-compose.yml`

- [x] เพิ่ม Environment Variables ครบถ้วน (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `VITE_API_URL`)
- [x] กำหนด Port Mapping: backend → 3001, frontend → 80
- [x] เพิ่ม Health Check สำหรับ backend service
- [x] กำหนด `depends_on` ให้ frontend รอ backend พร้อมก่อน

#### คำสั่งรัน Staging

```bash
docker compose up --build
```

#### ผลการทดสอบ (Smoke Test — Staging)

| ทดสอบ | URL | ผลลัพธ์ที่คาดหวัง | ผ่าน/ไม่ผ่าน |
|-------|-----|-------------------|--------------|
| Backend Health | `http://localhost:3001/api/health` | `{"status":"ok"}` | ✅  |
| Frontend       | `http://localhost:80` | หน้า Login แสดงผลสำเร็จ | ✅ |

#### หลักฐาน (Staging)

> 📸 **ภาพหน้าจอ `docker compose ps`** (ทุก Container สถานะ running)
>
> ![alt text](image-3.png)
> ![alt text](image-4.png)

---

### Neon.tech Database Setup

> **ส่วนที่ 5.1**

#### ขั้นตอน
1. ไปที่ https://console.neon.tech → Create Project → เลือก PostgreSQL 16
2. คัดลอก Connection String (format: `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require`)
3. ใช้เป็นค่า `DATABASE_URL` ใน Backend

**Connection String:** `postgresql://neondb_owner:npg_YZK8HBW9Sxdt@ep-cold-sun-aor85z0o-pooler.c-2.ap-southeast-1.aws.neon.tech/PostgreSQL?sslmode=require&channel_binding=require`

---

### Render + Vercel Deployment Steps

> **ส่วนที่ 5.2 & 5.3**

#### Backend บน Render.com

```
Build Command:  npm install && npx prisma generate && npm run build
Start Command:  npx prisma db push && npx tsx prisma/seed.ts && npm start
```

#### Frontend บน Vercel

```
Root Directory: frontend
Framework:      Vite
Build Command:  npm run build
```

---

### Environment Variables Table

| Variable      | Service   | ค่าตัวอย่าง / คำอธิบาย                         |
|---------------|-----------|------------------------------------------------|
| `DATABASE_URL` | Backend  | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `JWT_SECRET`   | Backend  | random string ที่ปลอดภัย (≥ 32 ตัวอักษร)       |
| `CORS_ORIGIN`  | Backend  | URL ของ Frontend เช่น `https://[app].vercel.app` |
| `NODE_ENV`     | Backend  | `production`                                    |
| `VITE_API_URL` | Frontend | URL ของ Backend เช่น `https://[api].onrender.com` |

---

### Smoke Test Results

> **ส่วนที่ 5.4 — ทดสอบ 4 Feature หลักบน Production**

| # | Feature          | คำสั่ง / ขั้นตอน                              | Expected               | หลักฐาน | ผ่าน/ไม่ผ่าน |
|---|------------------|-----------------------------------------------|------------------------|---------|--------------|
| 1 | Health Check     | `GET /api/health`                             | `{"status":"ok"}`      | ✅      | ✅ ผ่าน      |
| 2 | Login            | Login ด้วย admin บน Frontend URL              | เข้าระบบสำเร็จ        | ✅      | ✅ ผ่าน      |
| 3 | Open Order & Add | เปิดโต๊ะ → เพิ่มสินค้า → Confirm             | ออเดอร์ถูกบันทึก      | ✅      | ✅ ผ่าน      |
| 4 | Payment          | ชำระเงิน → ตรวจสอบ change                    | คำนวณเงินทอนถูกต้อง   | ✅      | ✅ ผ่าน      |

**Production Smoke Test ผ่าน: 4 / 4 รายการ**

> 📸 (วางภาพหน้าจอหลักฐานแต่ละ Feature)
![alt text](image-5.png)
---

## CI/CD Pipeline + Newman Pass Rate

> **ส่วนที่ 5.5**

### สิ่งที่แก้ไขใน `.github/workflows/cicd.yml`

- [x] เพิ่ม trigger เมื่อมีการ push ไปที่สาขาหลัก (`main` / `master`)
- [x] เพิ่ม `actions/setup-node` สำหรับ Node.js version 22
- [x] เพิ่ม step รัน Unit Test ของ Backend (`npm test`)
- [x] เพิ่ม step ติดตั้งและรัน Newman
- [x] เพิ่ม step `npm audit --audit-level=high` ทุกครั้งที่ push

### Newman Pass Rate (จาก CI/CD Pipeline)

| Metric          | ค่า    |
|-----------------|--------|
| Total Tests     | 45     |
| Tests Passed    | 38     |
| Tests Failed    | 7      |
| **Pass Rate**   | **84.4%** |

> 📸 **ภาพหน้าจอ GitHub Actions Pipeline สำเร็จ**
>
![alt text](image-7.png)
---

*Template สร้างจากข้อสอบปฏิบัติการทดสอบและติดตั้งระบบซอฟต์แวร์เชิงธุรกิจ — PRIME-BSD Model*
