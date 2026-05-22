# Lab: CI/CD with GitHub Actions — ระบบจองห้องพักออนไลน์

## วัตถุประสงค์การทดลอง

1. อธิบายหลักการและกระบวนการ CI/CD (Continuous Integration / Continuous Deployment) สำหรับ Full-Stack Application
2. Clone และทำความเข้าใจโครงสร้างโปรเจกต์ Node.js/Express + React/Vite
3. รัน Application ด้วย Docker Compose ในเครื่อง Local
4. เรียนรู้การใช้ Newman สำหรับ API Testing ใน CI Pipeline
5. สร้างและวิเคราะห์ GitHub Actions Workflow สำหรับ Automated Testing และ Deployment
6. เพิ่ม Security Scanning Job ใน CI/CD Pipeline เพื่อตรวจสอบช่องโหว่อัตโนมัติ
7. รัน Post-Deployment Smoke Tests เพื่อยืนยันระบบทำงานถูกต้องบน Production
8. Deploy Frontend ไปยัง Vercel และ Backend ไปยัง Render หรือ Railway
9. จัดการ Multi-Environment (QA, Staging, Production) ด้วย Branch Strategy

---

## เครื่องมือที่ต้องใช้

| เครื่องมือ | รายละเอียด |
|---|---|
| Git และ GitHub Account | Version control และ repository hosting |
| Docker Desktop | รัน containers ในเครื่อง local |
| Node.js 20 LTS | JavaScript runtime สำหรับ backend |
| npm | Package manager |
| Newman (CLI) | รัน Postman collections จาก command line |
| Code Editor | VS Code (แนะนำ) |
| Vercel Account | Deploy frontend (สมัครฟรีที่ vercel.com) |
| Render Account | Deploy backend (สมัครฟรีที่ render.com) |
| Railway Account | (ทางเลือก) Deploy backend ที่ railway.app |

---

## ภาพรวมสถาปัตยกรรมระบบ

```
┌─────────────────────────────────────────────────────────┐
│                 booking-app-demo-2025                   │
├─────────────────────────┬───────────────────────────────┤
│        frontend/        │          backend/             │
│   React + Vite          │   Node.js + Express           │
│   Tailwind CSS          │   Prisma ORM                  │
│   → Deploy: Vercel      │   PostgreSQL                  │
│                         │   JWT Authentication          │
│                         │   → Deploy: Render/Railway    │
└─────────────────────────┴───────────────────────────────┘
```

### API Endpoints หลัก

| Method | Endpoint | คำอธิบาย | สิทธิ์ |
|---|---|---|---|
| `POST` | `/api/login` | เข้าสู่ระบบ (รับ JWT token) | Public |
| `GET` | `/api/bookings` | ดูรายการจองทั้งหมด | Admin |
| `POST` | `/api/bookings` | สร้างการจองใหม่ | Public |
| `PUT` | `/api/bookings/:id` | แก้ไขการจอง | Admin |
| `DELETE` | `/api/bookings/:id` | ยกเลิกการจอง | Admin |
| `GET` | `/api/rooms` | ดูรายการห้องทั้งหมด | Public |
| `POST` | `/api/rooms` | เพิ่มห้องใหม่ | Admin |
| `PUT` | `/api/rooms/:id` | แก้ไขข้อมูลห้อง | Admin |
| `DELETE` | `/api/rooms/:id` | ลบห้อง | Admin |
| `GET` | `/api/reports` | ดูรายงาน | Admin |
| `GET` | `/api/reports/export` | Export รายงาน (CSV/JSON) | Admin |

---

## ⚠️ ส่วนที่ 0: ตั้งค่าสำหรับ Windows (ต้องทำก่อนเริ่มทดลอง)

> **นักศึกษาที่ใช้ macOS หรือ Linux** — ข้ามส่วนนี้ไปได้เลย เริ่มที่ส่วนที่ 1
>
> **นักศึกษาที่ใช้ Windows** — ต้องทำส่วนนี้ให้ครบก่อน มิฉะนั้นจะเจอ error ระหว่างทดลองอย่างแน่นอน

---

### ทำไม Windows ถึงมีปัญหาพิเศษ?

Windows และ Linux/macOS ใช้รูปแบบ **การขึ้นบรรทัดใหม่ (Line Endings)** ต่างกัน:

| OS | ชื่อ | ตัวอักษรที่ใช้ | ย่อ |
|---|---|---|---|
| Windows | CRLF | Carriage Return + Line Feed | `\r\n` |
| Linux / macOS | LF | Line Feed เท่านั้น | `\n` |

**ผลกระทบ**: Shell script (`.sh`) ที่ถูกแก้ไขบน Windows จะมี `\r` ปนอยู่ท้ายทุกบรรทัด เมื่อ Docker นำ script ไปรันบน Linux ภายใน container จะเกิด error:

```
exec ./docker-entrypoint.sh: no such file or directory
```

เพราะ Linux อ่าน shebang บรรทัดแรกว่า `#!/bin/sh\r` แล้วหา interpreter ชื่อ `/bin/sh\r` ซึ่งไม่มีอยู่จริง

นอกจากนี้ command หลายตัวในใบงานเป็น **Bash syntax** ซึ่ง CMD และ PowerShell รองรับไม่ครบ ต้องใช้ **Git Bash** แทน

---

### ขั้นตอนที่ 0.1: ติดตั้งโปรแกรมที่จำเป็น

**Git for Windows** (ถ้ายังไม่มี):

