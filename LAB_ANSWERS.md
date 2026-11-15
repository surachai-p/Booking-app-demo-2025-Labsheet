# คำตอบและหลักฐานประกอบใบงาน CI/CD

ไฟล์นี้รวบรวมคำตอบเชิงอธิบายจากโค้ดจริงใน repository ส่วนผลคำสั่ง ภาพหน้าจอ URL และเลข GitHub Actions run ต้องบันทึกจากการรันจริง ห้ามใช้ข้อความตัวอย่างแทนหลักฐาน

## คำถาม 2.1 — ความสัมพันธ์ระหว่าง Room และ Booking

`Room` และ `Booking` เป็นความสัมพันธ์แบบ one-to-many กล่าวคือ ห้องหนึ่งห้องมีรายการจองได้หลายรายการ แต่รายการจองหนึ่งรายการอ้างถึงห้องได้ไม่เกินหนึ่งห้อง เห็นได้จาก `Room.bookings` ซึ่งเป็น `Booking[]` และ `Booking.roomId`/`Booking.room` ซึ่งเก็บ foreign key และ object ของห้องเพียงหนึ่งค่า โดย `roomId` เป็น optional จึงอนุญาตให้รายการจองเดิมที่ยังไม่ผูกห้องคงอยู่ได้

## ผลทดสอบ API ในเครื่อง

ให้รัน Backend และ Newman แล้วแนบ output หรือรายงาน HTML จริง:

```bash
npx newman run tests/booking-api.postman_collection.json \
  --env-var "baseUrl=http://localhost:3001" \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export reports/api-test-report.html
```

หลักฐานที่ต้องเติม:

- วันที่และเวลาทดสอบ: `15 พฤศจิกายน 2569 เวลาประมาณ 22:31 น.`
- Newman API collection: `8 requests, 13 assertions, 0 failures`
- Read-only smoke collection: `3 requests, 8 assertions, 0 failures`
- ตำแหน่งรายงาน: `reports/api-test-report.html`

## คำถาม 4.3 — Positive และ Negative API Tests

ตัวอย่าง positive cases ใน collection:

1. `Login - Success` ส่ง username/password ที่ถูกต้อง คาดหวัง HTTP 200 และตรวจว่า response มี JWT token จากนั้นเก็บ token ไว้ใช้กับ request ที่ต้องยืนยันตัวตน
2. `Create Booking (Public)` ส่งข้อมูลการจองที่ถูกต้อง คาดหวัง HTTP 201 และตรวจว่า response มี `id` ของการจอง
3. `Get All Rooms` เรียก public endpoint คาดหวัง HTTP 200 และ response เป็น array

ตัวอย่าง negative cases:

1. `Login - Wrong Password` ส่งรหัสผ่านผิด คาดหวัง HTTP 401 เพื่อยืนยันว่าไม่สามารถข้าม authentication ได้
2. `Export Reports - Unauthorized` เรียกรายงานโดยไม่ส่ง token คาดหวัง HTTP 401 เพื่อยืนยันว่า protected route ปฏิเสธ anonymous user

การมีทั้งสองแบบสำคัญ เพราะ positive cases พิสูจน์ว่าฟังก์ชันทำงานเมื่อข้อมูลถูกต้อง ขณะที่ negative cases พิสูจน์ว่าระบบปฏิเสธข้อมูลหรือสิทธิ์ที่ไม่ถูกต้องตามข้อกำหนด

## คำถาม 5.1 — Self-hosted runner เทียบกับ ubuntu-latest

Workflow เดิมใช้ `self-hosted` เพื่อให้ job เข้าถึงเครื่องมือและบริการบนเครื่องของผู้พัฒนา เช่น Docker, database ภายใน หรือ cache ที่ติดตั้งไว้แล้ว ข้อดีคือควบคุม environment และทรัพยากรได้เอง ลดเวลาดาวน์โหลดซ้ำ และเข้าถึงระบบ private network ได้ ข้อเสียคือต้องดูแล patch, disk, runner service และความปลอดภัยเอง หาก repository หรือ workflow ที่ไม่น่าเชื่อถือรันบนเครื่องดังกล่าวอาจกระทบข้อมูลในเครื่องได้ รวมถึง runner อาจ offline ทำให้ pipeline ค้าง

`ubuntu-latest` เป็น GitHub-hosted runner ที่สร้างเครื่องใหม่ต่อ job ดูแลระบบและ isolation ให้ เหมาะกับ CI ที่ต้องการ reproducibility แต่มีเวลาติดตั้ง dependency ใหม่ทุกครั้ง จำกัดเวลา/ทรัพยากร และเข้าถึงระบบภายในไม่ได้โดยตรง ใบงานฉบับนี้จึงปรับ job หลักไปใช้ `ubuntu-latest` พร้อม PostgreSQL service container

