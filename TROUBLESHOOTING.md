# 🔧 Troubleshooting Guide - DMS

Panduan mengatasi masalah umum saat setup dan menjalankan aplikasi.

---

## 🚨 Turbopack Error: "Next.js package not found"

### **Gejala:**
```
Error: Turbopack build failed with 1 errors:
./src/app
Error: Next.js inferred your workspace root, but it may not be correct.
We couldn't find the Next.js package (next/package.json)...
```

### **Penyebab:**
1. Build cache (`.next`) yang corrupt/outdated
2. `node_modules` dari versi Next.js lama
3. npm workspace monorepo structure
4. Path dengan spasi di nama folder

### **Solusi:**

#### **Opsi 1: Automated Fix (RECOMMENDED)**
```bash
# Jalankan script fresh install
setup-fresh-install.bat
```

#### **Opsi 2: Manual Fix**
```bash
# 1. Hapus semua cache dan dependencies
cd frontend
rd /s /q .next node_modules
del package-lock.json

cd ../backend
rd /s /q node_modules
del package-lock.json

cd ..
rd /s /q node_modules
del package-lock.json

# 2. Install ulang semua dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Test frontend
cd frontend
npm run dev
```

#### **Opsi 3: Gunakan Tanpa Turbopack**
Jika masih error, gunakan webpack biasa:
```bash
cd frontend
npm run dev:no-turbo
```

---

## ⚠️ Security Vulnerability Warning

### **Gejala:**
```
npm warn deprecated next@15.5.2: This version has a security vulnerability
CVE-2025-66478
```

### **Penyebab:**
Next.js versi lama dengan critical RCE vulnerability (CVSS 10.0)

### **Solusi:**
```bash
cd frontend
npm install next@latest react@latest react-dom@latest
```

Atau jalankan:
```bash
npx fix-react2shell-next
```

---

## 🗄️ Database Connection Error

### **Gejala:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

### **Penyebab:**
PostgreSQL tidak berjalan

### **Solusi Windows:**
```bash
# Check status
sc query postgresql-x64-18

# Start service
net start postgresql-x64-18
```

### **Test Connection:**
```bash
psql -U postgres -h localhost -p 5432 -d postgres
```

---

## 🔐 GEMINI_API_KEY Error

### **Gejala:**
```
Error: GEMINI_API_KEY is not configured
```

### **Penyebab:**
API key belum diset di `.env`

### **Solusi:**
1. Buka https://makersuite.google.com/app/apikey
2. Generate API key (gratis)
3. Edit `backend/.env`:
   ```env
   GEMINI_API_KEY=your-actual-api-key-here
   ```

---

## 📦 npm install Error: EPERM

### **Gejala:**
```
npm warn cleanup Failed to remove some directories
EPERM: operation not permitted
```

### **Penyebab:**
File sedang digunakan atau permission issue

### **Solusi:**
1. Close semua terminal yang menjalankan npm/node
2. Close VS Code
3. Restart terminal sebagai Administrator
4. Run npm install lagi

---

## 🚫 Port Already in Use

### **Gejala:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

### **Solusi Windows:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (ganti PID dengan nomor dari command di atas)
taskkill /PID <PID> /F

# Atau gunakan port lain
# Edit frontend/.env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 🔄 Module Not Found After Update

### **Gejala:**
```
Error: Cannot find module 'xxx'
```

### **Solusi:**
```bash
# Clear cache dan reinstall
npm cache clean --force
rd /s /q node_modules package-lock.json
npm install
```

---

## 🏗️ Build Error: "Cannot resolve module"

### **Gejala:**
Compile error saat build atau dev

### **Solusi:**
```bash
# Clear Next.js cache
cd frontend
rd /s /q .next
npm run dev
```

---

## 🔑 JWT Secret Warning

### **Gejala:**
```
Warning: Using default JWT secret is insecure
```

### **Solusi:**
Edit `backend/.env`:
```bash
# Generate secure random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy hasil ke JWT_SECRET di .env
JWT_SECRET=hasil-random-string-panjang-dari-command-di-atas
```

---

## 📁 Path dengan Spasi Issue

### **Gejala:**
Various errors dengan path seperti "D:\Project\PDU 2\..."

### **Solusi:**
1. **Untuk Turbopack:** Sudah di-handle dengan config `turbopack.root`
2. **Jika masih error:** Clone project ke path tanpa spasi:
   ```bash
   # Bad:  D:\Project\PDU 2\Dms_pdu
   # Good: D:\Project\PDU2\Dms_pdu
   # Good: D:\Projects\Dms_pdu
   ```

---

## 🔄 Fresh Start (Nuclear Option)

Jika semua solusi di atas tidak berhasil:

```bash
# 1. Backup file .env
copy backend\.env backend\.env.backup

# 2. Hapus SEMUA
rd /s /q node_modules backend\node_modules frontend\node_modules
rd /s /q frontend\.next
del /f package-lock.json backend\package-lock.json frontend\package-lock.json

# 3. Fresh install
setup-fresh-install.bat

# 4. Restore .env
copy backend\.env.backup backend\.env
```

---

## 📞 Masih Bermasalah?

1. Cek log error lengkap
2. Screenshot error message
3. Cek versi:
   ```bash
   node --version  # Harus >= 18.18.0
   npm --version
   psql --version  # PostgreSQL harus >= 12
   ```
4. Open issue di GitHub atau contact team

---

## ✅ Verifikasi Setup Berhasil

Semua ini harus berfungsi:

```bash
# 1. Backend health check
curl http://localhost:3001/api/health

# 2. Frontend accessible
curl http://localhost:3000

# 3. Database connection
psql -U postgres -h localhost -p 5432 -d dms_db_test

# 4. Login berhasil
# Buka http://localhost:3000/auth/login
# Email: admin@dms.com
# Password: admin123
```

Jika semua di atas berhasil, setup Anda sudah sempurna! 🎉
