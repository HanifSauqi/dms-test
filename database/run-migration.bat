@echo off
REM ============================================================================
REM Run Database Migration Script (Windows)
REM ============================================================================
REM This script runs SQL migration files on the PostgreSQL Docker container
REM Usage: run-migration.bat [migration_file]
REM Example: run-migration.bat migrations\004_add_soft_delete_to_users.sql
REM ============================================================================

echo ============================================
echo Running Database Migration
echo ============================================

REM Check if migration file is provided
if "%~1"=="" (
    echo ERROR: Please provide migration file path
    echo Usage: run-migration.bat migrations\004_add_soft_delete_to_users.sql
    exit /b 1
)

REM Set variables from .env file
set DB_HOST=localhost
set DB_PORT=5433
set DB_NAME=dms_db
set DB_USER=postgres
set PGPASSWORD=1234

echo Migration file: %~1
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo User: %DB_USER%
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    echo Alternatively, if PostgreSQL is running locally, you can use:
    echo psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f %~1
    exit /b 1
)

REM Find PostgreSQL container
echo Searching for PostgreSQL container...
for /f "tokens=*" %%i in ('docker ps --filter "expose=5432" --format "{{.Names}}"') do set CONTAINER_NAME=%%i

if "%CONTAINER_NAME%"=="" (
    echo ERROR: PostgreSQL container not found!
    echo.
    echo If database is running locally without Docker, use:
    echo psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f %~1
    exit /b 1
)

echo Found container: %CONTAINER_NAME%
echo.

REM Copy migration file to container
echo Copying migration file to container...
docker cp "%~1" %CONTAINER_NAME%:/tmp/migration.sql
if errorlevel 1 (
    echo ERROR: Failed to copy migration file
    exit /b 1
)

REM Run migration
echo Running migration...
docker exec -e PGPASSWORD=%PGPASSWORD% %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -f /tmp/migration.sql
if errorlevel 1 (
    echo ERROR: Migration failed!
    exit /b 1
)

REM Cleanup
echo Cleaning up...
docker exec %CONTAINER_NAME% rm /tmp/migration.sql

echo.
echo ============================================
echo Migration completed successfully!
echo ============================================

exit /b 0
