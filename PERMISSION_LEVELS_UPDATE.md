# Permission Levels Update - Migration Guide

## Overview
Sistem access level telah diubah dari 3 opsi menjadi 2 opsi yang lebih sederhana:

### Sebelumnya (3 Opsi):
- **Read** (View only) - Hanya bisa melihat
- **Write** (Can edit) - Bisa mengedit
- **Admin** (Full access) - Akses penuh

### Sekarang (2 Opsi):
- **Viewer** - Hanya bisa melihat dan mendownload dokumen
- **Editor** - Bisa mengedit isi folder, menambahkan dokumen, dan menyalin folder shared

## Perubahan Detail

### 1. Viewer Permission
- Dapat melihat isi folder
- Dapat mendownload dokumen
- **TIDAK** dapat menambahkan/mengedit/menghapus dokumen
- **TIDAK** dapat menyalin folder

### 2. Editor Permission
- Semua hak yang dimiliki Viewer
- Dapat menambahkan dokumen baru ke folder
- Dapat mengedit dokumen dalam folder
- **Dapat menyalin folder shared menjadi miliknya sendiri** (fitur baru!)
- **TIDAK** dapat menghapus folder

### 3. Owner (Pembuat Folder)
- Semua hak yang dimiliki Editor
- **Hanya owner yang dapat menghapus folder**
- Dapat mengelola sharing permissions
- Dapat mengubah permission level user lain

## Migrasi Data

### Database Migration
Jalankan migration script untuk mengupdate database:

```sql
-- File: database/migrations/003_update_permission_levels.sql

-- Script ini akan:
-- 1. Menghapus constraint lama
-- 2. Mengupdate existing data:
--    - read -> viewer
--    - write -> editor
--    - admin -> editor
-- 3. Menambah constraint baru untuk 2 level (viewer, editor)
```

### Cara Menjalankan Migration

**Menggunakan psql:**
```bash
psql -U your_username -d your_database -f database/migrations/003_update_permission_levels.sql
```

**Atau menggunakan Docker (jika menggunakan docker-compose):**
```bash
docker-compose exec postgres psql -U postgres -d dms_db -f /migrations/003_update_permission_levels.sql
```

## File yang Diubah

### Backend:
1. **backend/src/services/PermissionService.js**
   - Update PERMISSION_LEVELS constant
   - Update hasWritePermission() untuk hanya include 'owner' dan 'editor'
   - Update hasAdminPermission() untuk hanya include 'owner'

2. **backend/src/services/FolderService.js**
   - Tambah method `copyFolder()` untuk menyalin folder
   - Tambah method `copyDocumentsRecursively()` untuk menyalin dokumen
   - Tambah method `copySubfoldersRecursively()` untuk menyalin subfolder
   - Verifikasi `deleteFolder()` hanya bisa diakses owner

3. **backend/src/controllers/folderController.js**
   - Tambah controller `copyFolder()`

4. **backend/src/routes/folders.js**
   - Tambah route `POST /:id/copy` untuk copy folder

### Frontend:
1. **frontend/src/components/FolderSharingModal.js**
   - Update permission options: viewer, editor (hapus admin)
   - Update permissionLabels dan permissionColors
   - Update default permission ke 'viewer'

2. **frontend/src/app/dashboard/shared/page.js**
   - Update getPermissionBadge() untuk 2 level
   - Update stats calculation untuk viewer/editor
   - Update info banner dengan deskripsi permission baru
   - Tambah handleCopyFolder() function
   - Tambah copy button untuk folder dengan editor permission
   - Update getDropdownOptions() dengan opsi "Copy to My Folders"

### Database Schema:
1. **database/schema.sql**
   - Update CHECK constraint: ('viewer', 'editor')

2. **database/schema_optimized.sql**
   - Update CHECK constraint: ('viewer', 'editor')

3. **database/migrations/003_update_permission_levels.sql** (NEW)
   - Migration script untuk update existing data

## Fitur Baru: Copy Folder

### Cara Menggunakan:
1. Buka halaman "Shared with Me"
2. Cari folder yang di-share dengan permission level "Editor"
3. Klik icon copy (DocumentDuplicateIcon) di sebelah permission badge
4. Folder beserta semua isi (dokumen dan subfolder) akan disalin ke folder Anda
5. Anda akan diredirect ke halaman "My Files" untuk melihat folder yang baru disalin

### Detail Implementasi Copy Folder:
- Hanya user dengan permission 'editor' yang bisa menyalin folder
- Owner tidak bisa menyalin folder miliknya sendiri (karena sudah punya akses penuh)
- Saat copy:
  - Folder baru dibuat dengan nama "{original name} - Copy"
  - Jika nama sudah ada, akan ditambah counter: "- Copy (2)", "- Copy (3)", dst
  - Semua dokumen di-copy (termasuk file fisik dan metadata)
  - Semua subfolder dan isinya di-copy secara rekursif
  - Labels dokumen juga di-copy
  - User yang menyalin menjadi owner dari folder baru

## Testing Checklist

### Backend Testing:
- [ ] Test permission validation (viewer vs editor)
- [ ] Test copy folder untuk user dengan editor permission
- [ ] Test bahwa viewer tidak bisa copy folder
- [ ] Test bahwa owner tidak bisa copy folder miliknya sendiri
- [ ] Test copy folder dengan nested subfolders dan documents
- [ ] Test folder deletion hanya bisa oleh owner

### Frontend Testing:
- [ ] Verify sharing modal hanya menampilkan 2 opsi (viewer, editor)
- [ ] Verify shared page menampilkan permission badge yang benar
- [ ] Verify copy button hanya muncul untuk folder dengan editor permission
- [ ] Test copy folder functionality
- [ ] Verify stats menghitung viewer/editor dengan benar

### Database Testing:
- [ ] Run migration script
- [ ] Verify existing permissions ter-update dengan benar
- [ ] Verify constraint hanya allow viewer dan editor
- [ ] Test insert permission dengan nilai lama (harus fail)

## Rollback Plan

Jika perlu rollback ke sistem lama (3 permission levels), jalankan:

```sql
BEGIN;

-- Drop constraint baru
ALTER TABLE folder_permissions DROP CONSTRAINT IF EXISTS folder_permissions_permission_level_check;

-- Revert data (opsional, tergantung business logic)
-- Catatan: Tidak bisa otomatis karena mapping many-to-one (admin dan write -> editor)

-- Add constraint lama
ALTER TABLE folder_permissions
ADD CONSTRAINT folder_permissions_permission_level_check
CHECK (permission_level IN ('read', 'write', 'admin'));

COMMIT;
```

**PENTING:** Rollback code juga perlu dilakukan di backend dan frontend.

## Questions & Support

Jika ada pertanyaan atau issues:
1. Check error logs di backend console
2. Check browser console untuk frontend errors
3. Verify database migration berhasil dijalankan
4. Contact development team

---

**Update Date:** 2025-12-02
**Updated By:** Claude Code Assistant