## คำถาม 10.3 — Helmet และ Security Headers

ให้รันคำสั่งนี้หลัง Backend ทำงาน แล้ววาง output จริงต่อท้ายหัวข้อนี้:

```bash
curl -I http://localhost:3001/api/rooms
```

Output จริงจาก `curl -I http://localhost:3001/api/rooms` เมื่อวันที่ 15 พฤศจิกายน 2569:

```http
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; base-uri 'self'; frame-ancestors 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Vary: Origin
RateLimit: "100-in-15min"
Content-Type: application/json; charset=utf-8
```

ความหมายของ headers สำคัญ:

| Header | การป้องกัน |
|---|---|
| `Content-Security-Policy` | จำกัดแหล่งที่ browser อนุญาตให้โหลด script/style/resource ช่วยลดผลกระทบของ XSS และ content injection |
| `X-Frame-Options` | ป้องกันหน้าเว็บถูกฝังใน frame ของเว็บไซต์อื่นเพื่อลด clickjacking |
| `X-Content-Type-Options: nosniff` | ไม่ให้ browser เดาประเภทไฟล์ต่างจาก `Content-Type` ลดการตีความไฟล์เป็น script โดยไม่ตั้งใจ |
| `Strict-Transport-Security` | สั่ง browser ใช้ HTTPS ในการเชื่อมต่อครั้งต่อไป ลด SSL stripping เมื่อให้บริการผ่าน HTTPS |
| `Referrer-Policy` | จำกัดข้อมูล URL ต้นทางที่ส่งไปยังเว็บไซต์อื่น ลดการรั่วไหลของข้อมูลผ่าน Referer header |
| `Cross-Origin-Resource-Policy` | จำกัดเว็บไซต์อื่นในการโหลด resource ข้าม origin ลดการนำข้อมูลไปใช้จาก origin ที่ไม่อนุญาต |

## คำถามทบทวน 1 — CI และ CD

Continuous Integration (CI) คือการรวมและตรวจ code โดยอัตโนมัติทุกครั้งที่ push หรือเปิด pull request เพื่อให้พบปัญหาเร็ว ใน workflow นี้ `backend-test` รัน migration และ Newman, `frontend-build` รัน lint/build และ `security-scan` ตรวจ dependency กับ secrets ก่อนอนุญาตให้ deploy

Continuous Deployment (CD) คือการนำ revision ที่ผ่าน quality gates ไปติดตั้งใน environment เป้าหมายโดยอัตโนมัติ ใน workflow นี้การ push เข้า `main` ที่ผ่าน Security Scanning จะ deploy Frontend ไป Vercel และเรียก Render deploy hook สำหรับ Backend จากนั้นจึงรัน production smoke tests หากใช้ required reviewer ก่อน production ขั้นตอนนี้จะเป็น Continuous Delivery จนกว่าจะมีผู้อนุมัติ

## คำถามทบทวน 2 — แยก Frontend และ Backend

ข้อดีของการแยก Vercel กับ Render คือ deploy และ scale แต่ละส่วนอิสระ ใช้ platform ที่เหมาะกับงาน static frontend และ Node/PostgreSQL backend ลดผลกระทบเมื่อส่วนหนึ่งเปลี่ยน และ rollback แยกกันได้ ข้อเสียคือมี configuration มากขึ้น ต้องจัดการ CORS, environment variables, URL, monitoring และ deployment สองระบบ หาก Backend ล่ม Frontend อาจยังเปิดได้แต่ใช้งานข้อมูลไม่ได้ และต้องตรวจ compatibility ของ API กับ UI ระหว่าง revision

เมื่อ deploy บน server เดียว configuration และ network ง่ายกว่าและหลีกเลี่ยง CORS ได้ แต่ทั้งสองส่วนผูกกับ failure domain เดียว scale/rollback แยกยาก และต้องดูแล server, TLS และ process management เอง

## คำถามทบทวน 3 — CI Tests และ Smoke Tests

Newman CI tests รันก่อน deploy กับ PostgreSQL test database ที่แยกจาก production จึงทดสอบได้ละเอียดและสร้าง/แก้ไข/ลบ test data ได้ ส่วน Post-Deploy Smoke Tests รันหลัง deploy กับ URL จริง เน้นตรวจความพร้อมพื้นฐานอย่างรวดเร็วและใช้ read-only requests เพื่อลดความเสี่ยงต่อข้อมูลจริง

ต้องมีทั้งสองแบบเพราะ CI tests พิสูจน์ logic ใน environment ควบคุม แต่ smoke tests พิสูจน์ว่า artifact, cloud configuration, DNS, environment variables, database และ network ของ production ทำงานร่วมกันจริง ตัวอย่างที่ CI ผ่านแต่ smoke fail คือกำหนด `DATABASE_URL` บน Render ผิด, ไม่ได้ตั้ง `VITE_API_URL`, deploy hook ชี้ service ผิด หรือ service เริ่มทำงานไม่ทัน health check

