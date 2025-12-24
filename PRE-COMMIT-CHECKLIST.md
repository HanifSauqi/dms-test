# ✅ Pre-Commit Checklist

**Checklist ini memastikan teman/tim tidak mengalami masalah saat clone project.**

---

## 📋 Files yang HARUS di-commit:

### ✅ Configuration Files (Updated)
- [x] `frontend/next.config.mjs` - **PENTING!** Sudah pakai dynamic path (bukan hardcoded)
- [x] `frontend/package.json` - Updated dengan Next.js 16.1.1+
- [x] `backend/package.json`
- [x] `package.json` (root)

### ✅ Environment Templates
- [x] `backend/.env.example` - Template untuk .env
- [x] `.gitignore` - Proper exclusions

### ✅ Setup Scripts (NEW!)
- [x] `setup-fresh-install.bat` - Automated setup script
- [x] `database/setup-postgresql.bat` - Database setup
- [x] `database/setup-postgresql.sh` - Linux/Mac version
- [x] `database/schema.sql` - Database schema

### ✅ Documentation (Updated)
- [x] `README.md` - Project overview
- [x] `SETUP.md` - Setup instructions dengan automated option
- [x] `TROUBLESHOOTING.md` - **NEW!** Solusi untuk masalah umum
- [x] `PRE-COMMIT-CHECKLIST.md` - This file

---

## ⛔ Files yang TIDAK BOLEH di-commit:

### ❌ Environment & Secrets
- [ ] `backend/.env` - Contains passwords & API keys
- [ ] `frontend/.env.local` - Environment variables
- [ ] Any `.env*` files

### ❌ Dependencies
- [ ] `node_modules/` (root)
- [ ] `backend/node_modules/`
- [ ] `frontend/node_modules/`
- [ ] `package-lock.json` (all locations)

### ❌ Build Artifacts
- [ ] `frontend/.next/` - **CRITICAL!** Ini penyebab Turbopack error!
- [ ] `frontend/out/`
- [ ] `backend/dist/`
- [ ] `backend/build/`

### ❌ Database & Uploads
- [ ] `backend/uploads/*` (user uploaded files)
- [ ] `database/*.sql` (except schema.sql)
- [ ] `*.db`, `*.sqlite`

### ❌ Logs & Temp
- [ ] `*.log`
- [ ] `backend/logs/*`
- [ ] `.DS_Store`, `Thumbs.db`

---

## 🔍 Verification Commands

Sebelum commit, jalankan ini untuk memastikan:

```bash
# 1. Check apa yang akan di-commit
git status

# 2. Pastikan .env tidak masuk
git status | findstr .env
# Output harus kosong!

# 3. Pastikan node_modules tidak masuk
git status | findstr node_modules
# Output harus kosong!

# 4. Pastikan .next tidak masuk
git status | findstr .next
# Output harus kosong!

# 5. Check .gitignore
type .gitignore | findstr "node_modules"
type .gitignore | findstr ".next"
type .gitignore | findstr ".env"
# Semua harus ada!
```

---

## 🚀 Test Sebelum Push

**WAJIB test setup dari fresh clone:**

```bash
# 1. Clone ke folder baru (simulasi teman yang clone)
cd ..
git clone <your-repo-url> dms-test
cd dms-test

# 2. Run automated setup
setup-fresh-install.bat

# 3. Verify Turbopack works
cd frontend
npm run dev
# Harus muncul: ✓ Ready in < 1s

# 4. Jika berhasil, push ke repo
```

---

## 📝 Commit Message Template

```
fix: Resolve Turbopack error & improve setup process

Changes:
- Update frontend/next.config.mjs to use dynamic path resolution
- Upgrade Next.js 15.5.2 → 16.1.1 (fix CVE-2025-66478)
- Add automated setup script (setup-fresh-install.bat)
- Add comprehensive troubleshooting guide
- Clean build artifacts from git tracking

This prevents "Next.js package not found" error when cloning
on different machines or paths with spaces.

Tested on fresh clone - works perfectly! ✅
```

---

## ⚠️ Critical Reminders

1. **NEVER commit .env files!**
   - Contains passwords and API keys
   - Each developer should have their own

2. **NEVER commit node_modules!**
   - Huge file size (100MB+)
   - Should be installed via npm install

3. **NEVER commit .next folder!**
   - **INI PENYEBAB TURBOPACK ERROR!**
   - Build cache specific to machine

4. **ALWAYS test from fresh clone!**
   - Simulate new developer experience
   - Catch missing files early

---

## ✅ Final Check

Before pushing to GitHub:

- [ ] next.config.mjs uses dynamic path (NOT hardcoded "D:\\Project\\...")
- [ ] Next.js version >= 16.1.0 (check frontend/package.json)
- [ ] setup-fresh-install.bat included
- [ ] TROUBLESHOOTING.md included
- [ ] .gitignore has: node_modules, .next, .env
- [ ] No .env files in git
- [ ] No node_modules in git
- [ ] No .next folder in git
- [ ] Tested from fresh clone
- [ ] Turbopack works (✓ Ready in < 1s)

---

## 🎯 Expected Setup Time for Others

Dengan files yang proper:

| Step | Time |
|------|------|
| Git clone | ~1 min |
| Run setup-fresh-install.bat | ~3-5 min |
| Edit .env (DB password & API key) | ~2 min |
| Setup database | ~1 min |
| Create superadmin | ~30 sec |
| **Total** | **~8-10 minutes** |

**No errors, no troubleshooting needed!** ✅

---

Ready to commit? Double check this list first! 🚀