1. ดาวน์โหลดที่ [git-scm.com/download/win](https://git-scm.com/download/win)
2. ระหว่างติดตั้ง ให้เลือกตัวเลือกต่อไปนี้:
   - **Adjusting your PATH**: เลือก `Git from the command line and also from 3rd-party software`
   - **Line ending conversions**: เลือก **`Checkout as-is, commit as-is`** ← สำคัญมาก
   - **Default terminal**: เลือก `Use Git Bash as default terminal emulator`

**ตรวจสอบว่าติดตั้งสำเร็จ** (เปิด Git Bash แล้วพิมพ์):

```bash
git --version   # ควรเห็น git version 2.x.x
node --version  # ควรเห็น v20.x.x
docker --version
```

---

### ขั้นตอนที่ 0.2: ตั้งค่า Git ไม่ให้แปลง Line Endings

```bash
# ปิดการแปลง line endings อัตโนมัติ (สำคัญที่สุด)
git config --global core.autocrlf false

# ตรวจสอบว่าตั้งค่าถูกต้อง
git config --global core.autocrlf
# ต้องเห็น: false
```

**คำอธิบาย**: ค่า default ของ Git for Windows คือ `core.autocrlf=true` ซึ่งจะแปลง LF → CRLF ทุกครั้งที่ checkout ทำให้ shell script เสียหายโดยอัตโนมัติ

---

### ขั้นตอนที่ 0.3: ตั้งค่า VS Code ให้ใช้ LF

เปิด VS Code แล้วทำตามขั้นตอน:

1. กด `Ctrl + Shift + P` → พิมพ์ `Open User Settings (JSON)`
2. เพิ่มบรรทัดต่อไปนี้:

```json
{
  "files.eol": "\n",
  "editor.tabSize": 2,
  "[yaml]": {
    "editor.tabSize": 2
  }
}
```

3. บันทึกไฟล์ (`Ctrl + S`)

ต่อจากนี้ VS Code จะบันทึกทุกไฟล์ใหม่ด้วย LF เสมอ

**ตรวจสอบ**: มุมขวาล่างของ VS Code จะแสดง `LF` (ถ้าเห็น `CRLF` ให้คลิกแล้วเปลี่ยนเป็น `LF`)

```
[VS Code Status Bar]
  Ln 1, Col 1   Spaces: 2   UTF-8   LF   ← ต้องเห็น LF ตรงนี้
```

---

### ขั้นตอนที่ 0.4: ตั้งค่า Terminal ใน VS Code ให้ใช้ Git Bash

1. ใน VS Code กด `Ctrl + Shift + P` → พิมพ์ `Terminal: Select Default Profile`
2. เลือก **Git Bash**
3. เปิด terminal ใหม่ด้วย `Ctrl + `` ` `` ` (backtick)
4. ตรวจสอบว่าใช้ Git Bash จริง:

```bash
echo $SHELL
# ควรเห็น: /usr/bin/bash หรือ /bin/bash
```

> **หมายเหตุ**: คำสั่งทุกคำสั่งในใบงานนี้ต้องรันใน **Git Bash เท่านั้น** ไม่ใช่ CMD หรือ PowerShell

---

### ขั้นตอนที่ 0.5: สร้างไฟล์ `.gitattributes` เพื่อล็อก Line Endings

หลังจาก Clone repository แล้ว (ทำในส่วนที่ 1.2) ให้สร้างไฟล์นี้**ทันที ก่อนแตะไฟล์อื่น**:

```bash
# รันใน Git Bash ที่ root ของ project
cat > .gitattributes << 'EOF'
# Enforce LF for all files that run on Linux/Docker
*.sh            text eol=lf
Dockerfile      text eol=lf
docker-compose.yml text eol=lf
.env*           text eol=lf
*.md            text eol=lf
*.json          text eol=lf
*.js            text eol=lf
*.prisma        text eol=lf
*.yml           text eol=lf
*.yaml          text eol=lf
EOF
```

Commit ไฟล์นี้ทันที:

```bash
git add .gitattributes
git commit -m "chore: enforce LF line endings for Docker compatibility"
```

จากนั้น normalize ไฟล์ทั้งหมดที่อาจมี CRLF อยู่แล้ว:

```bash
git rm --cached -r .
git reset --hard
```

**ตรวจสอบผล** — ไฟล์ entrypoint ต้องไม่มี `^M` (ซึ่งคือ `\r`):

```bash
cat -A backend/docker-entrypoint.sh | head -5
# ต้องเห็น $ ท้ายทุกบรรทัด  →  #!/bin/sh$
# ถ้าเห็น ^M$ แสดงว่ายัง CRLF  →  #!/bin/sh^M$
```

---

### ขั้นตอนที่ 0.6: เพิ่ม `sed` ใน Dockerfile เป็น Safety Net

แม้ตั้งค่าถูกต้องแล้ว ควรเพิ่มบรรทัดนี้ใน `backend/Dockerfile` ไว้เป็นตัวป้องกันชั้นสุดท้าย เผื่อมีไฟล์ CRLF หลุดรอดเข้ามา:

```dockerfile
# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' ./docker-entrypoint.sh   # ← เพิ่มบรรทัดนี้
RUN chmod +x ./docker-entrypoint.sh
```

**คำอธิบาย**: `sed -i 's/\r$//'` ลบ `\r` ออกจากท้ายทุกบรรทัดภายใน container ทำให้ถึงแม้ไฟล์จะ CRLF script ก็ยังรันได้

---

### ขั้นตอนที่ 0.7: ตรวจสอบ Command ที่แตกต่างระหว่าง OS

| Bash (Git Bash) | CMD | PowerShell | ใช้ในใบงาน |
|---|---|---|---|
| `export VAR=value` | `set VAR=value` | `$env:VAR="value"` | ✅ Git Bash |
| `ls -la` | `dir` | `Get-ChildItem` | ✅ Git Bash |
| `cat file` | `type file` | `Get-Content file` | ✅ Git Bash |
| `find . -name "*.json"` | `dir /s *.json` | `Get-ChildItem -r` | ✅ Git Bash |
| `sleep 5` | `timeout 5` | `Start-Sleep 5` | ✅ Git Bash |
| `curl -X POST ...` | จำกัด | จำกัด | ✅ Git Bash |
| `for i in {1..10}` | ❌ | ❌ | ✅ Git Bash |

---

### Checklist ก่อนเริ่มส่วนที่ 1

- [ ] ติดตั้ง Git for Windows สำเร็จ
- [ ] `git config --global core.autocrlf` แสดงค่า `false`
- [ ] VS Code ตั้งค่า `files.eol: "\n"` แล้ว
- [ ] VS Code ใช้ Git Bash เป็น default terminal
- [ ] มุมขวาล่าง VS Code แสดง `LF` (ไม่ใช่ `CRLF`)
- [ ] สร้างและ commit `.gitattributes` แล้ว (ทำหลัง Clone ในส่วนที่ 1.2)
- [ ] เพิ่ม `sed -i 's/\r$//'` ใน `Dockerfile` แล้ว

---

## ส่วนที่ 1: เตรียมโปรเจกต์จาก Repository ที่มีอยู่

### ขั้นตอนที่ 1.1: Fork Repository

เนื่องจาก code ถูกเตรียมไว้แล้ว ให้ทำการ Fork เพื่อให้มีสำเนาใน GitHub Account ของตนเอง:

1. ไปที่ `https://github.com/surachai-p/booking-app-demo-2025`
2. คลิกปุ่ม **Fork** (มุมขวาบน)
3. เลือก Account ของตนเองเป็น Owner
4. ตั้งชื่อ Repository (แนะนำให้คงชื่อเดิม `booking-app-demo-2025`)
5. คลิก **Create fork**

**คำอธิบาย**: การ Fork ทำให้เราได้สำเนา repository มาไว้ใน account ตัวเอง ซึ่งจำเป็นสำหรับการตั้งค่า GitHub Actions Secrets และ Deployment ในขั้นตอนต่อไป

### ขั้นตอนที่ 1.2: Clone Repository มายัง Local Machine

> 🪟 **Windows**: ต้องรันคำสั่งทั้งหมดใน **Git Bash** เท่านั้น (ไม่ใช่ CMD หรือ PowerShell)

```bash
git clone https://github.com/<your-username>/booking-app-demo-2025.git
cd booking-app-demo-2025
```

> 🪟 **Windows เพิ่มเติม**: หลัง Clone แล้วให้ทำขั้นตอนต่อไปนี้**ทันที ก่อนแตะไฟล์อื่น** เพื่อป้องกันปัญหา CRLF ที่จะทำให้ Docker container รัน entrypoint script ไม่ได้
>
> ```bash
> # สร้าง .gitattributes เพื่อล็อก line endings ทุกไฟล์เป็น LF
> cat > .gitattributes << 'EOF'
> *.sh            text eol=lf
> Dockerfile      text eol=lf
> docker-compose.yml text eol=lf
> .env*           text eol=lf
> *.md            text eol=lf
> *.json          text eol=lf
> *.js            text eol=lf
> *.prisma        text eol=lf
> *.yml           text eol=lf
> *.yaml          text eol=lf
> EOF
>
> # Commit ทันที
> git add .gitattributes
> git commit -m "chore: enforce LF line endings for Docker compatibility"
>
> # Normalize ไฟล์ทั้งหมดให้เป็น LF
> git rm --cached -r .
> git reset --hard
>
> # ตรวจสอบว่า entrypoint เป็น LF แล้ว (ต้องเห็น $ ไม่ใช่ ^M$)
> cat -A backend/docker-entrypoint.sh | head -3
> ```
>
> จากนั้นเพิ่มบรรทัด `sed` ใน `backend/Dockerfile` เป็น safety net สุดท้าย:
>
> ```dockerfile
> COPY docker-entrypoint.sh ./
> RUN sed -i 's/\r$//' ./docker-entrypoint.sh   # ← เพิ่มบรรทัดนี้
> RUN chmod +x ./docker-entrypoint.sh
> ```

**ตรวจสอบโครงสร้างโปรเจกต์**:

```bash
# ดูโครงสร้างโฟลเดอร์ระดับบนสุด
ls -la
```

โครงสร้างที่ควรเห็น:

```
booking-app-demo-2025/
├── frontend/              ← React + Vite Application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── backend/               ← Node.js + Express API
│   ├── prisma/
│   │   └── schema.prisma
│   ├── routes/
│   ├── middleware/
│   ├── package.json
│   ├── server.js
│   └── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md
```

**คำอธิบาย**:
- `frontend/`: React application ที่ใช้ Vite เป็น build tool และ Tailwind CSS สำหรับ styling
- `backend/`: Express API ที่ใช้ Prisma ORM เชื่อมต่อ PostgreSQL
- `.github/workflows/`: GitHub Actions workflow definitions

### ขั้นตอนที่ 1.3: ทำความเข้าใจ Dependencies

**ตรวจสอบ Backend Dependencies** (`backend/package.json`):

```bash
cat backend/package.json
```

Dependencies สำคัญที่ควรสังเกต:
- `express`: Web framework หลัก
- `@prisma/client`: Prisma ORM client สำหรับ query database
- `jsonwebtoken` (jwt): ออก JWT token สำหรับ authentication
- `bcryptjs`: Hash password อย่างปลอดภัย
- `cors`: จัดการ Cross-Origin Resource Sharing

**ตรวจสอบ Frontend Dependencies** (`frontend/package.json`):

```bash
cat frontend/package.json
```

Dependencies สำคัญที่ควรสังเกต:
- `react`, `react-dom`: Core React library
- `vite`: Build tool และ dev server
- `tailwindcss`: Utility-first CSS framework
- `axios`: HTTP client สำหรับเรียก API

---

## ส่วนที่ 2: ทำความเข้าใจ Database Schema (Prisma)

### ขั้นตอนที่ 2.1: อ่าน Prisma Schema

```bash
cat backend/prisma/schema.prisma
```

Schema ประกอบด้วย models หลัก:

```prisma
// ตัวอย่างโครงสร้าง schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  role      String   @default("admin")
  createdAt DateTime @default(now())
}

model Room {
  id          Int       @id @default(autoincrement())
  name        String
  type        String
  capacity    Int
  price       Float
  description String?
  createdAt   DateTime  @default(now())
  bookings    Booking[]
}

model Booking {
  id          Int      @id @default(autoincrement())
  guestName   String
  guestEmail  String
  checkIn     DateTime
  checkOut    DateTime
  totalPrice  Float
  status      String   @default("confirmed")
  createdAt   DateTime @default(now())
  room        Room     @relation(fields: [roomId], references: [id])
  roomId      Int
}
```

**คำอธิบาย**:
- `@id @default(autoincrement())`: Primary key ที่เพิ่มค่าอัตโนมัติ
- `@unique`: ค่าในคอลัมน์นี้ต้องไม่ซ้ำกัน
- `@relation`: กำหนดความสัมพันธ์ระหว่าง models (Booking มี roomId อ้างอิง Room)
- `@default(now())`: บันทึก timestamp อัตโนมัติเมื่อสร้าง record

**คำถาม 2.1**: จาก schema นี้ ความสัมพันธ์ระหว่าง `Room` และ `Booking` เป็นแบบใด (one-to-one / one-to-many / many-to-many)? อธิบายเหตุผล

```plaintext
# ตอบคำถามที่นี่

```

---

## ส่วนที่ 3: รัน Application ด้วย Docker Compose (Local Development)

### ขั้นตอนที่ 3.1: ตั้งค่า Environment Variables

```bash
cd backend
cp .env.example .env
```

เปิดไฟล์ `.env` และตรวจสอบค่าที่ต้องกำหนด:

```env
# Database Connection (สำหรับ Docker local)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking_dev"

# JWT Authentication Secret
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Server Configuration
PORT=3001
NODE_ENV=development
```

**หมายเหตุความปลอดภัย**: ไฟล์ `.env` ต้องอยู่ใน `.gitignore` เสมอ ห้าม commit ข้อมูล credential จริงขึ้น repository

### ขั้นตอนที่ 3.2: Start Database ด้วย Docker

```bash
# ยังอยู่ใน backend/ directory
docker compose up -d

# ตรวจสอบว่า PostgreSQL ทำงาน
docker compose ps
```

ผลลัพธ์ที่ควรเห็น:

```
NAME                STATUS
booking_postgres    Up (healthy)
```

### ขั้นตอนที่ 3.3: ตรวจสอบ Migration Files และ Start ด้วย Docker Compose

**ทำความเข้าใจการแบ่งหน้าที่ก่อนเริ่ม:**

| งาน | ทำโดย | เมื่อไหร่ |
|---|---|---|
| ติดตั้ง npm packages | Dockerfile (`npm ci`) | ตอน build image |
| สร้าง Prisma client | Dockerfile (`prisma generate`) | ตอน build image |
| รอ database + apply migrations | entrypoint script (อัตโนมัติ) | ทุกครั้งที่ container start |
| สร้าง migration files | `prisma migrate dev` บนเครื่อง | **ครั้งแรกเท่านั้น** |

> **หมายเหตุ**: `npm install` และ `npx prisma generate` **ไม่ต้องรันในเครื่อง** เพราะ Dockerfile จัดการให้ภายใน container แล้ว entrypoint script รับหน้าที่รอ database พร้อมและ apply migration ให้อัตโนมัติ

**ขั้นตอนที่ 1 — ตรวจสอบว่า migration files มีอยู่แล้วหรือไม่**

```bash
ls backend/prisma/migrations/
```

- ถ้าเห็นโฟลเดอร์ ที่เป็นตัวเลข_init ดูว่ามีไฟล์ `migration.sql` → ข้ามไปขั้นตอนที่ 2 เลย
- ถ้าโฟลเดอร์ว่างเปล่าหรือไม่มีโฟลเดอร์ → ต้องสร้างก่อน:

```bash
# Start เฉพาะ database ก่อน
docker compose up -d db

# รอ database พร้อม
sleep 5

# สร้าง migration files บนเครื่อง (รันครั้งเดียว)
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking_app" \
npx prisma migrate dev --name init

# ตรวจสอบว่า migration files ถูกสร้างแล้ว
ls prisma/migrations/
```

> 🪟 **Windows (Git Bash)**: คำสั่ง `DATABASE_URL="..." npx ...` แบบ inline ใช้งานได้ใน Git Bash ปกติ ไม่ต้องเปลี่ยน syntax

**ขั้นตอนที่ 2 — Start ทุก services**

```bash
docker compose up -d
```

entrypoint script จะทำงานต่อไปนี้ **อัตโนมัติภายใน container** (ไม่ต้องพิมพ์คำสั่งเอง):
- รอให้ PostgreSQL พร้อมรับ connection
- Apply migration files กับ database (`prisma migrate deploy`)
- Start backend server

**ขั้นตอนที่ 3 — ยืนยันว่า migrations สำเร็จ**

```bash
docker compose logs backend
```

ผลลัพธ์ที่ควรเห็น:

```
Waiting for database to be ready...
Database is ready!
Attempting to run Prisma migrations...
Starting application...
Server running on port 3001
```

> **ถ้าเห็น error `prisma: command not found`** ใน logs
> แก้ไขโดยเปิดไฟล์ `backend/package.json` และตรวจสอบว่า `prisma`
> อยู่ใน `dependencies` (ไม่ใช่ `devDependencies`) แล้วรัน `docker compose up -d --build` ใหม่
>
> **ถ้าเห็น error `exec ./docker-entrypoint.sh: no such file or directory`** (Windows เท่านั้น)
> แสดงว่า entrypoint ยังมี CRLF ให้กลับไปทำขั้นตอนที่ 0.5 และ 0.6 ให้ครบ แล้ว build ใหม่:
> ```bash
> docker compose down
> docker compose build --no-cache backend
> docker compose up -d
> ```

### ขั้นตอนที่ 3.4: ตรวจสอบ Database Structure (ไม่บังคับ)

> Dependencies ถูกติดตั้งแค่ใน Docker container ตอน build image ดังนั้นต้องรัน `npm install` บนเครื่อง host ก่อน จึงจะใช้ `npx prisma` ได้

```bash
cd backend

# ติดตั้ง dependencies บนเครื่อง host ก่อน
npm install

# ตั้งค่า DATABASE_URL (database ต้องทำงานอยู่)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking_app"

# เปิด Prisma Studio
npx prisma studio
# จะเปิด browser ที่ http://localhost:5555
```

> 🪟 **Windows**: ถ้าเจอ `No database URL found` ให้ตรวจสอบ `.env` ด้วย `cat -A .env` ว่ามี `^M$` หรือไม่ ถ้ามีให้รัน `sed -i 's/\r$//' .env` แล้ว export DATABASE_URL แบบ inline แทน

### ขั้นตอนที่ 3.5: Start Frontend

เปิด terminal ใหม่:

```bash
cd frontend
npm install
npm run dev
```

เปิด browser ที่ `http://localhost:5173` ควรเห็นหน้า Booking System

### ขั้นตอนที่ 3.6: ทดสอบ API Endpoints ด้วย curl

> 🪟 **Windows**: รันใน **Git Bash** คำสั่ง `export` และ multi-line `curl` ใช้งานได้ปกติ

```bash
# --- Public Endpoints (ไม่ต้อง login) ---

# ดูรายการห้องทั้งหมด
curl http://localhost:3001/api/rooms

# สร้างการจองใหม่
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "สมชาย ใจดี",
    "guestEmail": "somchai@example.com",
    "roomId": 1,
    "checkIn": "2025-08-01",
    "checkOut": "2025-08-03"
  }'

# --- Admin Endpoints (ต้อง login ก่อน) ---

# Login เพื่อรับ JWT Token
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# นำ token ที่ได้มาใช้ (แทนที่ YOUR_JWT_TOKEN)
export TOKEN="YOUR_JWT_TOKEN"

# ดูรายการจองทั้งหมด (ต้องมี token)
curl http://localhost:3001/api/bookings \
  -H "Authorization: Bearer $TOKEN"

# ดูรายงาน
curl http://localhost:3001/api/reports \
  -H "Authorization: Bearer $TOKEN"
```

**บันทึกผลการทดสอบ**:

```plaintext
# วาง output จาก curl ที่นี่



```

### ขั้นตอนที่ 3.7: Cleanup

```bash
# หยุด backend server: Ctrl+C ใน terminal นั้น
# หยุด frontend: Ctrl+C ใน terminal นั้น

# หยุด database container
cd backend
docker compose down

# หยุดพร้อมลบข้อมูล (ถ้าต้องการ reset database)
docker compose down -v
```

---

## ส่วนที่ 4: API Testing ด้วย Newman

Newman คือ Command-line runner สำหรับ Postman Collections ใช้รัน API tests โดยอัตโนมัติใน CI pipeline

### ขั้นตอนที่ 4.1: ติดตั้ง Newman

```bash
npm install -g newman newman-reporter-htmlextra
```

> 🪟 **Windows**: รันใน Git Bash ปกติ ถ้าเจอ permission error ให้เปิด Git Bash **Run as Administrator** แล้วรันซ้ำ

### ขั้นตอนที่ 4.2: ทำความเข้าใจโครงสร้าง Postman Collection

Newman ใช้ไฟล์ `.json` ที่ export จาก Postman ตรวจสอบว่ามีไฟล์ collection ในโปรเจกต์:

```bash
# หา collection files
find . -name "*.json" | grep -i collection
# หรือ
find . -name "*.postman_collection.json"
```

ถ้ายังไม่มีไฟล์ collection ให้สร้าง `tests/booking-api.postman_collection.json`:

```json
{
  "info": {
    "name": "Booking API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001"
    },
    {
      "key": "authToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login - Success",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status is 200', () => {",
                  "  pm.response.to.have.status(200);",
                  "});",
                  "pm.test('Returns JWT token', () => {",
                  "  const json = pm.response.json();",
                  "  pm.expect(json).to.have.property('token');",
                  "  pm.collectionVariables.set('authToken', json.token);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\"username\": \"admin\", \"password\": \"admin123\"}"
            },
            "url": "{{baseUrl}}/api/login"
          }
        },
        {
          "name": "Login - Wrong Password",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status is 401', () => {",
                  "  pm.response.to.have.status(401);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\"username\": \"admin\", \"password\": \"wrongpassword\"}"
            },
            "url": "{{baseUrl}}/api/login"
          }
        }
      ]
    },
    {
      "name": "Rooms",
      "item": [
        {
          "name": "Get All Rooms",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status is 200', () => {",
                  "  pm.response.to.have.status(200);",
                  "});",
                  "pm.test('Returns array', () => {",
                  "  const json = pm.response.json();",
                  "  pm.expect(json).to.be.an('array');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/rooms"
          }
        },
        {
          "name": "Create Room (Admin)",
          "event": [
            {
              "listen": "prerequest",
              "script": {
                "exec": [
                  "const suffix = Math.floor(Math.random() * 100000);",
                  "pm.collectionVariables.set('roomSuffix', suffix);"
                ]
              }
            },
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status is 201', () => {",
                  "  pm.response.to.have.status(201);",
                  "});",
                  "pm.test('Room has id', () => {",
                  "  const json = pm.response.json();",
                  "  pm.expect(json).to.have.property('id');",
                  "  pm.collectionVariables.set('roomId', json.id);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {"key": "Content-Type", "value": "application/json"},
              {"key": "Authorization", "value": "Bearer {{authToken}}"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"name\": \"Deluxe Room {{roomSuffix}}\", \"roomType\": \"Deluxe-{{roomSuffix}}\", \"description\": \"Deluxe room with premium amenities\", \"capacity\": 2, \"price\": 1500}"
            },
            "url": "{{baseUrl}}/api/rooms"
          }
        }
      ]
    },
    {
      "name": "Bookings",
      "item": [
        {
          "name": "Create Booking (Public)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status is 201', () => {",
                  "  pm.response.to.have.status(201);",
                  "});",
                  "pm.test('Booking has id', () => {",
                  "  const json = pm.response.json();",
                  "  pm.expect(json).to.have.property('id');",
                  "  pm.collectionVariables.set('bookingId', json.id);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\"fullname\": \"Test Guest\", \"email\": \"test@example.com\", \"phone\": \"0123456789\", \"roomId\": {{roomId}}, \"checkin\": \"2025-09-01\", \"checkout\": \"2025-09-03\", \"guests\": 2}"
            },
            "url": "{{baseUrl}}/api/bookings"
          }
        },
        {
          "name": "Get All Bookings (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status is 200', () => {",
                  "  pm.response.to.have.status(200);",
                  "});",
                  "pm.test('Returns array', () => {",
                  "  pm.expect(pm.response.json()).to.be.an('array');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{authToken}}"}],
            "url": "{{baseUrl}}/api/bookings"
          }
        }
      ]
    },
    {
      "name": "Reports",
      "item": [
        {
          "name": "Get Reports (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status is 200', () => {",
                  "  pm.response.to.have.status(200);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{authToken}}"}],
            "url": "{{baseUrl}}/api/reports"
          }
        },
        {
          "name": "Export Reports - Unauthorized",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status is 401 without token', () => {",
                  "  pm.response.to.have.status(401);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/reports/export"
          }
        }
      ]
    }
  ]
}
```

### ขั้นตอนที่ 4.3: รัน Newman Tests

ก่อนรัน ต้องให้ backend และ database ทำงานอยู่ (ทำตาม ส่วนที่ 3 ก่อน):

```bash
# รัน tests แบบ basic
newman run tests/booking-api.postman_collection.json

# รัน tests พร้อม HTML report
newman run tests/booking-api.postman_collection.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export ./newman-report.html

# เปิดดู report
open newman-report.html        # macOS
xdg-open newman-report.html   # Linux
start newman-report.html       # Windows (Git Bash)
```

> 🪟 **Windows**: ถ้า `start newman-report.html` ไม่ทำงาน ให้เปิด File Explorer แล้วดับเบิลคลิกไฟล์ `newman-report.html` แทน

**แนบรูปผลการทดสอบ Newman**:

```plaintext
# แนบ screenshot ผลการทดสอบที่นี่

```

**คำถาม 4.3**: Newman tests ที่เขียนมีการทดสอบทั้ง positive cases (สำเร็จ) และ negative cases (ล้มเหลว) อธิบายให้ครบอย่างน้อย 2 ตัวอย่าง

```plaintext
# ตอบคำถามที่นี่

```

---

## ส่วนที่ 5: ทำความเข้าใจ GitHub Actions Workflow ที่มีอยู่

### ขั้นตอนที่ 5.1: อ่าน Workflow File ที่มีอยู่

```bash
cat .github/workflows/ci.yml
```

Workflow ที่มีอยู่ใช้ self-hosted runner และทำงานพื้นฐาน วิเคราะห์โครงสร้าง:

| ส่วน | ค่า | ความหมาย |
|---|---|---|
| `on.push.branches` | `[main]` | Trigger เมื่อ push ไปที่ main |
| `runs-on` | `self-hosted` | ใช้ runner ของตัวเอง |
| `actions/checkout@v4` | - | Checkout source code |
| `actions/setup-node@v4` | `node-version: '20'` | ติดตั้ง Node.js 20 |

**คำถาม 5.1**: ทำไม workflow ปัจจุบันถึงใช้ `self-hosted` runner? มีข้อดีข้อเสียอะไรเมื่อเทียบกับ `ubuntu-latest`?

```plaintext
# ตอบคำถามที่นี่

```

### ขั้นตอนที่ 5.2: วิเคราะห์ข้อจำกัดของ Workflow ปัจจุบัน

Workflow ปัจจุบันยังขาดส่วนสำคัญหลายอย่าง ระบุข้อจำกัดต่อไปนี้:

| สิ่งที่ขาด | เหตุผลที่ควรมี |
|---|---|
| ❌ ไม่มี API Testing (Newman) | ต้องทดสอบ API ก่อน deploy |
| ❌ ไม่มี Frontend Build & Test | ต้องแน่ใจว่า React app build สำเร็จ |
| ❌ ไม่มีขั้นตอน Deployment | ไม่มี CD ในวงจร |
| ❌ ไม่มี Multi-environment | ขาด QA/Staging/Production separation |
| ❌ ไม่มี Security scanning | ควรสแกน vulnerabilities |

---

## ส่วนที่ 6: สร้าง CI/CD Workflow ที่สมบูรณ์

### ขั้นตอนที่ 6.1: สร้างไฟล์ Workflow หลัก

สร้างไฟล์ `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline — Booking App

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '20'

jobs:
  # ─────────────────────────────────────────────
  # Job 1: Backend CI — Install, Migrate, Test
  # ─────────────────────────────────────────────
  backend-test:
    name: Backend Tests (Newman API)
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: booking_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install backend dependencies
        run: |
          cd backend
          npm ci

      - name: Generate Prisma client
        run: |
          cd backend
          npx prisma generate --schema=prisma/schema.prisma

      - name: Run database migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/booking_test
        run: |
          cd backend
          npx prisma migrate deploy --schema=prisma/schema.prisma

      - name: Seed test data
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/booking_test
          JWT_SECRET: ci-test-secret-key
          NODE_ENV: test
        run: |
          cd backend
          node -e "
            const { PrismaClient } = require('@prisma/client');
            const bcrypt = require('bcryptjs');
            const prisma = new PrismaClient();
            async function seed() {
              const hash = await bcrypt.hash('admin123', 10);
              await prisma.user.upsert({
                where: { username: 'admin' },
                update: {},
                create: { username: 'admin', password: hash, role: 'admin' }
              });
              await prisma.room.create({
                data: { name: 'Test Room 101', roomType: 'Standard', capacity: 2, price: 1000 }
              });
              console.log('Seed completed');
            }
            seed().catch(console.error).finally(() => prisma.\$disconnect());
          "

      - name: Start backend server
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/booking_test
          JWT_SECRET: ci-test-secret-key
          PORT: 3001
          NODE_ENV: test
        run: |
          cd backend
          npm start &
          sleep 5
          curl -f http://localhost:3001/api/rooms || (echo "Server not ready" && exit 1)

      - name: Install Newman
        run: npm install -g newman newman-reporter-htmlextra

      - name: Run Newman API Tests
        run: |
          newman run tests/booking-api.postman_collection.json \
            --env-var "baseUrl=http://localhost:3001" \
            --reporters cli,junit \
            --reporter-junit-export newman-results.xml

      - name: Upload Newman test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: newman-test-results
          path: newman-results.xml

  # ─────────────────────────────────────────────
  # Job 2: Frontend CI — Install, Build, Lint
  # ─────────────────────────────────────────────
  frontend-build:
    name: Frontend Build & Lint
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci

      - name: Build frontend
        env:
          VITE_API_URL: http://localhost:3001
        run: |
          cd frontend
          npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist/

  # ─────────────────────────────────────────────
  # Job 3: Deploy Frontend to Vercel
  # ─────────────────────────────────────────────
  deploy-frontend:
    name: Deploy Frontend → Vercel
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel (Production)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          cd frontend
          vercel --prod \
            --token $VERCEL_TOKEN \
            --yes

  # ─────────────────────────────────────────────
  # Job 4: Deploy Backend to Render
  # ─────────────────────────────────────────────
  deploy-backend-render:
    name: Deploy Backend → Render
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Trigger Render Deployment
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"

      - name: Wait for Render deployment (180s)
        run: sleep 180

      - name: Health check — Backend on Render
        run: |
          TIMEOUT=300
          INTERVAL=10
          ELAPSED=0
          while [ $ELAPSED -lt $TIMEOUT ]; do
            echo "Health check attempt... (${ELAPSED}/${TIMEOUT}s)"
            if curl -f --connect-timeout 5 --max-time 10 "${{ secrets.RENDER_BACKEND_URL }}/api/rooms" > /dev/null 2>&1; then
              echo "✅ Render deployment successful!"
              exit 0
            fi
            sleep $INTERVAL
            ELAPSED=$((ELAPSED + INTERVAL))
          done
          echo "❌ Render health check failed after ${TIMEOUT}s"
          exit 1

```

**คำอธิบาย Workflow**:

**Job 1 — backend-test**: รัน Newman API tests พร้อม PostgreSQL service container ซึ่งถูกสร้างอัตโนมัติใน GitHub Actions environment ไม่ต้องติดตั้ง Docker เพิ่มเติม

**Job 2 — frontend-build**: ตรวจสอบว่า React app สามารถ build สำเร็จ พร้อม upload build artifacts

**Job 3 — deploy-frontend**: Deploy ไปยัง Vercel โดยใช้ Vercel CLI และ secret token ทำงานเฉพาะเมื่อ push ไปที่ `main`

**Job 4 & 5 — deploy-backend**: Deploy backend ไปยัง Render หรือ Railway ทั้งสองรันพร้อมกัน (parallel) เพื่อประหยัดเวลา

**Flow diagram**:

```
Push to main
    ↓
┌────────────────────┬──────────────────────┐
│  backend-test      │  frontend-build      │
│  (Newman + Prisma) │  (Vite build)        │
└────────┬───────────┴───────────┬──────────┘
         │   (ทั้งสองต้องผ่าน)  │
         └──────────┬────────────┘
                    ↓
    ┌───────────────┬──────────────────┬──────────────┐
    │ deploy-       │ deploy-backend-  │ deploy-      │
    │ frontend      │ render           │ backend-     │
    │ (Vercel)      │                  │ railway      │
    └───────────────┴──────────────────┴──────────────┘
```

---

## ส่วนที่ 7: Multi-Environment Strategy

### ขั้นตอนที่ 7.1: ทำความเข้าใจ Branch Strategy

```
feature/* → develop → staging → main
              ↓           ↓        ↓
             QA        Staging  Production
```

| Branch | Environment | เมื่อ Push |
|---|---|---|
| `develop` | QA | Auto-deploy ไป QA environment |
| `staging` | Staging | Auto-deploy ไป Staging environment |
| `main` | Production | Auto-deploy ไป Production |
| `feature/*` | — | รัน CI tests เท่านั้น |

### ขั้นตอนที่ 7.2: สร้าง QA Workflow

สร้างไฟล์ `.github/workflows/deploy-qa.yml`:

```yaml
name: Deploy to QA

on:
  push:
    branches: [ develop ]

jobs:
  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: booking_qa
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - name: Install and test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/booking_qa
          JWT_SECRET: qa-test-secret
        run: |
          cd backend
          npm ci
          npx prisma generate
          npx prisma migrate deploy
          # รัน tests

  deploy-qa:
    name: Deploy to QA
    runs-on: ubuntu-latest
    needs: backend-test
    environment: qa           # ← ใช้ GitHub Environment สำหรับจัดการ secrets แยก
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Frontend to Vercel (QA)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm install -g vercel
          cd frontend
          vercel --token $VERCEL_TOKEN --yes
          # ไม่ใช้ --prod เพื่อให้ deploy เป็น preview URL

      - name: Deploy Backend to Render (QA)
        run: |
          curl -X POST "${{ secrets.RENDER_QA_DEPLOY_HOOK }}"

```

### ขั้นตอนที่ 7.3: ตั้งค่า GitHub Environments

1. ไปที่ GitHub Repository → **Settings** → **Environments**
2. สร้าง environment ต่อไปนี้:

| Environment | Branch | Protection |
|---|---|---|
| `qa` | `develop` | ไม่มี (auto-deploy) |
| `staging` | `staging` | Required reviewer 1 คน |
| `production` | `main` | Required reviewer 2 คน + wait timer 5 นาที |

3. เพิ่ม secrets แยกในแต่ละ environment เพื่อป้องกัน secrets ของ production รั่วไหลไปยัง QA

---

## ส่วนที่ 8: ตั้งค่า Cloud Platforms

### ขั้นตอนที่ 8.1: ตั้งค่า Vercel (Frontend)

1. **เชื่อม Repository กับ Vercel**:
   - ไปที่ [vercel.com](https://vercel.com) →
   - เลือก Overview -> เลือก ... ที่ Account ของตนเอง -> View
   - ด้านขวา เลือกเมนู **Add New** -> Project
   - Import GitHub repository -> Only select repositories -> `booking-app-demo-2025`
   - กำหนดค่า:
     - **Application Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

2. **ตั้งค่า Environment Variables ใน Vercel**:

   | Key | Value | Environment |
   |---|---|---|
   | `VITE_API_URL` | `https://your-backend.onrender.com` | Production |
   | `VITE_API_URL` | `https://your-qa-backend.onrender.com` | Preview |

3. **รับ Vercel Token สำหรับ GitHub Actions**:
   - ไปที่ Vercel → Account Settings → **Tokens**
   - สร้าง token ใหม่ ตั้งชื่อ `GitHub Actions`
   - กำหนด SCOPE -> EXPIRATION -> Create
   - คัดลอกและเก็บ token ไว้

### ขั้นตอนที่ 8.2: ตั้งค่า Render (Backend)

**สร้าง PostgreSQL Database**:

1. ไปที่ https://render.com -> Signin ด้วย GitHub
2. Activate Account 
3. Create a new workspace -> เลือกตามขั้นตอน Wizard
4. Render Dashboard ที่เมนูมุมบนขวามือ → **New** → **PostgreSQL**
5. ตั้งชื่อ: `booking-db`
6. เลือก Region ที่ใกล้ที่สุด (Singapore)
7. PostgreSQL Version -> 16
8. Plan Option -> Free → **Create Database** -> รอการสร้างฐานข้อมูล
9. **คัดลอก Internal Database URL** (ใช้ภายใน Render network เร็วกว่า External URL)

**สร้าง Web Service (Backend)**:

1. Render Dashboard → **New** → **Web Service**
2. Connect GitHub repository
3. Only select repositories -> เลือก Repository -> Install
4. เลือก Repository เพื่อกำหนดค่า
5. กำหนดค่า:

   | Setting | Value |
   |---|---|
   | **Name** | `booking-backend` |
   | **Root Directory** | `backend` |
   | **Language** | Node |
   | **Build Command** | `npm install && npx prisma generate && npx prisma migrate deploy` |
   | **Start Command** | `npm start` |

6. เพิ่ม Environment Variables:

   ```
   DATABASE_URL=<Internal Database URL จากข้อ 1>
   JWT_SECRET=<สร้าง random string ที่ซับซ้อน>
   NODE_ENV=production
   PORT=3001
   ```

7. Deploy Web Service
8. Settings → **Deploy Hooks** 
9. **คัดลอก Deploy Hook URL**: 

### ขั้นตอนที่ 8.3: ตั้งค่า GitHub Secrets

ไปที่ GitHub Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

เพิ่ม secrets ต่อไปนี้:

| Secret Name | ค่า | วิธีหา |
|---|---|---|
| `VERCEL_TOKEN` | `xxx...` | Vercel → Account Settings → Tokens |
| `RENDER_DEPLOY_HOOK_URL` | `https://api.render.com/deploy/...` | Render → Service → Settings → Deploy Hooks |
| `RENDER_BACKEND_URL` | `https://booking-backend.onrender.com` | Render → Service → URL |
| `RAILWAY_TOKEN` | `xxx...` | Railway → Account Settings → Tokens |
| `RAILWAY_PROJECT_ID` | `abc123-...` | Railway → Project → Settings → Project ID |
| `RAILWAY_BACKEND_URL` | `https://xxx.up.railway.app` | Railway → Service → Settings → Networking |

**ตรวจสอบว่า Secrets ครบถ้วน**:

```
✅ VERCEL_TOKEN
✅ RENDER_DEPLOY_HOOK_URL
✅ RENDER_BACKEND_URL
✅ RAILWAY_TOKEN
✅ RAILWAY_PROJECT_ID
✅ RAILWAY_BACKEND_URL
```

**หมายเหตุสำคัญ**:
- ❌ ห้ามมีเครื่องหมาย `/` ท้าย URL เช่น `https://app.com/` (ผิด)
- ✅ ต้องเป็น `https://app.com` (ถูก)

---

## ส่วนที่ 9: ทดสอบ CI/CD Pipeline และ Post-Deployment Testing

### ขั้นตอนที่ 9.1: Commit และ Push Code

```bash
# เพิ่มไฟล์ทั้งหมด
git add .

# Commit ด้วย conventional commit message
git commit -m "ci: add complete CI/CD pipeline with Newman testing and security scanning"

# Push ไปที่ main เพื่อ trigger full pipeline
git push origin main
```

### ขั้นตอนที่ 9.2: ตรวจสอบ GitHub Actions

1. ไปที่ GitHub Repository → **Actions** tab
2. ดู workflow run ล่าสุด
3. ตรวจสอบแต่ละ job ตามลำดับ:

| ลำดับ | Job | สิ่งที่ต้องผ่าน |
|---|---|---|
| 1 | `Backend Tests (Newman API)` | Newman tests ทั้งหมดผ่าน |
| 1 | `Frontend Build & Lint` | Vite build สำเร็จ |
| 2 | `Security Scanning` | ไม่พบ high/critical vulnerabilities |
| 3 | `Deploy Frontend → Vercel` | URL ใช้งานได้ |
| 3 | `Deploy Backend → Render` | Health check ผ่าน |
| 4 | `Post-Deploy Smoke Tests` | API ทำงานบน production |

4. คลิกที่แต่ละ job เพื่อดู logs รายละเอียด

**แนบรูป GitHub Actions Workflow ที่ผ่านทั้งหมด**:

```plaintext
# แนบ screenshot ที่นี่

```

---

### ขั้นตอนที่ 9.3: Post-Deployment Smoke Tests

**Smoke Test** คือการทดสอบ**เร็วและครอบคลุม** หลัง deploy เพื่อยืนยันว่าระบบยังทำงานได้ในระดับพื้นฐาน เป็นด่านแรกก่อนที่ผู้ใช้จริงจะเข้ามาใช้งาน

```
Deployment สำเร็จ
       ↓
  Smoke Tests  → ❌ Fail → แจ้งเตือน + Auto Rollback
       ↓ ✅ Pass
  ระบบพร้อมใช้งาน → แจ้ง team
```

**เพิ่ม Post-Deploy Job ใน `.github/workflows/ci-cd.yml`**:

```yaml
  # ─────────────────────────────────────────────
  # Job 6: Post-Deployment Smoke Tests
  # รันหลัง deploy ทั้งหมดสำเร็จ ทดสอบบน Production จริง
  # ─────────────────────────────────────────────
  post-deploy-smoke-test:
    name: Post-Deploy Smoke Tests (Production)
    runs-on: ubuntu-latest
    needs: [deploy-frontend, deploy-backend-render]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Newman
        run: npm install -g newman newman-reporter-htmlextra

      # ── Backend Smoke Tests (Production API) ──
      - name: Run API Smoke Tests on Production
        env:
          PROD_BACKEND_URL: ${{ secrets.RENDER_BACKEND_URL }}
        run: |
          newman run tests/booking-api.postman_collection.json \
            --env-var "baseUrl=$PROD_BACKEND_URL" \
            --folder "Auth" \
            --folder "Rooms" \
            --reporters cli,htmlextra \
            --reporter-htmlextra-export smoke-test-report.html \
            --bail  # หยุดทันทีเมื่อมี test ล้มเหลว

      # ── Frontend Availability Check ──────────
      - name: Check Frontend is Reachable
        run: |
          echo "Checking frontend URL..."
          HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            "${{ secrets.VERCEL_FRONTEND_URL }}")
          
          if [ "$HTTP_STATUS" = "200" ]; then
            echo "✅ Frontend is up (HTTP $HTTP_STATUS)"
          else
            echo "❌ Frontend returned HTTP $HTTP_STATUS"
            exit 1
          fi

      # ── Security Headers Check ───────────────
      - name: Verify Security Headers on Production
        env:
          PROD_BACKEND_URL: ${{ secrets.RENDER_BACKEND_URL }}
        run: |
          echo "=== Checking Security Headers ==="
          HEADERS=$(curl -sI "$PROD_BACKEND_URL/api/rooms")
          
          # ตรวจสอบว่ามี Helmet headers ครบ
          check_header() {
            if echo "$HEADERS" | grep -qi "$1"; then
              echo "✅ $1 found"
            else
              echo "⚠️  $1 NOT found — security risk"
            fi
          }
          
          check_header "x-frame-options"
          check_header "x-content-type-options"
          check_header "content-security-policy"

      # ── Upload Test Report ────────────────────
      - name: Upload Smoke Test Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: smoke-test-report-${{ github.sha }}
          path: smoke-test-report.html

      # ── Notify on Failure ─────────────────────
      - name: Notify on Smoke Test Failure
        if: failure()
        run: |
          echo "🚨 PRODUCTION SMOKE TESTS FAILED!"
          echo "Commit: ${{ github.sha }}"
          echo "Deployed by: ${{ github.actor }}"
          echo "Please check the smoke test report artifact"
          # ในโปรเจกต์จริงควรส่ง notification ไปยัง Slack/Teams/Line
          # curl -X POST "${{ secrets.SLACK_WEBHOOK }}" \
          #   -d '{"text": "🚨 Production smoke tests failed!"}'
```

### ขั้นตอนที่ 9.4: สร้าง Smoke Test Collection แยกต่างหาก

สำหรับ Production ควรมี Postman Collection แยกจาก CI tests เพื่อความปลอดภัย (ไม่ create/delete ข้อมูลจริงบน Production):

สร้างไฟล์ `tests/smoke-tests.postman_collection.json`:

```json
{
  "info": {
    "name": "Production Smoke Tests",
    "description": "Read-only tests for production verification. No data modification.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "https://your-backend.onrender.com" }
  ],
  "item": [
    {
      "name": "1. API is Reachable",
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('API returns 200', () => pm.response.to.have.status(200));",
            "pm.test('Response time < 3000ms', () => pm.expect(pm.response.responseTime).to.be.below(3000));"
          ]
        }
      }],
      "request": { "method": "GET", "url": "{{baseUrl}}/api/rooms" }
    },
    {
      "name": "2. Authentication Works",
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('Login returns token', () => {",
            "  pm.response.to.have.status(200);",
            "  pm.expect(pm.response.json()).to.have.property('token');",
            "});"
          ]
        }
      }],
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": { "mode": "raw", "raw": "{\"username\":\"admin\",\"password\":\"admin123\"}" },
        "url": "{{baseUrl}}/api/login"
      }
    },
    {
      "name": "3. Protected Routes Require Auth",
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('Returns 401 without token', () => pm.response.to.have.status(401));"
          ]
        }
      }],
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/bookings"
      }
    },
    {
      "name": "4. CORS Headers Present",
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('Has security headers', () => {",
            "  pm.expect(pm.response.headers.has('x-frame-options') ||",
            "            pm.response.headers.has('content-security-policy')).to.be.true;",
            "});"
          ]
        }
      }],
      "request": { "method": "GET", "url": "{{baseUrl}}/api/rooms" }
    }
  ]
}
```

**ข้อแตกต่างระหว่าง CI Tests กับ Smoke Tests**:

| | CI Tests (Newman) | Production Smoke Tests |
|---|---|---|
| **จุดประสงค์** | ทดสอบ logic ครอบคลุม | ยืนยันระบบทำงานได้พื้นฐาน |
| **ข้อมูล** | สร้าง/ลบ test data ได้ | Read-only เท่านั้น |
| **เวลา** | นานกว่า (5-10 นาที) | เร็ว (< 1 นาที) |
| **Database** | CI database (isolated) | Production database |
| **รันเมื่อ** | ทุก push | หลัง deploy สำเร็จเท่านั้น |

### ขั้นตอนที่ 9.5: ทดสอบ Application บน Production ด้วยตนเอง

**ทดสอบ Frontend (Vercel)**:

เปิด browser ไปที่ Vercel URL ของคุณ ทดสอบ:
- [ ] หน้าแสดงรายการห้องพัก
- [ ] ฟอร์มการจองทำงาน
- [ ] หน้า Admin login ทำงาน
- [ ] Dashboard Admin แสดงข้อมูลถูกต้อง

**ทดสอบ Backend (Render) ด้วย curl**:

```bash
# แทนที่ YOUR_BACKEND_URL ด้วย URL จริง
export BACKEND=https://YOUR_BACKEND_URL

# 1. ดูรายการห้อง (Public)
curl $BACKEND/api/rooms

# 2. Login รับ Token และเก็บไว้ใน variable
curl -s -X POST $BACKEND/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# จดค่า token จาก output ด้านบน แล้วกำหนดด้วยตนเอง
export TOKEN="วาง_token_ที่ได้จาก_login_ที่นี่"

# 3. ดูรายการจองทั้งหมด (ต้องมี Token)
curl $BACKEND/api/bookings \
  -H "Authorization: Bearer $TOKEN"

# 4. ดูรายงาน
curl $BACKEND/api/reports \
  -H "Authorization: Bearer $TOKEN"

# 5. ตรวจสอบ Security Headers
curl -I $BACKEND/api/rooms
```

> 🪟 **Windows (Git Bash)**: คำสั่ง `export` และ multi-line `curl` ทำงานได้ปกติใน Git Bash ไม่ต้องเปลี่ยน syntax ใด ๆ

**บันทึกผลการทดสอบบน Production**:

```plaintext
# วาง output ที่นี่

```

### ขั้นตอนที่ 9.6: ทดสอบ Auto-Deployment (สำคัญ)

ทดสอบว่าเมื่อ push code ใหม่ pipeline ทำงานอัตโนมัติครบทุกขั้นตอน:

```bash
# สร้าง feature branch
git checkout -b feature/test-pipeline

# แก้ไขไฟล์เล็กน้อย
echo "// Pipeline test $(date)" >> backend/server.js

git add .
git commit -m "test: verify auto-deployment pipeline"
git push origin feature/test-pipeline
```

สังเกตใน GitHub Actions:
- ✅ CI tests ควรรัน (แต่ยังไม่ deploy เพราะไม่ใช่ main)

```bash
# Merge ไปที่ main เพื่อ trigger full CD pipeline
git checkout main
git merge feature/test-pipeline
git push origin main
```

สังเกตว่า pipeline รัน **ทุก job** โดยอัตโนมัติ รวมถึง Post-Deploy Smoke Tests

---

## ส่วนที่ 10: Security ใน CI/CD Pipeline

ความปลอดภัยต้องถูกสร้างให้เป็นส่วนหนึ่งของ pipeline ตั้งแต่ต้น ไม่ใช่สิ่งที่มาตรวจสอบทีหลัง แนวคิดนี้เรียกว่า **"Shift Left Security"** หมายถึงการเลื่อนการตรวจสอบความปลอดภัยมาอยู่ในช่วงแรกๆ ของ SDLC

```
Developer → [Commit] → [Security Scan] → [Test] → [Deploy] → Production
                ↑
         ตรวจสอบที่นี่ก่อน
         (เร็ว + ถูกกว่าแก้ทีหลัง)
```

---

### 10.1 ทำความเข้าใจเครื่องมือความปลอดภัย

#### 🛡️ Helmet.js — HTTP Security Headers

**Helmet คืออะไร?**

Helmet เป็น middleware ของ Express.js ที่ทำหน้าที่**ตั้งค่า HTTP Response Headers** เพื่อป้องกันการโจมตีแบบต่างๆ ที่ทำงานผ่าน browser เปรียบเทียบได้กับ "หมวกกันน็อค" ให้กับ web application

**ทำไมต้องใช้?**

Browser มีฟีเจอร์ด้านความปลอดภัยหลายอย่างที่ต้องเปิดใช้ผ่าน HTTP headers ถ้าไม่ตั้งค่า browser จะใช้ค่า default ที่ไม่ปลอดภัย

```
Client Browser                    Express Server
     │                                  │
     │ ← ─ ─ HTTP Response ─ ─ ─ ─ ─ ─ │
     │                                  │
     │  headers ที่ Helmet ตั้งให้:     │
     │  Content-Security-Policy: ...    │  ← ป้องกัน XSS
     │  X-Frame-Options: DENY           │  ← ป้องกัน Clickjacking
     │  X-Content-Type-Options: nosniff │  ← ป้องกัน MIME sniffing
     │  Strict-Transport-Security: ...  │  ← บังคับ HTTPS
     │  X-XSS-Protection: 1; mode=block │  ← เปิด browser XSS filter
```

**Headers ที่ Helmet จัดการ**:

| Header | ป้องกัน | ตัวอย่างค่า |
|---|---|---|
| `Content-Security-Policy` | XSS, Code Injection | กำหนดแหล่งที่มาของ script, style ที่อนุญาต |
| `X-Frame-Options` | Clickjacking | `DENY` — ห้าม embed ใน iframe |
| `X-Content-Type-Options` | MIME Sniffing | `nosniff` — ห้าม browser เดา content type |
| `Strict-Transport-Security` | HTTPS Downgrade | บังคับใช้ HTTPS อย่างน้อย 1 ปี |
| `Referrer-Policy` | Information Leakage | `no-referrer` — ไม่ส่ง URL ต้นทาง |

**การโจมตีที่ป้องกันได้**:

**XSS (Cross-Site Scripting)**: ผู้โจมตีฉีด JavaScript ลงในหน้าเว็บผ่านช่องทางต่างๆ เช่น form หรือ URL parameter แล้วให้ browser ของผู้ใช้รันโค้ดนั้น

```
ตัวอย่างการโจมตี XSS:
URL: https://booking.com/search?q=<script>document.cookie</script>
         ↑ ถ้าไม่มี CSP header browser จะรัน script นี้
```

**Clickjacking**: ซ่อนเว็บไซต์ไว้ใน iframe ที่มองไม่เห็น แล้วให้ผู้ใช้คลิกโดยไม่รู้ตัว

```javascript
// ติดตั้งและใช้งาน Helmet
npm install helmet

// ใน server.js
const helmet = require('helmet');

app.use(helmet()); // เปิดใช้ทุก headers ในชุดมาตรฐาน

// หรือกำหนด custom policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],           // อนุญาตเฉพาะ same origin
      scriptSrc: ["'self'"],            // script จาก same origin เท่านั้น
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  frameguard: { action: 'deny' },       // ห้าม iframe ทุกชนิด
  hsts: {
    maxAge: 31536000,                   // 1 ปี
    includeSubDomains: true,
  }
}));
```

**ทดสอบผล Helmet ด้วย curl**:

```bash
# ดู headers ที่ server ส่งกลับมา
curl -I http://localhost:3001/api/rooms

# ผลลัพธ์ที่ควรเห็นหลังใช้ Helmet:
# Content-Security-Policy: default-src 'self';...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

#### 🚦 express-rate-limit — Rate Limiting

**Rate Limiting คืออะไร?**

Rate Limiting คือการ**จำกัดจำนวน requests** ที่ client (IP address) สามารถส่งได้ในช่วงเวลาหนึ่ง ป้องกัน:

- **Brute Force Attack**: ลองรหัสผ่านซ้ำๆ หลายพัน/หลายหมื่นครั้ง
- **DDoS (Distributed Denial of Service)**: ส่ง request จำนวนมากให้ server ล่ม
- **API Scraping**: ดูดข้อมูลโดยไม่ได้รับอนุญาต

```
ไม่มี Rate Limit:                    มี Rate Limit:
ผู้โจมตี → 10,000 requests/min  →   ผู้โจมตี → 10 requests แล้วถูกบล็อก
                                                   ↓
                                              HTTP 429 Too Many Requests
```

**การติดตั้งและตั้งค่า**:

```javascript
const rateLimit = require('express-rate-limit');

// Rate limit ทั่วไปสำหรับ API ทั้งหมด
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // หน้าต่างเวลา: 15 นาที
  max: 100,                  // สูงสุด 100 requests ต่อ IP ต่อ 15 นาที
  standardHeaders: true,     // ส่ง RateLimit headers กลับไปให้ client
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again in 15 minutes.'
  }
});

