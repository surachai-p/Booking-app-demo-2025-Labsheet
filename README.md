# booking-app-demo-2025

## Features

This is a comprehensive hotel booking management system with separate frontend and backend applications.

### 🏨 Core Features

- **Public Booking System**: Customers can book hotel rooms through an intuitive web interface
- **Room Management**: Administrators can add, edit, and manage hotel room inventory
- **Booking Administration**: Complete CRUD operations for managing reservations
- **User Authentication**: Secure JWT-based authentication for admin access
- **Reports & Analytics**: Generate and export booking reports in CSV/JSON formats
- **Responsive Design**: Modern, mobile-friendly interface built with React and Tailwind CSS

### 🔧 Technical Features

- **Database**: PostgreSQL with Prisma ORM (migrated from SQLite)
- **Backend**: Node.js/Express REST API with authentication and validation
- **Frontend**: React application with Vite build system
- **Styling**: Tailwind CSS for responsive design
- **Testing**: Newman API testing and Robot Framework UI testing
- **CI/CD**: GitHub Actions with self-hosted runners
- **Deployment**: Multi-environment support (QA, Staging, Production)

### 📊 Admin Dashboard

- **Booking Management**: View, create, edit, and cancel bookings
- **Room Inventory**: Manage room types, capacity, and availability
- **Reports**: Generate detailed booking reports with export functionality
- **User Management**: Admin authentication and role-based access control

### 🌐 API Endpoints

- `POST /api/login` - User authentication
- `GET/POST/PUT/DELETE /api/bookings` - Booking CRUD operations
- `GET/POST/PUT/DELETE /api/rooms` - Room management (admin only)
- `GET /api/reports` - View booking reports
- `GET /api/reports/export` - Export reports (CSV/JSON)

## Backend: PostgreSQL + Prisma

The backend has been migrated from SQLite to PostgreSQL using Prisma ORM.

### Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Update `DATABASE_URL` in `backend/.env` with your PostgreSQL credentials.
3. Install backend dependencies:
   ```bash
   npm install
   ```
4. Start the local PostgreSQL container:
   ```bash
   cd backend
   docker compose up -d
   ```
5. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
6. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
7. Start the backend:
   ```bash
   npm run dev
   ```

### Notes

- Default `JWT_SECRET` is set in `.env`.
- The local PostgreSQL connection string in `.env` is a placeholder and must be updated to match your environment.
- The old `bookings.db` SQLite file has been removed.

## GitHub Self-hosted Runner

This repository can run on a GitHub self-hosted runner. Follow these steps to set it up and test it.

### 1. เตรียมเครื่อง self-hosted runner

1. เลือกเครื่องที่จะใช้เป็น runner (Linux/macOS/Windows).
2. ติดตั้ง Git และ Node.js.
3. ถ้าจะใช้ Docker ให้ติดตั้ง Docker ด้วย.

### 2. สร้าง runner ใน GitHub

1. ไปที่ GitHub repository ของคุณ.
2. เลือก `Settings` > `Actions` > `Runners`.
3. คลิก `New self-hosted runner`.
4. เลือกระบบปฏิบัติการที่ใช้งาน.
5. คัดลอกคำสั่ง `config` และ `run` ที่ GitHub ให้มา.

### 3. ติดตั้ง runner บนเครื่อง

ตัวอย่างบน Linux / macOS:

```bash
mkdir actions-runner && cd actions-runner
curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/download/v2.308.0/actions-runner-linux-x64-2.308.0.tar.gz
tar xzf actions-runner.tar.gz
./config.sh --url https://github.com/<owner>/<repo> --token <TOKEN>
```

บน Windows:

```powershell
mkdir actions-runner
cd actions-runner
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.308.0/actions-runner-win-x64-2.308.0.zip -OutFile actions-runner.zip
Expand-Archive actions-runner.zip
.\\config.cmd --url https://github.com/<owner>/<repo> --token <TOKEN>
```

### 4. เริ่ม runner

- Linux/macOS:
  ```bash
  ./run.sh
  ```
- Windows:
  ```powershell
  .\run.cmd
  ```

ถ้าต้องการให้เป็น service บน Linux/macOS:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

### 5. สร้าง workflow ให้ใช้ self-hosted runner

สร้างไฟล์ `.github/workflows/ci.yml` ใน repository:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:

jobs:
  build:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install backend dependencies
        run: |
          cd backend
          npm install
      - name: Start PostgreSQL with Docker Compose
        run: |
          cd backend
          docker compose up -d
      - name: Generate Prisma client
        run: |
          cd backend
          npx prisma generate
      - name: Run backend migrations
        run: |
          cd backend
          npx prisma migrate dev --name init
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
      - name: Build frontend
        run: |
          cd frontend
          npm run build