## คำถามทบทวน 4 — Security Layers

| ชั้น | เครื่องมือ | ป้องกันอะไร |
|---|---|---|
| Runtime | Helmet.js | เพิ่ม HTTP security headers เพื่อลด XSS, clickjacking, MIME sniffing และ protocol downgrade |
| Runtime | express-rate-limit | จำกัด request ต่อ IP ลด brute force, scraping และ resource exhaustion |
| Runtime | CORS | จำกัด browser origin ที่ได้รับอนุญาตให้อ่าน API response; ไม่ใช่ระบบ authentication |
| Runtime | bcryptjs | hash รหัสผ่านแบบใส่ salt ทำให้ไม่เก็บ plain-text password และเพิ่มต้นทุนการเดารหัสผ่านจากฐานข้อมูลที่รั่ว |
| CI Pipeline | npm audit | เปรียบเทียบ dependency tree กับฐานข้อมูลช่องโหว่ที่ทราบและทำให้ pipeline fail ตาม severity threshold |
| CI Pipeline | TruffleHog | ค้นหา token/key/credential ที่เผลอเขียนหรือ commit เข้า repository |
| CI Pipeline | OWASP Dependency-Check | เชื่อม dependency กับ CVE/CVSS เพื่อทำรายงานและหยุด pipeline เมื่อพบความเสี่ยงสูง |

การป้องกันเหล่านี้เป็น defense in depth แต่ไม่ทดแทน authorization, input validation, secure secret rotation หรือการตรวจระบบจริง

## คำถามทบทวน 5 — Secrets Management

GitHub Secrets เก็บค่า credential แยกจาก source code จำกัดผู้ที่อ่าน/ใช้ได้ และปกปิดค่าที่ตรงกันใน log ส่วน YAML ถูกเก็บใน Git history และมักมองเห็นได้โดยผู้ที่อ่าน repository หากเขียน `JWT_SECRET` ตรงใน YAML ค่านั้นจะคงอยู่ใน commit history แม้ลบภายหลัง ผู้โจมตีสามารถสร้าง token ปลอมที่ Backend ยอมรับได้ จึงต้อง rotate secret และยกเลิกค่าที่รั่วทันที

อย่างไรก็ตาม GitHub Secrets ไม่ป้องกัน workflow ที่เป็นอันตรายจากการส่งค่าออกภายนอก จึงต้อง review การแก้ workflow, จำกัด environment, ใช้ least privilege และไม่ส่ง production secrets ให้ workflow จาก pull request ที่ไม่น่าเชื่อถือ

## คำถามทบทวน 6 — Branch Strategy

Feature branches ใช้พัฒนางานย่อยและผ่าน CI ก่อน merge เข้า `develop` จากนั้น `develop` deploy ไป QA สำหรับ integration testing เมื่อพร้อมจึงเลื่อนไป `staging` เพื่อทดสอบ release candidate ที่ใกล้ production และสุดท้าย merge เข้า `main` เพื่อ deploy production

หลาย environment ช่วยแยกข้อมูลและความเสี่ยง ทำให้ตรวจ bug/configuration กับ revision เดียวกับที่จะปล่อยจริง มีจุดอนุมัติและ rollback ที่ชัดเจน และไม่ให้ code ที่เพิ่งรวมกันเข้าถึงผู้ใช้ทันที หาก deploy จาก `develop` ไป production โดยตรง การเปลี่ยนหลาย feature อาจเข้าพร้อมกันโดยยังไม่ผ่าน regression/UAT และแกะหาสาเหตุหรือ rollback ได้ยากกว่า

## หลักฐาน Cloud และ GitHub Actions ที่ยังต้องทำด้วยบัญชีเจ้าของงาน

- Fork repository ไปยังบัญชีของผู้ส่งและเปลี่ยน remote ให้ถูกต้อง
- ตั้ง GitHub Environments: `qa`, `staging`, `production`
- ตั้ง repository/environment secrets: `VERCEL_TOKEN`, `VERCEL_FRONTEND_URL`, `RENDER_DEPLOY_HOOK_URL`, `RENDER_BACKEND_URL`, `RENDER_QA_DEPLOY_HOOK`
- ตั้ง environment variable `QA_BACKEND_URL` ใน environment `qa`
- เชื่อม repository กับ Vercel และกำหนด `VITE_API_URL`
- สร้าง PostgreSQL และ Web Service บน Render พร้อม `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `NODE_ENV=production`
- Push หลังตรวจ diff แล้ว บันทึกภาพ Actions ที่ทุก job ผ่าน URL ของทั้งสองบริการ และ artifacts ของ Newman/OWASP/Smoke Test