// Rate limit เข้มข้นสำหรับ Login (ป้องกัน Brute Force)
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // หน้าต่างเวลา: 1 ชั่วโมง
  max: 10,                   // สูงสุด 10 attempts ต่อ IP ต่อชั่วโมง
  message: {
    error: 'Too many login attempts. Account temporarily locked for 1 hour.'
  },
  skipSuccessfulRequests: true, // ไม่นับ request ที่ login สำเร็จ
});

app.use('/api/', generalLimiter);
app.use('/api/login', loginLimiter); // เข้มงวดกว่าสำหรับ login
```

**Response Headers ที่ client จะได้รับ**:

```
HTTP/1.1 200 OK
RateLimit-Limit: 100          ← จำกัดสูงสุด
RateLimit-Remaining: 87       ← เหลืออีกกี่ครั้ง
RateLimit-Reset: 1719900000   ← จะ reset เมื่อไหร่ (Unix timestamp)
```

**เมื่อเกิน limit**:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 900              ← รออีกกี่วินาที
```

---

#### 🔑 JWT (JSON Web Token) — Authentication

**JWT คืออะไร?**

JWT เป็นมาตรฐานสำหรับส่งข้อมูลระหว่าง parties อย่างปลอดภัยในรูปแบบ JSON ที่ถูก **sign** ด้วย secret key ทำให้ตรวจสอบความถูกต้องได้