```

> ตัวอย่าง workflow นี้อยู่ที่ `.github/workflows/ci.yml`

### 6. ทดสอบ workflow

1. เพิ่มไฟล์ workflow แล้ว commit และ push ขึ้น GitHub.
2. เข้า `Actions` ใน repository ดูสถานะ workflow.
3. ถ้า runner ทำงานได้สำเร็จ แสดงว่า setup ถูกต้อง.

> หมายเหตุ: ถ้าใช้ Docker ใน runner ให้ตรวจสอบว่า Docker service ทำงานได้บนเครื่อง self-hosted.

## CI/CD Deployment

This repository supports CI/CD deployment with frontend on Vercel and backend on cloud platforms.

### Frontend Deployment on Vercel

1. **Connect Repository to Vercel**:
   - Sign up/login to [Vercel](https://vercel.com)
   - Click "New Project" and import your GitHub repository
   - Select the repository and configure:

2. **Vercel Configuration**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables**:
   Add these environment variables in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend-domain.com
   ```

4. **Deploy**:
   - Vercel will automatically deploy on every push to `main` branch
   - Get the frontend URL from Vercel dashboard

### Backend Deployment Options

Choose one of the following platforms for backend deployment:

#### Option 1: Render

1. **Create Render Account**:
   - Sign up at [Render](https://render.com)

2. **Create PostgreSQL Database**:
   - Go to Dashboard > New > PostgreSQL
   - Create database and note the connection string

3. **Deploy Backend**:
   - New > Web Service
   - Connect GitHub repository
   - Configure:
     - **Runtime**: Node
     - **Build Command**: `npm install && npx prisma generate`
     - **Start Command**: `npm start`
     - **Root Directory**: `backend`

4. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```

#### Option 2: Railway

1. **Create Railway Account**:
   - Sign up at [Railway.app](https://railway.app)

2. **Create Project**:
   - New Project > Deploy from GitHub
   - Select repository

3. **Database Setup**:
   - Add PostgreSQL plugin
   - Railway will provide `DATABASE_URL` automatically

4. **Environment Variables**:
   ```
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```

#### Option 3: Digital Ocean App Platform

1. **Create Digital Ocean Account**:
   - Sign up at [Digital Ocean](https://digitalocean.com)

2. **Create App**:
   - Apps > Create App
   - Connect GitHub repository
   - **Source Directory**: `backend`

3. **Database Setup**:
   - Create PostgreSQL database in Digital Ocean
   - Add database connection string

4. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```

### Nginx Reverse Proxy Configuration

For production deployment with custom domain, use Nginx as reverse proxy:

1. **Install Nginx**:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Create Nginx Configuration**:
   Create `/etc/nginx/sites-available/booking-app`:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend (served by Vercel or static files)
       location / {
           proxy_pass https://your-vercel-app.vercel.app;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Backend API
       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;

           # CORS headers
           add_header 'Access-Control-Allow-Origin' 'https://your-vercel-app.vercel.app' always;
           add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
           add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

           if ($request_method = 'OPTIONS') {
               return 204;
           }
       }
   }
   ```

3. **Enable Site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/booking-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **SSL with Let's Encrypt** (optional):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Environment Variables Configuration

#### Frontend (.env.local for local development):
```
VITE_API_URL=http://localhost:3001
```

#### Frontend (Vercel environment variables):
```
VITE_API_URL=https://your-backend-domain.com
```

#### Backend (.env for all environments):
```
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secure-jwt-secret
NODE_ENV=production
```

### Deployment Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on chosen platform (Render/Railway/Digital Ocean)
- [ ] Database configured and migrated
- [ ] Environment variables set correctly
- [ ] Nginx reverse proxy configured (if using custom domain)
- [ ] SSL certificate configured
- [ ] Test API endpoints from frontend
- [ ] Verify CORS configuration

## Multiple Environments (QA, Staging, Production)

For production deployments, it's recommended to have separate environments for QA, Staging, and Production.

### Git Branching Strategy

Use Git Flow or similar branching strategy:

```
main (Production) ────┐
                      ├── deploy to Production
staging ──────────────┤
                      ├── deploy to Staging
develop ──────────────┐
                      ├── deploy to QA
