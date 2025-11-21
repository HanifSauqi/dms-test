# pgvector Installation Guide for Windows

## ⚠️ IMPORTANT: No Pre-built Releases Available

pgvector saat ini **tidak memiliki pre-built binaries** untuk Windows PostgreSQL 18. Anda punya beberapa opsi:

---

## ✅ Opsi 1: Build from Source (Kompleks tapi Working)

### Requirements:
- Visual Studio 2022 dengan C++ Build Tools
- PostgreSQL 18 Development Headers
- Git

### Steps:

1. **Install Visual Studio 2022**
   - Download dari: https://visualstudio.microsoft.com/downloads/
   - Pilih "Desktop development with C++"
   - Install MSVC v143 dan Windows 10/11 SDK

2. **Clone pgvector Repository**
   ```bash
   git clone https://github.com/pgvector/pgvector.git
   cd pgvector
   ```

3. **Build dengan nmake**
   ```bash
   # Buka "x64 Native Tools Command Prompt for VS 2022"
   set PGROOT=C:\Program Files\PostgreSQL\18
   nmake /F Makefile.win
   ```

4. **Install Extension**
   ```bash
   nmake /F Makefile.win install
   ```

5. **Verify**
   ```bash
   PGPASSWORD=1234 "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d document_management_system -c "CREATE EXTENSION vector;"
   ```

---

## ⭐ Opsi 2: Use Docker PostgreSQL with pgvector (RECOMMENDED untuk Development)

Ini adalah cara **paling mudah** dan paling reliable:

### 1. Install Docker Desktop
Download dari: https://www.docker.com/products/docker-desktop

### 2. Run PostgreSQL with pgvector
```bash
docker run --name postgres-vector -e POSTGRES_PASSWORD=1234 -p 5432:5432 -d pgvector/pgvector:pg18
```

### 3. Create Database
```bash
docker exec -it postgres-vector psql -U postgres -c "CREATE DATABASE document_management_system;"
```

### 4. Run Migration
```bash
docker exec -it postgres-vector psql -U postgres -d document_management_system -f /path/to/database/schema.sql
docker exec -it postgres-vector psql -U postgres -d document_management_system -f /path/to/database/migrations/add_semantic_search.sql
```

### 5. Update Backend Connection
Edit `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1234
DB_NAME=document_management_system
```

---

## 🔧 Opsi 3: Build from Source (Advanced)

1. Install Visual Studio dengan C++ tools
2. Install PostgreSQL development files
3. Clone repo: `git clone https://github.com/pgvector/pgvector.git`
4. Build: `nmake /F Makefile.win`
5. Install: `nmake /F Makefile.win install`

## Setelah Install

Jalankan migration SQL:
```bash
PGPASSWORD=1234 "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d document_management_system -f "D:\Project\Parama Data Unit\documen-management-system\database\migrations\add_semantic_search.sql"
```

## Verifikasi Instalasi

```sql
-- Di psql, jalankan:
SELECT * FROM pg_available_extensions WHERE name = 'vector';
```

Jika berhasil, Anda akan melihat extension vector tersedia.