```
JWT Token ประกอบด้วย 3 ส่วน คั่นด้วย "."

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   ← Header (algorithm)
.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiJ9  ← Payload (user data)
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c ← Signature
     ↑ Base64 encoded, ไม่ใช่การเข้ารหัส ใครก็ decode ได้
     ↑ แต่แก้ไขแล้ว Signature จะไม่ตรง → ตรวจจับได้
```

**Flow การ Authentication**:

```
1. Client ส่ง username + password
         ↓
2. Server ตรวจสอบ password hash (bcrypt)
         ↓
3. Server สร้าง JWT ด้วย JWT_SECRET
   { id: 1, username: "admin", role: "admin", exp: ... }
         ↓
4. Client เก็บ JWT ไว้ (localStorage หรือ httpOnly cookie)
         ↓
5. ทุก request ต่อไปส่ง JWT ใน Authorization header
   Authorization: Bearer eyJhbGci...
         ↓
6. Server verify JWT signature — ถ้าถูกต้อง ให้ผ่าน
```

**ทำไมต้องเก็บ JWT_SECRET ใน Environment Variable?**

ถ้า JWT_SECRET หลุดออกไป ผู้โจมตีสามารถสร้าง JWT token ของตัวเองและปลอมตัวเป็น admin ได้:

```javascript
// ❌ อันตราย — ห้ามทำ
const token = jwt.sign({ id: 1, role: 'admin' }, 'hardcoded-secret');

// ✅ ถูกต้อง — ใช้ environment variable
const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, {
  expiresIn: '24h'  // token หมดอายุใน 24 ชั่วโมง
});
```

