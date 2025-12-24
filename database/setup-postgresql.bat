@echo off
REM ============================================================================
REM Document Management System - PostgreSQL Database Setup (Windows)
REM ============================================================================
REM This script sets up the database using local PostgreSQL installation
REM Database name: dms_db
REM ============================================================================

setlocal enabledelayedexpansion

echo =========================================
echo DMS Database Setup (PostgreSQL)
echo =========================================

REM Configuration
set DB_NAME=dms_db
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

echo.
echo Configuration:
echo - Database: %DB_NAME%
echo - User: %DB_USER%
echo - Host: %DB_HOST%
echo - Port: %DB_PORT%
echo.
echo Make sure PostgreSQL is running and you have the credentials
echo.

REM Check if psql is available
where psql >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: psql command not found
    echo PostgreSQL must be installed and added to PATH
    echo.
    echo Download PostgreSQL from: https://www.postgresql.org/download/windows/
    echo After install, add PostgreSQL bin folder to PATH
    pause
    exit /b 1
)

REM Check if database already exists
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d postgres -lqt | findstr /C:"%DB_NAME%" >nul 2>&1
if not errorlevel 1 (
    echo.
    echo ⚠️  Database '%DB_NAME%' already exists
    set /p REPLY="Do you want to drop and recreate it? (y/N): "
    if /i "!REPLY!"=="y" (
        echo Dropping existing database...
        psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d postgres -c "DROP DATABASE %DB_NAME%;"
    ) else (
        echo Setup cancelled
        pause
        exit /b 0
    )
)

REM Create database
echo Creating database '%DB_NAME%'...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d postgres -c "CREATE DATABASE %DB_NAME%;"
if errorlevel 1 (
    echo ❌ Error: Failed to create database
    echo Make sure PostgreSQL is running and credentials are correct
    pause
    exit /b 1
)

REM Execute schema
echo Creating database schema...
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f "%~dp0schema.sql"
if errorlevel 1 (
    echo ❌ Error: Failed to create schema
    pause
    exit /b 1
)

echo.
echo =========================================
echo ✅ Setup completed successfully!
echo =========================================
echo.
echo Database Information:
echo - Host: %DB_HOST%
echo - Port: %DB_PORT%
echo - Database: %DB_NAME%
echo - User: %DB_USER%
echo.
echo Connection string:
echo postgresql://%DB_USER%:PASSWORD@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo.
echo To connect to the database:
echo psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME%
echo.
pause
