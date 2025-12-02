# 🎨 Frontend - Document Management System

Web interface aplikasi DMS menggunakan Next.js dengan App Router.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Styling:** TailwindCSS 4
- **Icons:** Heroicons
- **HTTP Client:** Axios
- **State Management:** React Context API

## 📁 Struktur Folder

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.js            # Login page
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── files/         # File management
│   │   │   ├── shared/        # Shared folders
│   │   │   └── users/         # User management
│   │   └── layout.js          # Root layout
│   │
│   ├── components/            # React components
│   │   ├── FileViewerModal.js
│   │   ├── FolderSharingModal.js
│   │   └── Navbar.js
│   │
│   ├── contexts/              # React contexts
│   │   └── AuthContext.js     # Authentication
│   │
│   └── lib/                   # Utilities
│       ├── api/               # API functions
│       └── axios.js           # Axios config
│
├── public/                    # Static assets
├── .env.local                 # Environment variables
└── package.json
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Run development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 🔧 Environment Variables

`.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Document Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 📝 Available Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # Run ESLint
```

## 🎯 Features

- ✅ Authentication (Login/Register)
- ✅ Folder management (Create, Edit, Delete)
- ✅ Document upload & management
- ✅ Folder sharing dengan permissions
- ✅ User activity tracking
- ✅ Responsive design
- ✅ Dark mode support

## 🔗 API Integration

Frontend berkomunikasi dengan backend melalui REST API:
- Base URL: `http://localhost:3001/api`
- Authentication: JWT Token (stored in localStorage)
- Auto-refresh token handling

## 📱 Responsive Design

- Desktop: Full features
- Tablet: Optimized layout
- Mobile: Touch-friendly interface
