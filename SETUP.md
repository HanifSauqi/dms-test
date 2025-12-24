# 🚀 Setup Guide - Document Management System

Panduan lengkap untuk setup project DMS setelah clone dari GitHub.

## 📋 Prerequisites

Pastikan sudah terinstall:
- **Node.js** v18.18.0+ atau v20.9.0+ ([Download](https://nodejs.org/))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

### ⚠️ Penting: Setup PostgreSQL PATH (Windows)

Setelah install PostgreSQL, tambahkan ke System PATH:

1. Tekan **Windows + R** → ketik `sysdm.cpl` → Enter
2. Klik tab **Advanced** → **Environment Variables...**
3. Di **System variables**, pilih **Path** → **Edit...**
4. Klik **New**, tambahkan:
   ```
   C:\Program Files\PostgreSQL\18\bin
   ```
   *(Sesuaikan angka `18` dengan versi PostgreSQL Anda)*
5. Klik **OK** (3x) untuk menutup semua window
6. **Restart terminal/CMD**

Test dengan: `psql --version`

---

## 🎯 Quick Start

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/dms-test.git
cd dms-test
```

### Step 2: Jalankan Setup Script

```bash
setup-fresh-install.bat
```

Script ini akan otomatis:
- ✅ Membersihkan cache & old dependencies
- ✅ Install semua dependencies (root, backend, frontend)
- ✅ Membuat file environment template
- ✅ Membuat folder `uploads` untuk penyimpanan file

### Step 3: Edit `backend/.env`

Buka file `backend/.env` dan isi dengan benar:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dms_db
DB_USER=postgres
DB_PASSWORD=password_postgresql_anda

# JWT Secret (WAJIB - minimal 32 karakter)
JWT_SECRET=random_string_panjang_minimal_32_karakter

# Gemini AI (Opsional - untuk fitur AI)
GEMINI_API_KEY=

# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

> ⚠️ **Ganti `DB_PASSWORD`** dengan password PostgreSQL Anda!

### Step 4: Setup Database

```bash
cd database
setup-postgresql.bat
```

*(Masukkan password PostgreSQL saat diminta)*

### Step 5: Buat Akun Superadmin 🔐

```bash
cd backend
npm run create-superadmin
```

**Default credentials:**
- Email: `admin@dms.com`
- Password: `admin123`

> ⚠️ **WAJIB ganti password setelah login pertama!**

### Step 6: Jalankan Aplikasi

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Running di: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Running di: http://localhost:3000

### Step 7: Akses Aplikasi

Buka browser: **http://localhost:3000**

Login dengan akun superadmin yang sudah dibuat.

---

## 🐛 Troubleshooting

### Error: `psql command not found`

PostgreSQL belum di PATH. Tambahkan `C:\Program Files\PostgreSQL\18\bin` ke System PATH.

### Error: `Missing DB_PASSWORD`

Pastikan `backend/.env` memiliki `DB_PASSWORD` yang terisi.

### Error: `database does not exist`

Jalankan setup database:
```bash
cd database
setup-postgresql.bat
```

### Error: `Missing script: create-superadmin`

Pastikan menjalankan dari folder `backend`:
```bash
cd backend
npm run create-superadmin
```

### Error: `ENOENT uploads folder`

Buat folder uploads manual:
```bash
mkdir backend\uploads
```

---

## 📊 Port yang Digunakan

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:3000  |
| Backend  | http://localhost:3001  |
| Database | localhost:5432         |

---

**Happy Coding! 🎉**
