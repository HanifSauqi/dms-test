# 🚀 Quick Reference Card

## ⚡ Quick Start (< 5 minutes)

```bash
# 1. Database
cd database && setup-docker.bat  # Windows
cd database && ./setup-docker.sh # Linux/Mac

# 2. Backend
cd backend && npm install && cp .env.example .env
# Edit .env: Set GEMINI_API_KEY
npm run dev

# 3. Frontend
cd frontend && npm install && cp .env.example .env.local
npm run dev
```

## 📊 Configuration Matrix

| Component | Host | Port | Name/URL |
|-----------|------|------|----------|
| **Database** | localhost | 5432 | `dms_db` |
| **Backend** | localhost | 3001 | http://localhost:3001/api |
| **Frontend** | localhost | 3000 | http://localhost:3000 |
| **Container** | - | - | `dms-postgres` |

## 🔑 Essential Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dms_db
PORT=3001
JWT_SECRET=your-secret-here
GEMINI_API_KEY=your-api-key-here
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🐳 Docker Commands

```bash
docker start dms-postgres           # Start database
docker stop dms-postgres            # Stop database
docker logs dms-postgres            # View logs
docker exec -it dms-postgres \      # Connect to DB
  psql -U postgres -d dms_db
```

## 📁 Project Structure

```
project/
├── backend/         → API Server (Port 3001)
├── frontend/        → Web UI (Port 3000)
└── database/        → PostgreSQL (Port 5432)
```

## 🔗 Important Links

- **API Health**: http://localhost:3001/api/health
- **Frontend**: http://localhost:3000
- **Gemini API Key**: https://makersuite.google.com/app/apikey

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port conflict | Change PORT in .env |
| DB connection fail | Check `docker ps` |
| API not found | Verify NEXT_PUBLIC_API_URL |
| Env not loading | Restart dev server |

## 📖 Full Documentation

- Setup Guide: `CONFIGURATION.md`
- Database: `database/README.md`
- Changes: `STANDARDIZATION_SUMMARY.md`

---

**Last Updated:** 2025-12-02