---

#### 🌐 CORS (Cross-Origin Resource Sharing)

**CORS คืออะไร?**

CORS เป็นกลไกความปลอดภัยของ browser ที่**บล็อก JavaScript ไม่ให้เรียก API จาก domain อื่น** โดยค่า default Browser จะบล็อก request ที่มาจาก origin ต่างกัน

```
Frontend (Vercel): https://booking.vercel.app
Backend (Render):  https://booking-api.onrender.com

Browser จะบล็อก: "ไม่อนุญาตให้ booking.vercel.app เรียก booking-api.onrender.com"
เว้นแต่ backend จะอนุญาตผ่าน CORS headers
```

**การตั้งค่า CORS ที่ปลอดภัย**:

```javascript
const cors = require('cors');

// ❌ ไม่ปลอดภัย — อนุญาตทุก origin
app.use(cors());

// ✅ ปลอดภัย — กำหนด origin ที่อนุญาตชัดเจน
const allowedOrigins = [
  'https://booking.vercel.app',      // Production frontend
  'https://qa-booking.vercel.app',   // QA frontend
  'http://localhost:5173',           // Local development
];

app.use(cors({
  origin: (origin, callback) => {
    // อนุญาต requests ที่ไม่มี origin (เช่น curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,    // อนุญาต cookies ใน cross-origin requests
}));
```

