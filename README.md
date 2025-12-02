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

## 📋 Yang Harus Diinstall

1. **Node.js 18+** - https://nodejs.org/
2. **PostgreSQL 12+** - https://www.postgresql.org/download/
3. **Git** - https://git-scm.com/
4. **Gemini API Key** (Gratis) - https://makersuite.google.com/app/apikey

## 🚀 Cara Install & Run

### 1. Clone Repository

```bash
git clone https://github.com/your-username/documen-management-system.git
cd documen-management-system
```

### 2. Setup Database

Pastikan PostgreSQL sudah running, kemudian:

**Windows:**
```bash
cd database
setup-postgresql.bat
```

**Linux/Mac:**
```bash
cd database
chmod +x setup-postgresql.sh
./setup-postgresql.sh
```

Script akan:
- Create database `dms_db`
- Create semua table dan schema
- Insert default data (labels)

> **💡 Alternatif Docker:** Jika prefer pakai Docker, jalankan `setup-docker.bat` (Windows) atau `setup-docker.sh` (Linux/Mac)

### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

**Edit `backend/.env`:**
```env
# Database (sesuaikan dengan PostgreSQL Anda)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dms_db
DB_USER=postgres
DB_PASSWORD=your-postgres-password

DATABASE_URL=postgresql://postgres:your-postgres-password@localhost:5432/dms_db

# Gemini API Key (WAJIB)
GEMINI_API_KEY=your-api-key-here
```

### 4. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
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

Register akun baru, kemudian mulai gunakan aplikasi! 🎉

## 📊 Port yang Digunakan

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Database:** localhost:5432

## 🔑 Permission Levels

| Level | Akses |
|-------|-------|
| **Viewer** | Lihat dan download saja |
| **Editor** | Upload, edit, copy folder |
| **Owner** | Full control + delete + share |

## 🆘 Troubleshooting

### PostgreSQL tidak running

**Windows:**
```bash
# Check service
sc query postgresql-x64-16  # Sesuaikan versi

# Start service
net start postgresql-x64-16
```

**Linux/Mac:**
```bash
# Check status
sudo systemctl status postgresql

# Start service
sudo systemctl start postgresql
```

### Database "dms_db" does not exist

Jalankan ulang setup script:
```bash
cd database
setup-postgresql.bat  # Windows
./setup-postgresql.sh # Linux/Mac
```

### Cannot connect to database

1. Check PostgreSQL running
2. Verify username/password di `backend/.env`
3. Test connection:
   ```bash
   psql -U postgres -d dms_db
   ```

### Port 3001 atau 3000 sudah dipakai

**Windows:**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -i :3001
kill -9 <PID>
```

### Error "Module not found"

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### pgvector extension missing

Fitur semantic search butuh pgvector extension. Install dari:
https://github.com/pgvector/pgvector

> **Note:** Aplikasi tetap bisa jalan tanpa pgvector, hanya fitur semantic search yang tidak aktif.

## 📁 Struktur Project

```
documen-management-system/
├── backend/           # API Server (Express)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── middleware/
│   ├── uploads/       # File storage
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
    ├── setup-postgresql.bat
    └── setup-postgresql.sh
```

## 💾 Database Commands

```bash
# Connect ke database
psql -U postgres -d dms_db

# Backup database
pg_dump -U postgres dms_db > backup.sql

# Restore database
psql -U postgres -d dms_db < backup.sql

# Check tables
psql -U postgres -d dms_db -c "\dt"

# View users
psql -U postgres -d dms_db -c "SELECT * FROM users;"
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
POST   /api/folders/:id/copy     # Copy folder
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

Sebelum deploy ke production:

1. **Generate JWT Secret baru:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Masukkan hasil ke `JWT_SECRET` di `.env`

2. **Ganti password database** yang strong

3. **Enable HTTPS** dan update CORS_ORIGIN

4. **Jangan commit** file `.env` atau `.env.local`

5. **Restrict database access** - buat user database khusus (jangan pakai postgres)

## 🐳 Setup dengan Docker (Opsional)

Jika prefer pakai Docker:

**Windows:**
```bash
cd database
setup-docker.bat
```

**Linux/Mac:**
```bash
cd database
chmod +x setup-docker.sh
./setup-docker.sh
```

Docker akan create container PostgreSQL dengan pgvector.

**Docker Commands:**
```bash
# Start
docker start dms-postgres

# Stop
docker stop dms-postgres

# Logs
docker logs dms-postgres

# Connect
docker exec -it dms-postgres psql -U postgres -d dms_db
```

## 💡 Tips

### Development
- Backend auto-reload dengan nodemon
- Frontend auto-reload dengan Next.js Fast Refresh
- Use browser DevTools (F12) untuk debugging

### Database
- Regular backup: `pg_dump -U postgres dms_db > backup_$(date +%Y%m%d).sql`
- Monitor query: Check PostgreSQL logs
- Index optimization sudah include di schema

### Performance
- Upload files max 50MB (configurable di `.env`)
- Database pool connection otomatis
- AI processing async (tidak block UI)

## 🤝 Contributing

1. Fork repository
2. Create branch: `git checkout -b feature/new-feature`
3. Commit: `git commit -m 'Add new feature'`
4. Push: `git push origin feature/new-feature`
5. Create Pull Request

## 📄 License

MIT License - Copyright (c) 2025

## 📞 Support

- Check [Troubleshooting](#-troubleshooting) section
- Create issue di GitHub
- Email: support@example.com

---

**Last Updated:** 2025-12-02 | **Version:** 1.0.0

**Made with ❤️ using Next.js, Express, and PostgreSQL**
