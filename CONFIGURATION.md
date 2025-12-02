# Project Configuration Guide

Complete configuration guide for the Document Management System.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Configuration Overview](#configuration-overview)
- [Database Setup](#database-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Ports & Services](#ports--services)
- [Production Deployment](#production-deployment)

---

## 🚀 Quick Start

### 1. Database Setup

```bash
cd database
# Windows:
setup-docker.bat
# Linux/Mac:
chmod +x setup-docker.sh && ./setup-docker.sh
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Database: localhost:5432

---

## 📊 Configuration Overview

### Standard Configuration

| Service    | Port | Host      | Database Name | Container Name |
|------------|------|-----------|---------------|----------------|
| Database   | 5432 | localhost | `dms_db`      | `dms-postgres` |
| Backend    | 3001 | localhost | -             | -              |
| Frontend   | 3000 | localhost | -             | -              |

### Directory Structure

```
project/
├── backend/
│   ├── .env                 # Your config (NOT in git)
│   ├── .env.example         # Template
│   └── uploads/             # File uploads
├── frontend/
│   ├── .env.local           # Your config (NOT in git)
│   └── .env.example         # Template
└── database/
    ├── schema.sql           # Database schema
    ├── setup-docker.bat     # Windows setup
    └── setup-docker.sh      # Linux/Mac setup
```

---

## 🗄️ Database Setup

### Configuration

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dms_db
DB_USER=postgres
DB_PASSWORD=postgres
```

### Connection String

```
postgresql://postgres:postgres@localhost:5432/dms_db
```

### Docker Setup

**Container Details:**
- Name: `dms-postgres`
- Image: `pgvector/pgvector:pg18`
- Port: 5432 (mapped to host 5432)
- Database: `dms_db`

**Management Commands:**

```bash
# Start database
docker start dms-postgres

# Stop database
docker stop dms-postgres

# Connect to database
docker exec -it dms-postgres psql -U postgres -d dms_db

# View logs
docker logs dms-postgres

# Backup database
docker exec dms-postgres pg_dump -U postgres dms_db > backup.sql

# Restore database
cat backup.sql | docker exec -i dms-postgres psql -U postgres -d dms_db
```

---

## 🔧 Backend Setup

### Environment Variables

Create `backend/.env` from `backend/.env.example`:

```bash
cd backend
cp .env.example .env
```

### Required Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dms_db

# Server
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your-secure-random-secret-here

# AI Services (REQUIRED)
GEMINI_API_KEY=your-gemini-api-key
```

### Get Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Create/login to Google account
3. Create new API key
4. Copy and paste into `.env`

### Install Dependencies

```bash
cd backend
npm install
```

### Run Backend

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### Verify Backend

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-12-02T..."}
```

---

## 🎨 Frontend Setup

### Environment Variables

Create `frontend/.env.local` from `frontend/.env.example`:

```bash
cd frontend
cp .env.example .env.local
```

### Required Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Application Info
NEXT_PUBLIC_APP_NAME=Document Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Install Dependencies

```bash
cd frontend
npm install
```

### Run Frontend

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

### Access Frontend

Open browser: http://localhost:3000

---

## 🔐 Environment Variables Reference

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `DB_HOST` | ✅ | localhost | Database host |
| `DB_PORT` | ✅ | 5432 | Database port |
| `DB_NAME` | ✅ | dms_db | Database name |
| `DB_USER` | ✅ | postgres | Database user |
| `DB_PASSWORD` | ✅ | postgres | Database password |
| `PORT` | ✅ | 3001 | Backend server port |
| `NODE_ENV` | ✅ | development | Environment mode |
| `JWT_SECRET` | ✅ | - | JWT signing secret |
| `JWT_EXPIRES_IN` | ❌ | 7d | JWT token expiration |
| `GEMINI_API_KEY` | ✅ | - | Google Gemini API key |
| `GEMINI_MODEL` | ❌ | gemini-2.0-flash-exp | AI model to use |
| `UPLOAD_PATH` | ❌ | ./uploads | File upload directory |
| `MAX_FILE_SIZE` | ❌ | 52428800 | Max file size (50MB) |
| `CORS_ORIGIN` | ❌ | http://localhost:3000 | Allowed CORS origins |
| `LOG_LEVEL` | ❌ | info | Logging level |

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | - | Backend API URL |
| `NEXT_PUBLIC_APP_NAME` | ❌ | Document Management System | App name |
| `NEXT_PUBLIC_APP_VERSION` | ❌ | 1.0.0 | App version |

> **Note:** Next.js uses `.env.local` (not `.env`) for local development

---

## 🌐 Ports & Services

### Development Ports

```
┌─────────────────────────────────────┐
│  Frontend (Next.js)                 │
│  http://localhost:3000              │
└─────────────────────────────────────┘
               ↓ API calls
┌─────────────────────────────────────┐
│  Backend (Express)                  │
│  http://localhost:3001/api          │
└─────────────────────────────────────┘
               ↓ Database queries
┌─────────────────────────────────────┐
│  PostgreSQL + pgvector              │
│  postgresql://localhost:5432/dms_db │
└─────────────────────────────────────┘
```

### Port Conflicts

If you encounter port conflicts:

**Frontend (3000):**
```bash
# Change port temporarily
npm run dev -- -p 3001

# Or set in package.json:
"dev": "next dev --turbopack -p 3001"
```

**Backend (3001):**
```env
# Change in .env:
PORT=3002
```

**Database (5432):**
```bash
# Change Docker port mapping:
docker run -p 5433:5432 ...
# Then update DATABASE_URL to use port 5433
```

---

## 🚀 Production Deployment

### Environment Setup

1. **Database:**
   - Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
   - Enable SSL/TLS
   - Set strong password
   - Regular backups

2. **Backend:**
   ```env
   NODE_ENV=production
   DATABASE_URL=your-production-database-url
   JWT_SECRET=generate-strong-64-char-random-secret
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Frontend:**
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
   ```

### Security Checklist

- [ ] Change default database password
- [ ] Generate strong JWT_SECRET (64+ characters)
- [ ] Use environment variables (never hardcode secrets)
- [ ] Enable HTTPS/SSL for all services
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Use database connection pooling
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Use secrets manager (AWS Secrets Manager, etc.)

### Docker Compose (Production)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  database:
    image: pgvector/pgvector:pg18
    container_name: dms-postgres-prod
    environment:
      POSTGRES_DB: dms_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: dms-backend-prod
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@database:5432/dms_db
      JWT_SECRET: ${JWT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      NODE_ENV: production
    depends_on:
      - database
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: dms-frontend-prod
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 🆘 Troubleshooting

### Database Connection Failed

```bash
# Check if database is running
docker ps | grep dms-postgres

# Check database logs
docker logs dms-postgres

# Test connection
psql postgresql://postgres:postgres@localhost:5432/dms_db
```

### Backend Won't Start

```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # Linux/Mac

# Check backend logs
npm run dev
```

### Frontend Can't Connect to Backend

1. Verify backend is running: http://localhost:3001/api/health
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for CORS errors
4. Verify CORS_ORIGIN in backend `.env`

### Environment Variables Not Loading

**Backend:**
- Make sure file is named `.env` (not `.env.txt`)
- Restart server after changing `.env`
- Check for syntax errors in `.env`

**Frontend:**
- Make sure file is named `.env.local` (not `.env`)
- Restart Next.js dev server
- Verify variables start with `NEXT_PUBLIC_`

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Docker Documentation](https://docs.docker.com/)
- [Gemini AI API](https://ai.google.dev/)

---

## 🔒 Security Best Practices

1. **Never commit sensitive files:**
   - `.env`
   - `.env.local`
   - `uploads/*` (user files)
   - `node_modules/`

2. **Use strong secrets:**
   ```bash
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Keep dependencies updated:**
   ```bash
   npm audit
   npm update
   ```

4. **Use HTTPS in production**

5. **Implement proper authentication & authorization**

---

**Last Updated:** 2025-12-02
**Version:** 1.0.0