---

#### 🔍 npm audit — Dependency Vulnerability Scanning

**npm audit คืออะไร?**

`npm audit` คือคำสั่งที่ตรวจสอบ dependencies ทั้งหมดในโปรเจกต์กับฐานข้อมูล **Node Security Platform (NSP)** และ **National Vulnerability Database (NVD)** เพื่อหา packages ที่มีช่องโหว่ที่รู้จักแล้ว

```bash
cd backend
npm audit
```

ตัวอย่าง output:

```
# npm audit report

lodash  <4.17.21
Severity: high
Prototype Pollution - https://npmjs.com/advisories/1523
fix available via `npm audit fix`

2 vulnerabilities (1 moderate, 1 high)
```

**Severity Levels**:

| Level | ความรุนแรง | ควรทำอะไร |
|---|---|---|
| `critical` | ⛔ วิกฤต | แก้ไขทันที ก่อน deploy |
| `high` | 🔴 สูง | แก้ไขก่อน deploy |
| `moderate` | 🟡 ปานกลาง | วางแผนแก้ไขใน sprint ถัดไป |
| `low` | 🟢 ต่ำ | monitor และแก้เมื่อมีเวลา |
| `info` | ℹ️ ข้อมูล | รับทราบ |

**การใช้งานใน CI**:

