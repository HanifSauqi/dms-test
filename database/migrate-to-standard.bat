@echo off
REM ============================================================================
REM Database Migration Script - Migrate to Standardized Configuration
REM ============================================================================
REM This script migrates your existing database to the new standard:
REM   - Old: document_management_system_optimized (port 54322, container: postgres-vector-optimized)
REM   - New: dms_db (port 5432, container: dms-postgres)
REM ============================================================================

setlocal enabledelayedexpansion

echo =========================================
echo Database Migration to Standard Config
echo =========================================
echo.
echo This will:
echo 1. Backup your current database
echo 2. Create new standardized database
echo 3. Migrate all data
echo.

set OLD_CONTAINER=postgres-vector-optimized
set OLD_DB=document_management_system_optimized
set OLD_PORT=54322

set NEW_CONTAINER=dms-postgres
set NEW_DB=dms_db
set NEW_PORT=5432

REM Check if old container exists
docker ps -a --format "{{.Names}}" | findstr /x "%OLD_CONTAINER%" >nul 2>&1
if errorlevel 1 (
    echo ❌ Old container '%OLD_CONTAINER%' not found
    echo Nothing to migrate. You can run setup-docker.bat to create new database.
    pause
    exit /b 0
)

echo Old container found: %OLD_CONTAINER%
echo.

REM Create backup
echo Step 1: Creating backup...
set BACKUP_FILE=backup_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%.sql
docker exec %OLD_CONTAINER% pg_dump -U postgres -d %OLD_DB% > "%BACKUP_FILE%"
if errorlevel 1 (
    echo ❌ Backup failed!
    pause
    exit /b 1
)
echo ✅ Backup created: %BACKUP_FILE%
echo.

REM Setup new database
echo Step 2: Setting up new standardized database...
call "%~dp0setup-docker.bat"
if errorlevel 1 (
    echo ❌ New database setup failed!
    pause
    exit /b 1
)
echo ✅ New database created
echo.

REM Import data
echo Step 3: Importing data to new database...
type "%BACKUP_FILE%" | docker exec -i %NEW_CONTAINER% psql -U postgres -d %NEW_DB%
if errorlevel 1 (
    echo ❌ Data import failed!
    echo Backup file is safe at: %BACKUP_FILE%
    pause
    exit /b 1
)
echo ✅ Data imported successfully
echo.

echo =========================================
echo ✅ Migration Completed!
echo =========================================
echo.
echo New Configuration:
echo - Container: %NEW_CONTAINER%
echo - Database: %NEW_DB%
echo - Port: %NEW_PORT%
echo.
echo Backup saved at: %BACKUP_FILE%
echo.
echo Old container '%OLD_CONTAINER%' is still running.
echo You can:
echo   1. Keep it as backup: docker stop %OLD_CONTAINER%
echo   2. Remove it: docker stop %OLD_CONTAINER% ^&^& docker rm %OLD_CONTAINER%
echo.
echo Your .env files have already been updated to use the new database.
echo Restart your backend server to apply changes.
echo.
pause
