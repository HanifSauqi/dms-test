# Document Management System - Database Setup

Complete database setup guide for the Document Management System.

## 📋 Overview

- **Database Name**: `dms_db`
- **PostgreSQL Version**: 12+ (recommended 18+)
- **Required Extensions**: pgvector (for semantic search features)
- **Tables**: 9 tables with complete indexing and constraints

## 🚀 Quick Setup

### Option 1: Using Docker (Recommended)

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

### Option 2: Using Local PostgreSQL

**Prerequisites:**
- PostgreSQL installed and running
- pgvector extension installed

**Linux/Mac:**
```bash
cd database
chmod +x setup-postgresql.sh
./setup-postgresql.sh
```

**Windows (PowerShell):**
```powershell
cd database
psql -U postgres -d postgres -c "CREATE DATABASE dms_db;"
psql -U postgres -d dms_db -f schema.sql
```

## 📊 Database Schema

### Tables

1. **users** - User accounts with role-based access
2. **folders** - Hierarchical folder structure
3. **documents** - Document metadata and content
4. **labels** - Document categorization labels
5. **document_labels** - Documents-Labels relationship
6. **folder_permissions** - Folder sharing permissions
7. **user_classification_rules** - Auto-classification rules
8. **document_activities** - Document activity tracking
9. **user_activities** - Comprehensive user activity log

### Permission Levels

Folder permissions support two access levels:
- **viewer**: Read-only access, can view and download
- **editor**: Can edit content, add documents, and copy folders

### Default Data

The schema includes 5 default labels:
- Project (Blue)
- Important (Red)
- Draft (Orange)
- Completed (Green)
- Review (Purple)

## 🔧 Manual Setup

If you prefer to set up manually:

### 1. Create Database

```sql
CREATE DATABASE dms_db;
```

### 2. Connect to Database

```bash
psql -U postgres -d dms_db
```

### 3. Execute Schema

```sql
\i schema.sql
```

## 🐳 Docker Configuration

### Connection Details

After running the Docker setup:

```
Host: localhost
Port: 5432
Database: dms_db
User: postgres
Password: postgres
```

### Useful Docker Commands

```bash
# Start container
docker start dms-postgres

# Stop container
docker stop dms-postgres

# Connect to database
docker exec -it dms-postgres psql -U postgres -d dms_db

# View logs
docker logs dms-postgres

# Remove container
docker stop dms-postgres && docker rm dms-postgres
```

## 🔌 Application Configuration

Update your application's database connection:

**Backend (.env or config):**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dms_db
DB_USER=postgres
DB_PASSWORD=postgres
```

**Connection String:**
```
postgresql://postgres:postgres@localhost:5432/dms_db
```

## 📝 Schema Details

### Users Table
- Support for regular users and superadmins
- Email-based authentication
- Role-based access control

### Folders & Documents
- Hierarchical folder organization
- Document metadata storage
- Auto-classification support
- Full-text content extraction

### Permissions
- Granular folder-level permissions
- Viewer and Editor roles
- Owner-based access control

### Activity Tracking
- Document-level activity logs
- System-wide user activity tracking
- Audit trail for compliance

## 🔄 Migrations

All migrations have been consolidated into the main `schema.sql` file.
The schema includes:
- ✅ User roles (user, superadmin)
- ✅ User activity tracking
- ✅ Permission levels (viewer, editor)
- ✅ All indexes and constraints

## 🧪 Testing the Setup

After setup, verify the installation:

```sql
-- Check all tables
\dt

-- Verify default labels
SELECT * FROM labels;

-- Check extensions
\dx
```

Expected output: 9 tables and pgvector extension installed.

## 🆘 Troubleshooting

### pgvector Extension Not Found

**Error:** `extension "vector" is not available`

**Solution:**
- For Docker: Use `pgvector/pgvector:pg18` image (already included in setup script)
- For Local PostgreSQL: Install pgvector from https://github.com/pgvector/pgvector

### Connection Refused

**Error:** `could not connect to server`

**Solution:**
- Ensure PostgreSQL/Docker is running
- Check port 5432 is not in use
- Verify firewall settings

### Port Already in Use

**Error:** `Port 5432 is already in use` or setup script warns about port conflict

**Solution:**

**Option 1 - Use Different Port (Recommended):**
```bash
# Edit setup-docker.bat (Windows) or setup-docker.sh (Linux/Mac)
# Change line: set DB_PORT=5432
# To:          set DB_PORT=5433

# Then update backend/.env to match:
DB_PORT=5433
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/dms_db
```

**Option 2 - Stop Conflicting Service:**
```bash
# Windows - Find and stop the service
netstat -ano | findstr :5432
taskkill /PID <PID> /F

# Linux/Mac - Find and stop the service
lsof -i :5432
sudo kill -9 <PID>
```

**Common Cause:** Local PostgreSQL installation already using port 5432

### Permission Denied

**Error:** `permission denied to create database`

**Solution:**
- Use postgres superuser or user with createdb privilege
- `ALTER USER your_user CREATEDB;`

## 📚 Additional Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- pgvector Extension: https://github.com/pgvector/pgvector
- Docker PostgreSQL: https://hub.docker.com/_/postgres

## 🔐 Security Notes

**For Production:**
1. Change default postgres password
2. Use environment variables for credentials
3. Enable SSL/TLS connections
4. Implement regular backups
5. Use restricted database users for application

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs
3. Verify PostgreSQL logs: `docker logs dms-postgres`
4. Create an issue in the project repository

---

**Last Updated**: 2025-12-02