```bash
# หยุด pipeline ถ้าพบช่องโหว่ระดับ high หรือสูงกว่า
npm audit --audit-level=high

# แก้ไขอัตโนมัติ (ถ้าทำได้)
npm audit fix

# แก้ไขรวมถึง breaking changes
npm audit fix --force
```

---

### 10.2 เพิ่ม Security Job ใน GitHub Actions Workflow

เพิ่ม job ใหม่ในไฟล์ `.github/workflows/ci-cd.yml` ก่อน deploy jobs:

```yaml
  # ─────────────────────────────────────────────
  # Job 3: Security Scanning
  # รันหลังจาก tests ผ่านแล้ว ก่อน deployment
  # ─────────────────────────────────────────────
  security-scan:
    name: Security Scanning
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-build]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # ── 1. Dependency Vulnerability Scan ──────
      - name: Backend — npm audit
        run: |
          cd backend
          npm ci
          echo "=== Backend Dependency Audit ==="
          npm audit --audit-level=high
        # หยุด pipeline ถ้าพบ high/critical vulnerability

      - name: Frontend — npm audit
        run: |
          cd frontend
          npm ci
          echo "=== Frontend Dependency Audit ==="
          npm audit --audit-level=high

      # ── 2. Secret Scanning ────────────────────
      # ตรวจหา hardcoded secrets ที่อาจหลุดใน code
      - name: Scan for hardcoded secrets (TruffleHog)
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --only-verified

      # ── 3. OWASP Dependency Check ─────────────
      # ตรวจสอบ dependencies กับ CVE database
      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        id: depcheck
        with:
          project: 'booking-app'
          path: '.'
          format: 'HTML'
          args: >
            --enableRetired
            --failOnCVSS 7
        # failOnCVSS 7 = หยุดถ้าพบ CVSS score ≥ 7.0 (High)

      - name: Upload OWASP report
        uses: actions/upload-artifact@v4
        if: always()  # upload แม้ว่า job จะ fail
        with:
          name: owasp-dependency-report
          path: ${{ github.workspace }}/reports

      # ── 4. Security Headers Check (post-deploy) ─
      # จะทำในส่วนที่ 11 หลัง deploy แล้ว
```

**อัพเดท Flow Diagram** ให้มี Security Job:

```
Push to main
    ↓
┌────────────────────┬──────────────────────┐
│  backend-test      │  frontend-build      │
│  (Newman + Prisma) │  (Vite build)        │
└────────┬───────────┴───────────┬──────────┘
         └──────────┬────────────┘
                    ↓
         ┌──────────────────────┐
         │   security-scan      │  ← ใหม่
         │   - npm audit        │
         │   - TruffleHog       │
         │   - OWASP dep-check  │
         └──────────┬───────────┘
                    ↓
    ┌───────────────┬──────────────────┐
    │ deploy-       │ deploy-backend-  │
    │ frontend      │ render/railway   │
    │ (Vercel)      │                  │
    └───────────────┴──────────────────┘
                    ↓
         ┌──────────────────────┐
         │  post-deploy-test    │  ← ใหม่ (ดูส่วนที่ 11)
         │  (Smoke Tests)       │
         └──────────────────────┘
```

---

### 10.3 ตั้งค่า Security Middleware ใน Backend

ตรวจสอบว่า backend มี dependencies ที่จำเป็น:

```bash
cd backend
cat package.json | grep -E "helmet|cors|rate-limit|bcrypt"
```

ถ้ายังขาด ให้ติดตั้ง:

```bash
npm install helmet cors express-rate-limit bcryptjs
```

เพิ่มหรือตรวจสอบ `backend/server.js`:

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// ── 1. Environment Validation ─────────────────
// ตรวจสอบตั้งแต่ application start — fail fast
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required env var: ${envVar}`);
    process.exit(1); // หยุด server ทันที
  }
});

// ── 2. Security Headers (Helmet) ─────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// ── 3. CORS Configuration ─────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── 4. Rate Limiting ──────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts. Try again in 1 hour.' },
});

app.use('/api/', generalLimiter);
app.use('/api/login', loginLimiter);

// ── 5. Body Parser ────────────────────────────
app.use(express.json({ limit: '10kb' })); // จำกัดขนาด request body
```

**ทดสอบ Security Headers ในเครื่อง**:

```bash
# ดู headers ที่ server ตอบกลับ
curl -I http://localhost:3001/api/rooms

# ตรวจสอบ CORS โดยส่ง Origin header
curl -H "Origin: http://evil.com" \
     -I http://localhost:3001/api/rooms
# ต้องไม่เห็น Access-Control-Allow-Origin: http://evil.com

# ทดสอบ Rate Limiting (ส่ง requests ติดกัน)
# รันใน Git Bash เท่านั้น — for loop แบบนี้ใช้ไม่ได้ใน CMD หรือ PowerShell
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3001/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
done
# ต้องเห็น 429 หลังจาก attempt ที่ 10
```

