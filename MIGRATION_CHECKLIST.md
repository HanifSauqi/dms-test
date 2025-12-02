# 🔄 Migration Checklist - Standardisasi Laptop Anda

## ✅ Yang Sudah Dilakukan Otomatis

### 1. File Konfigurasi Diupdate ✅

**Backend (.env):**
```diff
- DATABASE_URL=postgresql://postgres:1234@localhost:54322/document_management_system_optimized
+ DATABASE_URL=postgresql://postgres:1234@localhost:5432/dms_db

+ DB_HOST=localhost
+ DB_PORT=5432
+ DB_NAME=dms_db
+ DB_USER=postgres
+ DB_PASSWORD=1234
+ CORS_ORIGIN=http://localhost:3000
+ LOG_LEVEL=info
+ GEMINI_MODEL=gemini-2.0-flash-exp
```

**Frontend (.env.local):**
```diff
  NEXT_PUBLIC_API_URL=http://localhost:3001/api
+ NEXT_PUBLIC_APP_NAME=Document Management System
+ NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Frontend (package.json):**
```diff
- "dev": "next dev --turbopack -p 3010"
+ "dev": "next dev --turbopack"  # Port 3000 (standard)
```

### 2. Template Files Dibuat ✅

- ✅ `backend/.env.example` - Updated & comprehensive
- ✅ `frontend/.env.example` - Created (baru)

### 3. Dokumentasi Dibuat ✅

- ✅ `README.md` - Main project documentation
- ✅ `CONFIGURATION.md` - Complete setup guide
- ✅ `STANDARDIZATION_SUMMARY.md` - All changes
- ✅ `QUICK_REFERENCE.md` - Cheat sheet
- ✅ `database/README.md` - Database guide

### 4. Database Setup Scripts ✅

- ✅ `database/setup-docker.bat` - Windows
- ✅ `database/setup-docker.sh` - Linux/Mac
- ✅ `database/migrate-to-standard.bat` - Migration script (Windows)
- ✅ `database/migrate-to-standard.sh` - Migration script (Linux/Mac)

---

## 🚀 Yang Perlu Anda Lakukan Sekarang

### Option A: Migrate Database yang Ada (Recommended)

Jika Anda ingin tetap pakai data yang sudah ada:

```bash
cd database
migrate-to-standard.bat  # Windows
```

Script ini akan:
1. ✅ Backup database lama Anda
2. ✅ Create database baru dengan nama standar (dms_db)
3. ✅ Copy semua data ke database baru
4. ✅ Keep database lama sebagai backup

**Setelah migration:**
```bash
# Restart backend
cd backend
npm run dev

# Restart frontend (terminal baru)
cd frontend
npm run dev
```

### Option B: Setup Database Baru (Clean Start)

Jika Anda mau mulai fresh:

```bash
cd database
setup-docker.bat  # Windows
```

Ini akan create database baru kosong dengan nama `dms_db`.

---

## 📋 Verification Checklist

Setelah migration/setup, verify dengan checklist ini:

### Database ✅
```bash
# 1. Check container baru running
docker ps | findstr dms-postgres

# Expected: dms-postgres container running on port 5432

# 2. Connect ke database baru
docker exec -it dms-postgres psql -U postgres -d dms_db

# 3. Check tables
\dt

# Expected: 9 tables (users, folders, documents, etc.)

# 4. Exit
\q
```

### Backend ✅
```bash
# 1. Check .env file
cd backend
type .env

# Expected: DATABASE_URL points to dms_db on port 5432

# 2. Restart backend
npm run dev

# Expected: Server running on port 3001
# Expected: "Database connected successfully" or similar
```

### Frontend ✅
```bash
# 1. Check .env.local
cd frontend
type .env.local

# Expected: NEXT_PUBLIC_API_URL=http://localhost:3001/api

# 2. Restart frontend
npm run dev

# Expected: Server running on port 3000 (not 3010!)
```

### Test Application ✅
```bash
# 1. Open browser: http://localhost:3000
# 2. Try login/register
# 3. Try create folder
# 4. Try upload document
```

---

## 🔍 Troubleshooting

### Database Connection Error

**Error:** `ECONNREFUSED ::1:5432`

**Solution:**
```bash
# Check if new container running
docker ps | findstr dms-postgres

# If not running, start it
docker start dms-postgres

# If doesn't exist, run migration
cd database
migrate-to-standard.bat
```

### Backend Can't Connect to Database

**Error:** `database "dms_db" does not exist`

**Solution:**
```bash
# Run migration or setup script
cd database
migrate-to-standard.bat  # to migrate existing data
# OR
setup-docker.bat  # for fresh database
```

### Frontend Shows API Error

**Error:** `Network Error` or `Cannot connect to API`

**Solution:**
```bash
# 1. Check backend is running
curl http://localhost:3001/api/health

# 2. Check .env.local
type frontend\.env.local

# 3. Restart frontend
cd frontend
npm run dev
```

### Port Conflict

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Option 1: Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Option 2: Change port temporarily
cd frontend
npm run dev -- -p 3001
```

---

## 📊 Configuration Summary

| Component | Old | New | Status |
|-----------|-----|-----|--------|
| **Database Name** | `document_management_system_optimized` | `dms_db` | ✅ Updated |
| **Database Port** | 54322 | 5432 | ✅ Updated |
| **Database Container** | `postgres-vector-optimized` | `dms-postgres` | ✅ Updated |
| **Backend Port** | 3001 | 3001 | ✅ Same |
| **Frontend Port** | 3010 | 3000 | ✅ Updated |
| **Backend .env** | Basic | Comprehensive | ✅ Updated |
| **Frontend .env.local** | Minimal | Complete | ✅ Updated |

---

## 🎯 Next Steps After Verification

### 1. Commit Changes to Git

```bash
# Check what changed
git status

# Should show:
# - Modified: backend/.env.example
# - Modified: frontend/.env.example
# - Modified: frontend/package.json
# - Modified: .gitignore
# - New: README.md, CONFIGURATION.md, etc.

# Add and commit
git add .
git commit -m "Standardize configuration and documentation"
```

### 2. Push to GitHub

```bash
git push origin main
```

**PENTING:** Make sure `.env` dan `.env.local` TIDAK ter-commit!
Check `.gitignore` sudah include:
```
.env
.env.local
.env.*.local
```

### 3. Optional: Remove Old Container

Setelah verify semua works:

```bash
# Stop old container
docker stop postgres-vector-optimized

# Optional: Remove old container (if you don't need backup)
docker rm postgres-vector-optimized
```

---

## 🔐 Security Reminder

### Before Push ke GitHub:

1. ✅ Verify `.env` NOT in git:
   ```bash
   git status | findstr .env
   # Should NOT show .env or .env.local
   ```

2. ✅ Verify `.env.example` IS in git:
   ```bash
   git status | findstr .env.example
   # SHOULD show .env.example files
   ```

3. ✅ Verify no API keys in examples:
   ```bash
   type backend\.env.example | findstr "AIza"
   # Should show: GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   # NOT your actual key!
   ```

---

## 📞 Need Help?

Jika ada error atau issue:

1. Check `CONFIGURATION.md` - Troubleshooting section
2. Check `QUICK_REFERENCE.md` - Common solutions
3. Check container logs: `docker logs dms-postgres`
4. Check backend logs in terminal

---

**Last Updated:** 2025-12-02
**Your Configuration Status:** ✅ Ready to Migrate
