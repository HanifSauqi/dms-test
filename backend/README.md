# ⚙️ Backend - Document Management System

REST API server untuk aplikasi DMS menggunakan Express.js.

## 🛠️ Tech Stack

- **Framework:** Express 5
- **Runtime:** Node.js 18+
- **Database:** PostgreSQL 12+ dengan pgvector
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Password Hashing:** Bcrypt
- **AI/ML:** Google Gemini AI

## 📁 Struktur Folder

```
backend/
├── src/
│   ├── controllers/           # Route controllers
│   │   ├── authController.js
│   │   ├── folderController.js
│   │   ├── documentController.js
│   │   └── userActivityController.js
│   │
│   ├── services/              # Business logic
│   │   ├── FolderService.js
│   │   ├── DocumentService.js
│   │   ├── PermissionService.js
│   │   └── UserActivityService.js
│   │
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # JWT authentication
│   │   └── upload.js         # File upload handler
│   │
│   ├── routes/                # API routes
│   │   ├── auth.js
│   │   ├── folders.js
│   │   ├── documents.js
│   │   └── userActivities.js
│   │
│   ├── utils/                 # Utilities
│   │   └── db.js             # Database connection
│   │
│   └── app.js                 # Express app setup
│
├── uploads/                   # File storage
├── .env                       # Environment variables
├── .env.example              # Environment template
├── package.json
└── server.js                  # Entry point
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dan isi GEMINI_API_KEY

# Run development server
npm run dev
```

Server akan berjalan di `http://localhost:3001`

## 🔧 Environment Variables

`.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dms_db
DB_USER=postgres
DB_PASSWORD=your-password
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/dms_db

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Gemini AI
GEMINI_API_KEY=your-api-key

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📝 Available Scripts

```bash
npm run dev      # Development server (nodemon)
npm start        # Production server
npm test         # Run tests
```

## 📡 API Endpoints

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
GET    /api/folders/:id      # Get folder
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
PUT    /api/documents/:id        # Update document
DELETE /api/documents/:id        # Delete document
GET    /api/documents/:id/download   # Download file
```

### Labels
```
GET    /api/labels          # Get labels
POST   /api/labels          # Create label
PUT    /api/labels/:id      # Update label
DELETE /api/labels/:id      # Delete label
```

### User Activities
```
GET    /api/user-activities              # Get all activities
GET    /api/user-activities/user/:id    # Get user activities
```

## 🔐 Authentication

API menggunakan JWT untuk authentication:
- Token dikirim via header: `Authorization: Bearer <token>`
- Token expires sesuai `JWT_EXPIRES_IN` (default: 7 hari)
- Refresh token otomatis handled oleh frontend

## 🎯 Features

- ✅ User authentication & authorization
- ✅ Role-based access control (User, Superadmin)
- ✅ Folder-level permissions (Viewer, Editor, Owner)
- ✅ File upload & management
- ✅ AI-powered document processing (Gemini)
- ✅ Semantic search dengan pgvector
- ✅ Activity logging & audit trail
- ✅ Auto-classification dokumen

## 💾 Database

Menggunakan PostgreSQL dengan extension:
- **pgvector** - Untuk vector similarity search

Connection pool otomatis dikelola oleh `pg` library.

## 🔒 Security

- Password hashing dengan bcrypt
- JWT-based authentication
- CORS protection
- SQL injection prevention (parameterized queries)
- File upload validation
- Rate limiting (optional)