> 🪟 **Windows**: คำสั่ง `for i in {1..15}` ต้องรันใน **Git Bash** เท่านั้น ถ้าใช้ CMD หรือ PowerShell จะ error ทันที

**คำถาม 10.3**: หลังจากตั้งค่า Helmet แล้ว ให้รัน `curl -I http://localhost:3001/api/rooms` และบันทึก headers ที่ได้ อธิบายว่า header แต่ละตัวป้องกันการโจมตีแบบใด

```plaintext
# บันทึก headers และคำอธิบายที่นี่

```

---

## ส่วนที่ 11: การ Debug ปัญหาทั่วไป

### 🪟 ปัญหาเฉพาะ Windows

**ปัญหา**: `exec ./docker-entrypoint.sh: no such file or directory`

**สาเหตุ**: ไฟล์ `docker-entrypoint.sh` มี CRLF line endings

**แก้ไขทีละขั้น**:

```bash
# 1. ตรวจสอบว่ามี ^M (CRLF) หรือไม่
cat -A backend/docker-entrypoint.sh | head -3
# ถ้าเห็น ^M$ → CRLF (ผิด)
# ถ้าเห็น $   → LF  (ถูก)

# 2. แปลงด้วย sed บนเครื่อง
sed -i 's/\r$//' backend/docker-entrypoint.sh

# 3. ตรวจสอบซ้ำ
cat -A backend/docker-entrypoint.sh | head -3

# 4. Build ใหม่
docker compose down
docker compose build --no-cache backend
docker compose up -d

# 5. ดู logs
docker compose logs backend
```

---

**ปัญหา**: `git rm --cached -r .` แล้วไฟล์ยังเป็น CRLF

**สาเหตุ**: VS Code ยังตั้งค่า `files.eol` เป็น `\r\n` อยู่

**แก้ไข**: ไปที่ VS Code → `Ctrl+Shift+P` → `Open User Settings (JSON)` → ตรวจสอบว่ามี `"files.eol": "\n"` แล้ว Restart VS Code แล้วทำขั้นตอน normalize ซ้ำ

---

**ปัญหา**: `npm install -g newman` แล้วรัน `newman` ไม่ได้ (command not found)

**สาเหตุ**: npm global bin ไม่ได้อยู่ใน PATH ของ Git Bash

**แก้ไข**:

```bash
# หา path ของ npm global
npm config get prefix

# เพิ่มใน PATH (แทนที่ path ที่ได้จากคำสั่งข้างบน)
export PATH="$PATH:/c/Users/<username>/AppData/Roaming/npm"

# ทดสอบ
newman --version
```

เพิ่มบรรทัด `export PATH` ใน `~/.bashrc` เพื่อให้ถาวร:

```bash
echo 'export PATH="$PATH:/c/Users/<username>/AppData/Roaming/npm"' >> ~/.bashrc
source ~/.bashrc
```

---

### Prisma Migration ล้มเหลวใน CI

**ปัญหา**: `Error: P1001: Can't reach database server`

**สาเหตุ**: PostgreSQL service container ยังไม่พร้อม

**แก้ไข**: ตรวจสอบว่า `options` ใน service มี health check และ `--health-retries` เพียงพอ

```yaml
options: >-
  --health-cmd pg_isready
  --health-interval 10s
  --health-timeout 5s
  --health-retries 5
```

### Newman Tests ล้มเหลว

**ปัญหา**: `Error: connect ECONNREFUSED 127.0.0.1:3001`

**สาเหตุ**: Backend server ยังไม่ start

**แก้ไข**: เพิ่ม wait time และ health check ก่อนรัน Newman:

```yaml
- name: Start backend and wait
  run: |
    npm start &
    for i in {1..10}; do
      if curl -sf http://localhost:3001/api/rooms; then
        echo "Server is ready"
        break
      fi
      echo "Waiting... attempt $i"
      sleep 3
    done
```

### Vercel Deployment ล้มเหลว

**ปัญหา**: `Error: The provided token is not valid`

**แก้ไข**: ตรวจสอบว่า secret `VERCEL_TOKEN` ถูกต้องและยังไม่หมดอายุ ไปสร้าง token ใหม่ใน Vercel Dashboard

### Render Health Check ล้มเหลว

**ปัญหา**: `curl: (22) The requested URL returned error: 503`

**สาเหตุ**: Render deploy ใช้เวลานาน (cold start สำหรับ free tier อาจนาน 3-5 นาที)

**แก้ไข**: เพิ่ม sleep time หรือเพิ่มจำนวน retry:

```yaml
- name: Wait for Render deployment
  run: sleep 120  # เพิ่มเป็น 2 นาที
```

### JWT Authentication ไม่ทำงาน

**ปัญหา**: `Error: invalid signature` หรือ `jwt malformed`

**แก้ไข**: ตรวจสอบว่า `JWT_SECRET` ใน environment ตรงกัน ทั้ง local, CI, และ cloud platform

---

## ส่วนที่ 12: สรุปและประเมินผล

### 12.1 Checklist การทดลอง

ตรวจสอบว่าทำสำเร็จทุกข้อ:

**การเตรียม Repository**:
- [ ] Fork repository `booking-app-demo-2025` สำเร็จ
- [ ] Clone และทำความเข้าใจโครงสร้างโปรเจกต์ทั้งหมด
- [ ] อ่านและอธิบาย Prisma schema ได้

**Local Development**:
- [ ] รัน PostgreSQL ด้วย Docker Compose สำเร็จ
- [ ] รัน Prisma migrations สำเร็จ
- [ ] Backend server ทำงานและ API endpoints ตอบสนองถูกต้อง
- [ ] Frontend build สำเร็จและแสดงผลใน browser

**API Testing**:
- [ ] สร้าง Postman Collection ที่ครอบคลุม endpoints หลัก
- [ ] รัน Newman tests ในเครื่องผ่านทั้งหมด
- [ ] ทดสอบทั้ง positive cases และ negative cases

**Security**:
- [ ] ติดตั้งและตั้งค่า Helmet.js ใน backend
- [ ] ตั้งค่า Rate Limiting สำหรับ API และ Login endpoint
- [ ] ตั้งค่า CORS อย่างถูกต้อง (ระบุ origin ชัดเจน)
- [ ] รัน `npm audit` และไม่พบ high/critical vulnerability
- [ ] Security Scanning Job ทำงานใน GitHub Actions

**GitHub Actions**:
- [ ] สร้าง workflow ไฟล์ `ci-cd.yml` ที่มีทั้ง CI, Security Scan, CD และ Post-Deploy Test
- [ ] Workflow ทำงาน automatic เมื่อ push code
- [ ] Newman tests รันใน CI สำเร็จ
- [ ] Security scanning job ผ่าน
- [ ] Post-Deploy Smoke Tests ผ่านบน Production

**Cloud Deployment**:
- [ ] ตั้งค่า Vercel และ deploy frontend สำเร็จ
- [ ] ตั้งค่า Render และ deploy backend สำเร็จ
- [ ] ตั้งค่า GitHub Secrets ครบทุกตัว
- [ ] Smoke tests ผ่านหลัง deployment
- [ ] ทดสอบ API บน production URL สำเร็จ

**Multi-Environment** (ข้อเพิ่มเติม):
- [ ] สร้าง GitHub Environments (qa, staging, production)
- [ ] สร้าง develop branch และ push เพื่อ trigger QA deployment

### 12.2 คำถามทบทวน

**คำถามที่ 1 — CI/CD Fundamentals**:
อธิบายความแตกต่างระหว่าง Continuous Integration (CI) และ Continuous Deployment (CD) พร้อมยกตัวอย่างจาก workflow ที่สร้างในการทดลองนี้

```plaintext
# ตอบที่นี่

```

**คำถาม 2 — Multi-Service Architecture**:
ในโปรเจกต์นี้ Frontend และ Backend ถูก deploy แยกกัน (Vercel vs Render) มีข้อดีและข้อเสียอะไรเมื่อเทียบกับการ deploy บน server เดียวกัน?

```plaintext
# ตอบที่นี่

```

**คำถาม 3 — API Testing vs Smoke Testing**:
Newman CI tests ต่างจาก Post-Deploy Smoke Tests อย่างไร? ทำไมถึงต้องมีทั้งสองแบบ? ยกตัวอย่างสถานการณ์ที่ CI tests ผ่านแต่ Smoke Tests ล้มเหลวได้หรือไม่?

```plaintext
# ตอบที่นี่

```

**คำถาม 4 — Security Layers**:
ในการทดลองนี้มีการป้องกันความปลอดภัยหลายชั้น ระบุและอธิบายแต่ละชั้นว่าป้องกันการโจมตีแบบใด:

| ชั้น | เครื่องมือ | ป้องกันอะไร |
|---|---|---|
| Runtime | Helmet.js | ? |
| Runtime | express-rate-limit | ? |
| Runtime | CORS | ? |
| Runtime | bcryptjs | ? |
| CI Pipeline | npm audit | ? |
| CI Pipeline | TruffleHog | ? |
| CI Pipeline | OWASP Dep-Check | ? |

```plaintext
# ตอบที่นี่

```

**คำถาม 5 — Secrets Management**:
เหตุใดจึงต้องใช้ GitHub Secrets แทนการเขียนค่า credentials โดยตรงใน workflow YAML file? ถ้าใส่ค่า JWT_SECRET ตรงๆ ใน YAML จะเกิดอะไรขึ้น?

```plaintext
# ตอบที่นี่

```

**คำถาม 6 — Branch Strategy**:
อธิบาย Git Flow ที่ใช้ในโปรเจกต์นี้ (develop → staging → main) ทำไมต้องมีหลาย environment แทนที่จะ deploy ตรงจาก develop ไป production เลย?

```plaintext
# ตอบที่นี่

```

---

## แหล่งข้อมูลเพิ่มเติม

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Newman Documentation](https://learning.postman.com/docs/running-collections/using-newman-cli/command-line-integration-with-newman/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [express-rate-limit Documentation](https://express-rate-limit.mintlify.app/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [npm audit Documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [Vercel Deployment](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [12-Factor App Methodology](https://12factor.net/)
- [TruffleHog — Secret Scanning](https://github.com/trufflesecurity/trufflehog)

---

*ใบงานการทดลอง: CI/CD with GitHub Actions — ระบบจองห้องพักออนไลน์*  
*Repository: https://github.com/surachai-p/booking-app-demo-2025*
