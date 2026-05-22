# 🏨 Lab: CI/CD with GitHub Actions — ระบบจองห้องพักออนไลน์

> **ใบงานการทดลอง** สำหรับรายวิชาพัฒนาและปรับใช้ซอฟต์แวร์ (Web Development & DevOps)  
> ใช้คู่กับ Source Code: [booking-app-demo-2025](https://github.com/surachai-p/booking-app-demo-2025)

---

## 📋 ภาพรวม

ใบงานนี้นำนักศึกษาผ่านกระบวนการ **CI/CD แบบครบวงจร** ของ Full-Stack Web Application จริง โดยไม่ต้องเขียน code ตั้งแต่ต้น แต่เน้นที่การ **ทำความเข้าใจ ตรวจสอบ และปรับปรุง pipeline** ของระบบจองห้องพักออนไลน์ที่มี source code อยู่แล้ว

```
Fork Repository → Local Setup → API Testing → สร้าง CI/CD Pipeline
      ↓                                                ↓
  ทำความเข้าใจ                         Security Scan + Deploy + Smoke Test
  โครงสร้าง                                    ↓
                                      Production บน Vercel + Render
```

---

## 🎯 วัตถุประสงค์การเรียนรู้

เมื่อทำการทดลองนี้สำเร็จ นักศึกษาจะสามารถ:

| # | ทักษะ | ระดับ |
|---|---|---|
| 1 | อธิบาย CI/CD workflow และความแตกต่างระหว่าง CI กับ CD | เข้าใจ |
| 2 | วิเคราะห์โครงสร้าง Node.js/Express + Prisma + React/Vite project | เข้าใจ |
| 3 | รัน Full-Stack application ด้วย Docker Compose | ปฏิบัติ |
| 4 | เขียนและรัน API Tests ด้วย Newman (Postman CLI) | ปฏิบัติ |
| 5 | สร้าง GitHub Actions Workflow ที่มี CI, Security Scan, CD | ปฏิบัติ |
| 6 | อธิบายและตั้งค่า Security Middleware (Helmet, Rate Limit, CORS, JWT) | ปฏิบัติ |
| 7 | ออกแบบและรัน Post-Deployment Smoke Tests | ปฏิบัติ |
| 8 | Deploy Frontend ไปยัง Vercel และ Backend ไปยัง Render/Railway | ปฏิบัติ |
| 9 | จัดการ Multi-Environment ด้วย Branch Strategy | ประยุกต์ |

---

## 🏗️ สถาปัตยกรรมระบบ

```
┌──────────────────────────────────────────────────────────────┐
│                    booking-app-demo-2025                      │
├───────────────────────────┬──────────────────────────────────┤
│        frontend/          │           backend/               │
│                           │                                  │
│  React 18 + Vite          │  Node.js 20 + Express            │
│  Tailwind CSS             │  Prisma ORM                      │
│  Axios (HTTP client)      │  PostgreSQL 16                   │
│                           │  JWT Authentication              │
│                           │  bcryptjs (password hash)        │
│                           │                                  │
│  ☁️  Deploy: Vercel        │  ☁️  Deploy: Render / Railway    │
└───────────────────────────┴──────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | สิทธิ์ |
|---|---|---|
| `POST` | `/api/login` | Public |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/bookings` | Public (GET POST) / Admin |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/rooms` | Public (GET) / Admin |
| `GET` | `/api/reports` | Admin |
| `GET` | `/api/reports/export` | Admin |

---

## 🔄 CI/CD Pipeline ที่สร้างในการทดลอง

```
Push to GitHub
       │
       ▼
┌──────────────────────┬───────────────────────┐
│  backend-test        │  frontend-build        │
│  ─────────────────   │  ──────────────────    │
│  • Prisma migrate    │  • npm ci              │
│  • Seed test data    │  • vite build          │
│  • Newman API tests  │  • Upload artifacts    │
└──────────┬───────────┴────────────┬───────────┘
           └────────────┬───────────┘
                        ▼
           ┌────────────────────────┐
           │    security-scan       │
           │  ──────────────────    │
           │  • npm audit (High+)   │
           │  • TruffleHog secrets  │
           │  • OWASP dep-check     │
           └────────────┬───────────┘
                        ▼  (เฉพาะ main branch)
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│deploy-front │  │deploy-render│  │deploy-railway│
│  (Vercel)   │  │  (Backend)  │  │  (Backend)  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       └────────────────┼─────────────────┘
                        ▼
           ┌────────────────────────┐
           │  post-deploy-smoke-test │
           │  ───────────────────── │
           │  • Newman on Production │
           │  • Security headers ✓  │
           │  • Frontend reachable ✓│
           └────────────────────────┘
```

---

## 📁 โครงสร้างไฟล์ที่เกี่ยวข้อง

```
booking-app-demo-2025/         ← Fork จาก surachai-p
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      ← Database schema (Room, Booking, User)
│   ├── routes/
│   ├── middleware/
│   ├── server.js              ← เพิ่ม Helmet, CORS, Rate Limit
│   ├── package.json
│   └── docker-compose.yml     ← Local PostgreSQL
├── tests/
│   ├── booking-api.postman_collection.json   ← Newman CI tests
│   └── smoke-tests.postman_collection.json  ← Post-deploy smoke tests
└── .github/
    └── workflows/
        ├── ci-cd.yml          ← Main pipeline (ส่วนที่ 6)
        └── deploy-qa.yml      ← QA pipeline (ส่วนที่ 7)
```

---

## 📚 เนื้อหาการทดลอง (13 ส่วน)

| ส่วน | หัวข้อ | เวลาโดยประมาณ |
|---|---|---|
| **0** | ⚠️ ตั้งค่าสำหรับ Windows — Git Bash, LF, `.gitattributes`, VS Code | 20 นาที |
| **1** | เตรียมโปรเจกต์ — Fork, Clone, ทำความเข้าใจโครงสร้าง | 15 นาที |
| **2** | Database Schema ด้วย Prisma — อ่านและวิเคราะห์ models | 10 นาที |
| **3** | Local Development — Docker Compose, Prisma migrate, ทดสอบ API | 20 นาที |
| **4** | API Testing ด้วย Newman — เขียน Collection, รัน tests | 30 นาที |
| **5** | วิเคราะห์ Workflow ที่มีอยู่ — ข้อดี/ข้อเสีย/ข้อจำกัด | 10 นาที |
| **6** | สร้าง CI/CD Workflow สมบูรณ์ — 6 jobs ใน GitHub Actions | 30 นาที |
| **7** | Multi-Environment Strategy — QA/Staging/Production | 20 นาที |
| **8** | ตั้งค่า Cloud Platforms — Vercel, Render, GitHub Secrets | 30 นาที |
| **9** | Push & Test Pipeline — Post-Deployment Smoke Tests | 20 นาที |
| **10** | Security ใน CI/CD — Helmet, Rate Limit, CORS, npm audit, TruffleHog | 25 นาที |
| **11** | Debug Guide — ปัญหาทั่วไปและปัญหาเฉพาะ Windows | อ้างอิง |
| **12** | สรุปและประเมินผล — Checklist + คำถาม 6 ข้อ | 20 นาที |

**เวลารวมโดยประมาณ: 3–4 ชั่วโมง** (Windows เพิ่มอีก ~20 นาที)

---

## 🪟 สำหรับผู้ใช้ Windows (ทำก่อนเริ่มทดลอง)

> macOS / Linux ข้ามส่วนนี้ได้เลย

```bash
# 1. ติดตั้ง Git for Windows → เลือก "Checkout as-is, commit as-is"
# 2. เปิด Git Bash แล้วรัน:
git config --global core.autocrlf false

# 3. ตั้งค่า VS Code
# settings.json → "files.eol": "\n"
# Default terminal → Git Bash

# 4. หลัง Clone → สร้าง .gitattributes ทันที
cat > .gitattributes << 'EOF'
*.sh text eol=lf
Dockerfile text eol=lf
docker-compose.yml text eol=lf
*.yml text eol=lf
*.json text eol=lf
*.js text eol=lf
*.prisma text eol=lf
EOF
git add .gitattributes && git commit -m "chore: enforce LF"
git rm --cached -r . && git reset --hard

# 5. เพิ่มใน backend/Dockerfile (safety net)
# COPY docker-entrypoint.sh ./
# RUN sed -i 's/\r$//' ./docker-entrypoint.sh   ← เพิ่มบรรทัดนี้
# RUN chmod +x ./docker-entrypoint.sh
```

ดูรายละเอียดทั้งหมดได้ที่ **ส่วนที่ 0** ในใบงาน

---



### ซอฟต์แวร์ (ติดตั้งล่วงหน้า)

```bash
# ตรวจสอบว่าติดตั้งครบ
git --version          # ≥ 2.40
node --version         # = 20.x LTS
npm --version          # ≥ 10.x
docker --version       # ≥ 24.x
docker compose version # ≥ 2.x

# ติดตั้ง Newman (API test runner)
npm install -g newman newman-reporter-htmlextra
newman --version
```

### Accounts (สมัครล่วงหน้า ฟรีทั้งหมด)

| Service | URL | ใช้สำหรับ |
|---|---|---|
| GitHub | github.com | Repository + GitHub Actions |
| Vercel | vercel.com | Deploy Frontend (React) |
| Render | render.com | Deploy Backend (Node.js) + PostgreSQL |
| Railway *(ทางเลือก)* | railway.app | Deploy Backend ทางเลือก |

---

## 🔐 GitHub Secrets ที่ต้องตั้งค่า

ใน Repository → Settings → Secrets and variables → Actions:

| Secret | ได้จาก |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_FRONTEND_URL` | Vercel → Project → Domain |
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → Settings → Deploy Hooks |
| `RENDER_BACKEND_URL` | Render → Service → URL (ไม่มี `/` ท้าย) |
| `RAILWAY_TOKEN` | Railway → Account Settings → Tokens |
| `RAILWAY_PROJECT_ID` | Railway → Project → Settings |
| `RAILWAY_BACKEND_URL` | Railway → Service → Networking |

---

## 🔒 Security Tools ที่ใช้ในการทดลอง

| เครื่องมือ | ประเภท | ป้องกัน |
|---|---|---|
| **Helmet.js** | Runtime Middleware | XSS, Clickjacking, MIME Sniffing, HTTPS Downgrade |
| **express-rate-limit** | Runtime Middleware | Brute Force, DDoS, API Scraping |
| **CORS** | Runtime Middleware | Cross-Origin Request จาก domain ที่ไม่อนุญาต |
| **bcryptjs** | Runtime Library | Plain-text password storage |
| **JWT + Expiry** | Runtime Auth | Unauthorized API access |
| **npm audit** | CI Scan | Known vulnerabilities ใน dependencies |
| **TruffleHog** | CI Scan | Hardcoded secrets / API keys ใน code |
| **OWASP Dep-Check** | CI Scan | CVE database cross-reference |

---

## ✅ Checklist สรุปก่อนส่ง

**Local & Testing**
- [ ] รัน backend + frontend ในเครื่องสำเร็จ
- [ ] Newman tests ผ่านทั้งหมด (positive + negative cases)
- [ ] รัน `npm audit` ไม่พบ high/critical

**GitHub Actions**
- [ ] `ci-cd.yml` มีครบ 6 jobs (test → security → deploy × 3 → smoke)
- [ ] ทุก job ผ่าน (สีเขียว) บน main branch
- [ ] Artifacts (Newman report, OWASP report) ถูก upload

**Cloud Deployment**
- [ ] Frontend เปิดได้บน Vercel URL
- [ ] Backend API ตอบสนองบน Render URL
- [ ] Security headers ปรากฏใน curl response
- [ ] Smoke tests ผ่านบน production

**คำถามทบทวน (6 ข้อ)**
- [ ] ตอบครบทุกข้อในใบงาน

---

## 📖 ไฟล์ใบงาน

| ไฟล์ | คำอธิบาย |
|---|---|
| [`Lab_Booking_CICD_with_GitHub_Action.md`](./Lab_Booking_CICD_with_GitHub_Action.md) | ใบงานการทดลองฉบับเต็ม (12 ส่วน) |
| `README.md` | ไฟล์นี้ — ภาพรวมและคู่มือเริ่มต้น |

---

## 🔗 แหล่งข้อมูลเพิ่มเติม

- [📦 Source Code Repository](https://github.com/surachai-p/booking-app-demo-2025)
- [📘 GitHub Actions Docs](https://docs.github.com/en/actions)
- [🔷 Prisma Docs](https://www.prisma.io/docs)
- [🧪 Newman Docs](https://learning.postman.com/docs/running-collections/using-newman-cli/)
- [🛡️ Helmet.js Docs](https://helmetjs.github.io/)
- [🚦 express-rate-limit Docs](https://express-rate-limit.mintlify.app/)
- [🔍 OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [🕵️ TruffleHog](https://github.com/trufflesecurity/trufflehog)
- [☁️ Vercel Docs](https://vercel.com/docs)
- [☁️ Render Docs](https://render.com/docs)

---

*สร้างเพื่อการเรียนการสอน — Web Development & DevOps Workshop 2025*
