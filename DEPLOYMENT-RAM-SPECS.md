# 📊 Spesifikasi RAM untuk Deployment - DMS Project

**Tanggal Pengukuran:** 22 Januari 2026  
**Environment:** Production Ready

---

## 📈 Hasil Pengukuran RAM

### Backend (Node.js + Express)

#### 1. **Idle State (Server Running)**
```
RSS (Total RAM):        45-48 MB
Heap Used:              4-5 MB
External Memory:        2 MB
```

#### 2. **Under Load (50 Concurrent Requests)**
```
RSS (Total RAM):        51 MB
Peak Memory:            ~51 MB
Memory Growth:          +6 MB under load
```

#### 3. **Estimasi dengan File Processing & AI**
```
Light Usage:            ~51 MB
With File Processing:   ~150-250 MB
With AI (Gemini API):   +50-100 MB
Peak Production:        ~300-350 MB
```

---

## 🖥️ **REKOMENDASI SERVER DEPLOYMENT**

### **Minimum Requirements (Small Scale)**
```yaml
Backend Server:
  - RAM: 1 GB
  - CPU: 1 vCPU
  - Storage: 20 GB SSD

Frontend Server (Next.js):
  - RAM: 512 MB - 1 GB
  - CPU: 1 vCPU
  - Storage: 10 GB SSD

Database (PostgreSQL):
  - RAM: 512 MB - 1 GB
  - CPU: 1 vCPU
  - Storage: 20 GB SSD

Total RAM: 2-3 GB
```

### **Recommended (Production Scale)**
```yaml
Backend Server:
  - RAM: 2 GB
  - CPU: 2 vCPU
  - Storage: 40 GB SSD

Frontend Server (Next.js):
  - RAM: 1 GB
  - CPU: 1 vCPU
  - Storage: 20 GB SSD

Database (PostgreSQL):
  - RAM: 2 GB
  - CPU: 2 vCPU
  - Storage: 50 GB SSD

Total RAM: 5 GB
```

### **Optimal (High Traffic)**
```yaml
Backend Server:
  - RAM: 4 GB
  - CPU: 4 vCPU
  - Storage: 100 GB SSD

Frontend Server (Next.js):
  - RAM: 2 GB
  - CPU: 2 vCPU
  - Storage: 40 GB SSD

Database (PostgreSQL):
  - RAM: 4 GB
  - CPU: 4 vCPU
  - Storage: 100 GB SSD

Total RAM: 10 GB
```

---

## 🎯 **REKOMENDASI BERDASARKAN JUMLAH USER**

| Concurrent Users | Backend RAM | Frontend RAM | Database RAM | Total RAM |
|-----------------|-------------|--------------|--------------|-----------|
| 1-10 users      | 1 GB        | 512 MB       | 512 MB       | **2 GB**  |
| 10-50 users     | 2 GB        | 1 GB         | 1 GB         | **4 GB**  |
| 50-100 users    | 4 GB        | 2 GB         | 2 GB         | **8 GB**  |
| 100-500 users   | 8 GB        | 4 GB         | 4 GB         | **16 GB** |

---

## 📦 **Platform Deployment Recommendations**

### **Option 1: Single VPS (Cost Effective)**
**Provider:** DigitalOcean, Vultr, Linode, Contabo  
**Specs:**
- **RAM:** 4 GB
- **CPU:** 2 vCPU
- **Storage:** 80 GB SSD
- **Price:** ~$12-24/month

**Setup:** All services (Backend, Frontend, Database) pada 1 server

---

### **Option 2: Separate Servers (Recommended)**
**Backend + Frontend VPS:**
- RAM: 2-4 GB
- Price: ~$12-18/month

**Database (Managed):**
- PostgreSQL Managed Database
- RAM: 1-2 GB
- Price: ~$15-25/month

**Total:** ~$27-43/month

---

### **Option 3: Cloud Platform (Scalable)**

#### **Vercel (Frontend Only)**
- Frontend: Free tier atau $20/month
- Backend: Deploy di VPS terpisah
- Database: Managed PostgreSQL

#### **Railway / Render**
- Backend: $7-20/month
- Frontend: $7-20/month
- Database: $7-15/month
- **Total:** ~$21-55/month

#### **AWS / Google Cloud / Azure**
- Backend EC2/Compute: $15-30/month
- Frontend S3+CloudFront: $5-10/month
- Database RDS: $15-30/month
- **Total:** ~$35-70/month

---

## 🚀 **Kesimpulan & Jawaban untuk Deployment**

### **Untuk Presentasi/Proposal:**

> **"Aplikasi DMS ini membutuhkan minimal 2-4 GB RAM untuk deployment production dengan estimasi sebagai berikut:**
> 
> - **Backend Server:** 1-2 GB RAM
> - **Frontend Server:** 512 MB - 1 GB RAM  
> - **Database Server:** 512 MB - 1 GB RAM
> - **Total:** 2-4 GB RAM
>
> **Dengan spesifikasi ini, aplikasi dapat melayani 10-50 concurrent users dengan performa optimal. Untuk skalabilitas lebih tinggi, kami rekomendasikan 8-16 GB RAM total."**

### **Quick Answer (Singkat):**
```
Minimum: 2 GB RAM total
Recommended: 4 GB RAM total
Optimal: 8+ GB RAM total
```

---

## 📝 **Notes Penting**

### **RAM Usage Breakdown:**
1. **Base Application:** ~50 MB (idle)
2. **File Processing (PDF/DOCX):** +100-150 MB per process
3. **AI Classification (Gemini):** +50-100 MB per request
4. **Database Connections:** +50-100 MB
5. **Express Framework:** +30-50 MB
6. **Next.js SSR:** +200-500 MB

### **Faktor yang Mempengaruhi RAM:**
- ✅ Jumlah concurrent users
- ✅ Ukuran file yang di-upload
- ✅ Frekuensi AI classification
- ✅ Jumlah search queries
- ✅ Database query complexity
- ✅ File caching strategy

### **Monitoring Tools:**
```bash
# Check memory usage
node scripts/check-memory.js

# Load test
node scripts/load-test-memory.js
```

---

## 💡 **Tips Optimasi RAM**

1. **Enable Compression:** Gunakan gzip/brotli
2. **Caching:** Implement Redis (tambah 256 MB RAM)
3. **File Processing:** Process async, jangan blocking
4. **Database Pooling:** Limit connection pool
5. **PM2 Cluster Mode:** Distribute load across CPU cores

---

**Dokumentasi dibuat:** 22 Januari 2026  
**Project:** Document Management System  
**Tech Stack:** Node.js + Express + Next.js + PostgreSQL + Gemini AI
