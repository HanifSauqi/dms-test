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

Pastikan sudah terinstall:
1. **Node.js 18+** - https://nodejs.org/
2. **PostgreSQL 12+** - https://www.postgresql.org/download/
3. **Git** - https://git-scm.com/

> ⚠️ **Windows Users:** Setelah install PostgreSQL, tambahkan ke PATH:
> `C:\Program Files\PostgreSQL\18\bin` (sesuaikan versi)

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/dms-test.git
cd dms-test
npm run install:all
```

### 2. Setup Database

```bash
cd database
setup-postgresql.bat   # Windows
./setup-postgresql.sh  # Linux/Mac
```

### 3. Konfigurasi Backend

Buat file `backend/.env`:

```env
# Database (WAJIB)
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/dms_db_test_3
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dms_db_test_3
DB_USER=postgres
DB_PASSWORD=PASSWORD

# JWT Secret (WAJIB)
JWT_SECRET=random_string_panjang_minimal_32_karakter

# Gemini AI (WAJIB untuk fitur AI)
GEMINI_API_KEY=your_api_key_from_makersuite

# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

> Ganti `PASSWORD` dengan password PostgreSQL Anda!

### 4. Konfigurasi Frontend

```bash
cd frontend
copy .env.example .env.local
```

### 5. Jalankan Aplikasi

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Buka Browser

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

### `psql command not found`

PostgreSQL belum di PATH. Tambahkan `C:\Program Files\PostgreSQL\18\bin` ke System PATH.

### `Missing DATABASE_URL`

Pastikan `backend/.env` sudah memiliki `DATABASE_URL` dengan format:
```
postgresql://postgres:PASSWORD@localhost:5432/DATABASE_NAME
```

### `Invalid GEMINI_API_KEY`

Dapatkan API key dari https://makersuite.google.com/app/apikey atau gunakan dummy key panjang (30+ karakter).

### `Cannot connect to database`

1. Pastikan PostgreSQL running
2. Cek username/password di `backend/.env`
3. Test: `psql -U postgres -d dms_db_test_3`

### Port sudah dipakai

**Windows:**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

## 📁 Struktur Project

```
dms-test/
├── backend/           # API Server (Express)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── middleware/
│   └── .env
│
├── frontend/          # Web UI (Next.js)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── contexts/
│   └── .env.local
│
└── database/          # Database setup
    ├── schema.sql
    └── setup-postgresql.bat
```

## 💾 Database Commands

```bash
# Connect ke database
psql -U postgres -d dms_db_test_3

# Backup database
pg_dump -U postgres dms_db_test_3 > backup.sql

# Restore database
psql -U postgres -d dms_db_test_3 < backup.sql

# Check tables
psql -U postgres -d dms_db_test_3 -c "\dt"
```

## 📝 API Endpoints

### Authentication
```
POST   /api/auth/register    # Register user
POST   /api/auth/login       # Login
GET    /api/auth/me          # Get current user
```

### Folders
```
GET    /api/folders          # Get folders
POST   /api/folders          # Create folder
PUT    /api/folders/:id      # Update folder
DELETE /api/folders/:id      # Delete folder
POST   /api/folders/:id/share    # Share folder
```

### Documents
```
GET    /api/documents            # Get documents
POST   /api/documents            # Upload document
GET    /api/documents/:id        # Get document
DELETE /api/documents/:id        # Delete document
GET    /api/documents/:id/download   # Download file
```

## 🔒 Security (Production)

1. **Generate JWT Secret baru:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. Ganti password database yang strong

3. Enable HTTPS dan update CORS_ORIGIN

4. Jangan commit file `.env`

## 📄 License

MIT License - Copyright (c) 2025

---

**Made with ❤️ using Next.js, Express, and PostgreSQL**
