# 📁 Document Management System

Sistem manajemen dokumen modern dengan fitur AI, folder hierarkis, dan kontrol akses granular.

## 🎯 Fitur Utama

- 📂 Organisasi folder hierarkis
- 🔐 Sharing folder dengan permission (Viewer, Editor, Owner)
- 🤖 Auto-classification dokumen dengan AI
- 🔍 Pencarian cerdas
- 👥 User management (User, Superadmin)
- 📊 Activity tracking
- 🏷️ Label dan kategorisasi

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TailwindCSS 4
- **Backend:** Express 5, Node.js 18+
- **Database:** PostgreSQL 12+
- **AI:** Gemini AI

## 📋 Prerequisites

1. **Node.js 18+** - https://nodejs.org/
2. **PostgreSQL 12+** - https://www.postgresql.org/download/
3. **Git** - https://git-scm.com/

> ⚠️ **Windows Users:** Setelah install PostgreSQL, tambahkan ke PATH:
> `C:\Program Files\PostgreSQL\18\bin` (sesuaikan versi)

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-username/dms-test.git
cd dms-test
```

### 2. Jalankan Setup Script

```bash
setup-fresh-install.bat
```

Script ini akan otomatis:
- ✅ Membersihkan cache & old dependencies
- ✅ Install semua dependencies
- ✅ Membuat file environment template

### 3. Edit `backend/.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dms_db
DB_USER=postgres
DB_PASSWORD=password_anda

JWT_SECRET=random_string_panjang_minimal_32_karakter
GEMINI_API_KEY=

PORT=3001
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### 4. Setup Database

```bash
cd database
setup-postgresql.bat
```

### 5. Buat Akun Superadmin

```bash
cd backend
npm run create-superadmin
```

Default: `admin@dms.com` / `admin123`

### 6. Jalankan Aplikasi

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

### 7. Buka Browser

```
http://localhost:3000
```

---

## 📊 Port yang Digunakan

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:3000  |
| Backend  | http://localhost:3001  |
| Database | localhost:5432         |

## 🔑 Permission Levels

| Level      | Akses                          |
|------------|--------------------------------|
| **Viewer** | Lihat dan download saja        |
| **Editor** | Upload, edit, copy folder      |
| **Owner**  | Full control + delete + share  |

## 🆘 Troubleshooting

Lihat [SETUP.md](SETUP.md) untuk panduan lengkap dan troubleshooting.

## 📁 Struktur Project

```
dms-test/
├── backend/           # API Server (Express)
├── frontend/          # Web UI (Next.js)
└── database/          # Database setup scripts
```

## 📄 License

MIT License - Copyright (c) 2025

---

**Made with ❤️ using Next.js, Express, and PostgreSQL**
