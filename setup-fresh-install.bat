@echo off
REM ============================================================================
REM Fresh Install Setup Script for Document Management System
REM ============================================================================
REM This script automates the complete setup process after git clone
REM ============================================================================

echo ============================================
echo DMS - Fresh Install Setup
echo ============================================
echo.
echo This script will:
echo [1] Clean any existing build artifacts
echo [2] Install all dependencies
echo [3] Setup environment files
echo [4] Guide database setup
echo.
pause

REM ----------------------------------------------------------------------------
REM Step 1: Clean existing artifacts (just in case)
REM ----------------------------------------------------------------------------
echo.
echo [Step 1/5] Cleaning build artifacts...
if exist "frontend\.next" rd /s /q "frontend\.next"
if exist "frontend\node_modules" rd /s /q "frontend\node_modules"
if exist "backend\node_modules" rd /s /q "backend\node_modules"
if exist "node_modules" rd /s /q "node_modules"
if exist "frontend\package-lock.json" del /f "frontend\package-lock.json"
if exist "backend\package-lock.json" del /f "backend\package-lock.json"
if exist "package-lock.json" del /f "package-lock.json"
echo Done!

REM ----------------------------------------------------------------------------
REM Step 2: Install Dependencies
REM ----------------------------------------------------------------------------
echo.
echo [Step 2/5] Installing dependencies (this may take a few minutes)...
echo.
echo Installing root dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo All dependencies installed successfully!

REM ----------------------------------------------------------------------------
REM Step 3: Setup Environment Files
REM ----------------------------------------------------------------------------
echo.
echo [Step 3/5] Setting up environment files...

REM Backend .env
if not exist "backend\.env" (
    echo Creating backend\.env from template...
    copy "backend\.env.example" "backend\.env" >nul
    echo DONE: backend\.env created
    echo.
    echo IMPORTANT: Please edit backend\.env and set:
    echo   - DB_PASSWORD: Your PostgreSQL password
    echo   - GEMINI_API_KEY: Your Gemini API key
    echo   Get Gemini API key: https://makersuite.google.com/app/apikey
    echo.
) else (
    echo backend\.env already exists (skipping)
)

REM Frontend .env.local
if not exist "frontend\.env.local" (
    echo Creating frontend\.env.local...
    echo # Frontend Environment Variables > "frontend\.env.local"
    echo NEXT_PUBLIC_API_URL=http://localhost:3001/api >> "frontend\.env.local"
    echo DONE: frontend\.env.local created
) else (
    echo frontend\.env.local already exists (skipping)
)

REM ----------------------------------------------------------------------------
REM Step 4: Database Setup Instructions
REM ----------------------------------------------------------------------------
echo.
echo [Step 4/5] Database Setup
echo.
echo Before running the application, you need to setup the database:
echo.
echo 1. Make sure PostgreSQL is installed and running
echo 2. Edit backend\.env with your PostgreSQL password
echo 3. Run database setup:
echo    cd database
echo    setup-postgresql.bat
echo.
echo Or if using Docker:
echo    cd database
echo    setup-docker.bat
echo.

REM ----------------------------------------------------------------------------
REM Step 5: Create Superadmin Instructions
REM ----------------------------------------------------------------------------
echo [Step 5/5] After database setup, create superadmin account:
echo.
echo    cd backend
echo    npm run create-superadmin
echo.
echo Default credentials will be:
echo    Email: admin@dms.com
echo    Password: admin123
echo.

REM ----------------------------------------------------------------------------
REM Final Instructions
REM ----------------------------------------------------------------------------
echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Next Steps:
echo.
echo 1. Edit backend\.env:
echo    - Set DB_PASSWORD (your PostgreSQL password)
echo    - Set GEMINI_API_KEY (get from https://makersuite.google.com/app/apikey)
echo.
echo 2. Setup database:
echo    cd database
echo    setup-postgresql.bat
echo.
echo 3. Create superadmin:
echo    cd backend
echo    npm run create-superadmin
echo.
echo 4. Run the application:
echo    Terminal 1: cd backend ^&^& npm run dev
echo    Terminal 2: cd frontend ^&^& npm run dev
echo.
echo 5. Open browser: http://localhost:3000
echo.
echo ============================================
echo.
pause
