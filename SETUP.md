# 🚀 Setup Guide - Document Management System

Panduan lengkap untuk setup project DMS setelah clone dari GitHub.

## 📋 Prerequisites

Pastikan sudah terinstall:
- **Node.js** v18.18.0+ atau v20.9.0+ atau v21.1.0+ ([Download](https://nodejs.org/))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

## 🔧 Step-by-Step Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/dms-pdu.git
cd dms-pdu
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env file dan isi:
# - DB_PASSWORD: password PostgreSQL Anda
# - GEMINI_API_KEY: API key dari https://makersuite.google.com/app/apikey
# - JWT_SECRET: random string panjang untuk keamanan
```

### 3. Setup Database

#### Opsi A: PostgreSQL Lokal

```bash
# Pastikan PostgreSQL sudah running
# Jalankan setup script
cd ../database
./setup-postgresql.bat   # Windows
# atau
./setup-postgresql.sh    # Linux/Mac
```

#### Opsi B: Docker

```bash
cd ../database
./setup-docker.bat   # Windows
# atau
./setup-docker.sh    # Linux/Mac
```

### 4. Buat Akun Superadmin (PENTING!) 🔐

Setelah database setup, buat akun superadmin pertama:

```bash
cd ../backend
npm run create-superadmin
```

**Default credentials:**
- Email: `admin@dms.com`
- Password: `admin123`

⚠️ **WAJIB ganti password setelah login pertama!**

#### Cara Ganti Password Default:

**Opsi 1: Gunakan custom credentials saat buat superadmin:**
```bash
node scripts/create-superadmin.js "Your Name" "your@email.com" "your_password"
```

**Opsi 2: Ganti password via SQL:**
```sql
-- Generate hash password baru (gunakan bcrypt online atau Node.js)
-- Contoh untuk password "NewPass123":
UPDATE users
SET password = '$2a$10$newHashedPasswordHere'
WHERE email = 'admin@dms.com';
```

### 5. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# File .env.local sudah terisi default values, tidak perlu edit
```

### 6. Jalankan Aplikasi

Buka 2 terminal:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend akan running di: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend akan running di: http://localhost:3000

### 7. Login

Buka browser: http://localhost:3000/auth/login

Login dengan credentials superadmin yang sudah dibuat.

---

## 🐛 Troubleshooting

### Error: `psql command not found`

**Problem:** PostgreSQL belum di PATH

**Solution:**
1. Cari folder PostgreSQL (biasanya `C:\Program Files\PostgreSQL\15\bin`)
2. Tambahkan ke System PATH
3. Restart terminal

### Error: `database "dms_db" is being accessed by other users`

**Problem:** Backend masih running dan connect ke database

**Solution:**
```bash
# Stop backend dulu (Ctrl+C)
# Baru jalankan setup database
cd database
./setup-postgresql.bat
```

### Error: `npm install` - Dependency Conflict

**Problem:** Versi Node.js terlalu lama

**Solution:**
```bash
# Update Node.js ke versi terbaru (21.1.0+)
# Atau install dengan flag:
npm install --legacy-peer-deps
```

### Error: Login Gagal - "Invalid credentials"

**Problem:** Superadmin belum dibuat atau password salah

**Solution:**
```bash
cd backend

# Cek apakah superadmin sudah ada
psql -U postgres -d dms_db -c "SELECT * FROM users WHERE role='superadmin';"

# Jika belum ada, buat:
npm run create-superadmin
```

---

## 📚 Additional Resources

- **Backend API Docs**: `backend/README.md`
- **Frontend Docs**: `frontend/README.md`
- **Database Schema**: `database/schema.sql`
- **Environment Config**: `.env.example` files

---

## 🔒 Security Notes

1. **Ganti Default Password:** Jangan pakai password default di production!
2. **JWT Secret:** Generate random string panjang untuk JWT_SECRET
3. **CORS Origin:** Sesuaikan CORS_ORIGIN di .env dengan domain production
4. **Gemini API Key:** Jangan commit API key ke Git

---

## 🤝 Need Help?

1. Check documentation di folder `docs/`
2. Open issue di GitHub
3. Contact team

---

**Happy Coding! 🎉**
