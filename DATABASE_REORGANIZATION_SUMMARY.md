# Database Reorganization - Complete Summary

## ✅ Completed Tasks

Folder database telah berhasil direorganisasi untuk memudahkan setup oleh user lain.

## 📁 Struktur Folder Baru

```
database/
├── schema.sql              # Schema utama lengkap
├── setup-docker.sh         # Setup script untuk Docker (Linux/Mac)
├── setup-docker.bat        # Setup script untuk Docker (Windows)
├── setup-postgresql.sh     # Setup script untuk PostgreSQL langsung (Linux/Mac)
├── README.md               # Dokumentasi lengkap
├── PGVECTOR_INSTALLATION.md
└── archive/                # File lama (tidak perlu untuk setup baru)
    ├── schema_optimized.sql
    ├── add_classification_table.sql
    └── migrations/
        └── ... (semua migration files lama)
```

## 🎯 Perubahan Utama

### 1. **Satu Schema File Lengkap**
- File: `schema.sql`
- Berisi: Semua tabel, indexes, constraints, dan default data
- Sudah include: User roles, user activities, permission levels terbaru (viewer/editor)
- Terorganisir dengan baik dengan komentar lengkap

### 2. **Konsistensi Nama Database**
- **Nama database**: `dms_db` (untuk semua environment)
- Sebelumnya:
  - Docker: `document_management_system_optimized`
  - PostgreSQL: bervariasi
- Sekarang: **SEMUA menggunakan `dms_db`**

### 3. **Setup Scripts Otomatis**

#### Untuk Docker:
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

**Fitur:**
- Membuat container PostgreSQL dengan pgvector
- Nama container: `dms-postgres`
- Port: 5432
- Database: `dms_db`
- Auto-detect container yang sudah ada
- Konfirmasi sebelum overwrite

#### Untuk PostgreSQL Langsung:
**Linux/Mac:**
```bash
cd database
chmod +x setup-postgresql.sh
./setup-postgresql.sh
```

**Windows (Manual):**
```powershell
psql -U postgres -d postgres -c "CREATE DATABASE dms_db;"
psql -U postgres -d dms_db -f database/schema.sql
```

### 4. **Dokumentasi Lengkap**
- README.md berisi:
  - Quick setup guide
  - Troubleshooting
  - Database schema details
  - Docker commands
  - Security notes
  - Connection examples

## 📊 Database Schema Included

### Tables (9):
1. **users** - User accounts + roles (user, superadmin)
2. **folders** - Hierarchical folder structure
3. **documents** - Document metadata + content
4. **labels** - Document labels
5. **document_labels** - Junction table
6. **folder_permissions** - Sharing permissions (**viewer**, **editor**)
7. **user_classification_rules** - Auto-classification
8. **document_activities** - Document activity tracking
9. **user_activities** - User activity log

### Default Data:
- 5 labels: Project, Important, Draft, Completed, Review

### Features Included:
- ✅ User roles (user, superadmin)
- ✅ User activity tracking
- ✅ Updated permission levels (viewer, editor)
- ✅ All indexes and constraints
- ✅ pgvector extension support
- ✅ Complete foreign key relationships
- ✅ Cascade delete rules

## 🔧 Configuration untuk Backend

Update file `.env` atau konfigurasi database:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dms_db
DB_USER=postgres
DB_PASSWORD=postgres
```

Connection string:
```
postgresql://postgres:postgres@localhost:5432/dms_db
```

## 🚀 User Experience untuk Setup Baru

### Scenario 1: Clone Repository → Setup dengan Docker

```bash
# 1. Clone repository
git clone <repo-url>
cd documen-management-system

# 2. Setup database (Windows)
cd database
setup-docker.bat

# 3. Setup backend
cd ../backend
npm install
cp .env.example .env  # Edit DB credentials jika perlu
npm run dev

# 4. Setup frontend
cd ../frontend
npm install
npm run dev
```

### Scenario 2: Clone Repository → Setup dengan PostgreSQL Lokal

```bash
# 1. Clone repository
git clone <repo-url>
cd documen-management-system

# 2. Setup database (Linux/Mac)
cd database
chmod +x setup-postgresql.sh
./setup-postgresql.sh

# 3. Setup backend & frontend (sama seperti di atas)
```

## 📝 Migration dari Database Lama

Jika Anda sudah memiliki database dengan nama berbeda:

### Option 1: Export & Import
```bash
# Export data dari database lama
docker exec postgres-vector-optimized pg_dump -U postgres -d document_management_system_optimized > backup.sql

# Setup database baru
cd database
./setup-docker.sh

# Import data (skip schema creation jika perlu)
cat backup.sql | docker exec -i dms-postgres psql -U postgres -d dms_db
```

### Option 2: Rename Database
```sql
-- Stop applications first!
ALTER DATABASE document_management_system_optimized RENAME TO dms_db;
```

## 🧹 File yang Diarchive

File-file berikut dipindahkan ke `archive/` folder:
- `schema_optimized.sql` - Schema lama
- `add_classification_table.sql` - Migration manual lama
- `migrations/` - Semua migration files lama
  - 001_add_auto_classification.sql
  - 001_add_user_roles.sql
  - 002_add_user_activities.sql
  - 003_update_permission_levels.sql
  - add_activity_and_timestamps.sql
  - add_rag_metadata.sql
  - add_semantic_search.sql
  - create_hnsw_index.sql
  - optimize_*.sql
  - remove_content_summary.sql

**Catatan**: File-file ini tetap disimpan untuk referensi historis, tapi tidak diperlukan untuk setup baru.

## ✅ Verifikasi Setup

Setelah menjalankan setup, verifikasi dengan:

```bash
# Connect ke database
docker exec -it dms-postgres psql -U postgres -d dms_db

# Check tables
\dt

# Check default labels
SELECT * FROM labels;

# Check extensions
\dx
```

Expected output:
- 9 tables
- 5 default labels
- pgvector extension installed

## 🎉 Benefits untuk User Lain

1. **One-command setup** - Tinggal run satu script
2. **Konsisten** - Nama database sama di semua environment
3. **Documented** - README lengkap dengan troubleshooting
4. **Clean** - No confusion dengan migration files
5. **Flexible** - Support Docker atau PostgreSQL langsung
6. **Cross-platform** - Windows, Linux, Mac

## 📞 Support

Jika user mengalami masalah:
1. Cek `database/README.md` - Troubleshooting section
2. Pastikan Docker/PostgreSQL running
3. Cek logs: `docker logs dms-postgres`
4. Create issue di repository

---

**Reorganization Date**: 2025-12-02
**Database Version**: 1.0 (Consolidated)