feature/* ────────────┘
```

- **main**: Production-ready code
- **staging**: Release candidate testing
- **develop**: Development integration
- **feature/***: Individual feature development

### Environment-specific Configurations

#### 1. GitHub Environments

Create environments in GitHub repository:

1. Go to Repository Settings > Environments
2. Create environments: `qa`, `staging`, `production`
3. Add environment secrets and variables for each environment

#### 2. Deployment Workflows

Create separate workflow files for each environment:

**`.github/workflows/deploy-qa.yml`**:
```yaml
name: Deploy to QA

on:
  push:
    branches: [ develop ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: qa
    steps:
      - uses: actions/checkout@v4

      - name: Deploy Frontend to Vercel
        run: |
          # Vercel CLI deployment for QA
          npm install -g vercel
          cd frontend
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }} --scope ${{ secrets.VERCEL_SCOPE }}

      - name: Deploy Backend to Render
        run: |
          # Trigger Render deployment via webhook or API
          curl -X POST ${{ secrets.RENDER_DEPLOY_WEBHOOK }}
```

**`.github/workflows/deploy-staging.yml`**:
```yaml
name: Deploy to Staging

on:
  push:
    branches: [ staging ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy Frontend to Vercel
        run: |
          npm install -g vercel
          cd frontend
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }} --scope ${{ secrets.VERCEL_SCOPE }}

      - name: Deploy Backend
        run: |
          # Railway deployment
          curl -X POST ${{ secrets.RAILWAY_DEPLOY_WEBHOOK }}
```

**`.github/workflows/deploy-production.yml`**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy Frontend to Vercel
        run: |
          npm install -g vercel
          cd frontend
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }} --scope ${{ secrets.VERCEL_SCOPE }}

      - name: Deploy Backend
        run: |
          # Digital Ocean deployment
          curl -X POST ${{ secrets.DO_DEPLOY_WEBHOOK }}
```

#### 3. Environment Variables Management

Create environment-specific variable files:

**`frontend/.env.qa`**:
```
VITE_API_URL=https://qa-api.yourdomain.com
```

**`frontend/.env.staging`**:
```
VITE_API_URL=https://staging-api.yourdomain.com
```

**`frontend/.env.production`**:
```
VITE_API_URL=https://api.yourdomain.com
```

**`backend/.env.qa`**:
```
DATABASE_URL=postgresql://user:pass@qa-db-host:5432/qa_db
JWT_SECRET=qa-secret-key
NODE_ENV=production
```

**`backend/.env.staging`**:
```
DATABASE_URL=postgresql://user:pass@staging-db-host:5432/staging_db
JWT_SECRET=staging-secret-key
NODE_ENV=production
```

**`backend/.env.production`**:
```
DATABASE_URL=postgresql://user:pass@prod-db-host:5432/prod_db
JWT_SECRET=prod-secret-key
NODE_ENV=production
```

### Platform-specific Environment Setup

#### Vercel Environment Variables

For each Vercel project (QA, Staging, Production):

1. Go to Vercel Dashboard > Project Settings > Environment Variables
2. Add variables for each environment:
   - QA: `VITE_API_URL=https://qa-api.yourdomain.com`
   - Staging: `VITE_API_URL=https://staging-api.yourdomain.com`
   - Production: `VITE_API_URL=https://api.yourdomain.com`

#### Backend Platform Environment Variables

**Render**:
- Environment: Static (or pull from GitHub secrets)
- Add variables in Render dashboard for each service

**Railway**:
- Environment Variables in Railway dashboard
- Can use Railway's built-in environment management

**Digital Ocean**:
- Environment Variables in App Platform settings
- Separate apps for each environment

### Nginx Configuration for Multiple Environments

Create separate Nginx configurations for each environment:

**`/etc/nginx/sites-available/booking-qa`**:
```nginx
server {
    listen 80;
    server_name qa.yourdomain.com;

    location / {
        proxy_pass https://qa-vercel-app.vercel.app;
        # ... proxy settings
    }

    location /api/ {
        proxy_pass http://localhost:3002;  # QA backend port
        # ... proxy and CORS settings
    }
}
```

**`/etc/nginx/sites-available/booking-staging`**:
```nginx
server {
    listen 80;
    server_name staging.yourdomain.com;

    location / {
        proxy_pass https://staging-vercel-app.vercel.app;
        # ... proxy settings
    }

    location /api/ {
        proxy_pass http://localhost:3003;  # Staging backend port
        # ... proxy and CORS settings
    }
}
```

**`/etc/nginx/sites-available/booking-prod`**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass https://prod-vercel-app.vercel.app;
        # ... proxy settings
    }

    location /api/ {
        proxy_pass http://localhost:3001;  # Production backend port
        # ... proxy and CORS settings
    }
}
```

### Deployment Checklist for Multiple Environments

#### QA Environment
- [ ] QA branch created and protected
- [ ] QA database created
- [ ] QA Vercel project configured
- [ ] QA backend service deployed
- [ ] QA Nginx configuration applied
- [ ] QA domain/subdomain configured

#### Staging Environment
- [ ] Staging branch created and protected
- [ ] Staging database created
- [ ] Staging Vercel project configured
- [ ] Staging backend service deployed
- [ ] Staging Nginx configuration applied
- [ ] Staging domain/subdomain configured

#### Production Environment
- [ ] Main branch protected with required reviews
- [ ] Production database created
- [ ] Production Vercel project configured
- [ ] Production backend service deployed
- [ ] Production Nginx configuration applied
- [ ] Production domain configured
- [ ] SSL certificates configured for all domains

### Branch Protection Rules

Configure branch protection in GitHub:

**develop → QA**:
- Require pull request reviews
- Require status checks (CI)
- Restrict pushes to maintainers

**staging → Staging**:
- Require pull request reviews
- Require QA approval
- Require status checks

**main → Production**:
- Require pull request reviews
- Require staging approval
- Require security scans
- Restrict pushes to release managers

