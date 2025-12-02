@echo off
REM ============================================================================
REM Document Management System - Docker Database Setup (Windows)
REM ============================================================================
REM This script sets up the PostgreSQL database using Docker on Windows
REM Database name: dms_db
REM ============================================================================

setlocal enabledelayedexpansion

echo =========================================
echo DMS Database Setup (Docker - Windows)
echo =========================================

REM Configuration
set DB_NAME=dms_db
set DB_USER=postgres
set DB_PASSWORD=postgres
set DB_PORT=5432
set CONTAINER_NAME=dms-postgres
set PGVECTOR_IMAGE=pgvector/pgvector:pg18

echo.
echo Configuration:
echo - Database: %DB_NAME%
echo - User: %DB_USER%
echo - Port: %DB_PORT%
echo - Container: %CONTAINER_NAME%
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

REM Check if port is available
echo Checking if port %DB_PORT% is available...
netstat -ano | findstr ":%DB_PORT% " >nul 2>&1
if not errorlevel 1 (
    echo.
    echo ⚠️  WARNING: Port %DB_PORT% is already in use!
    echo.
    echo You have two options:
    echo   1. Stop the service using port %DB_PORT% and run this script again
    echo   2. Use a different port (e.g., 5433)
    echo.
    echo To use a different port, you can:
    echo   - Edit DB_PORT in this script (line 19)
    echo   - Update your backend/.env to match the port
    echo.
    set /p REPLY="Continue anyway? (y/N): "
    if /i not "!REPLY!"=="y" (
        echo Setup cancelled
        pause
        exit /b 0
    )
)

REM Check if container already exists
docker ps -a --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Container '%CONTAINER_NAME%' already exists
    set /p REPLY="Do you want to remove it and create a new one? (y/N): "
    if /i "!REPLY!"=="y" (
        echo Stopping and removing existing container...
        docker stop %CONTAINER_NAME% >nul 2>&1
        docker rm %CONTAINER_NAME% >nul 2>&1
    ) else (
        echo Setup cancelled
        pause
        exit /b 0
    )
)

REM Create and start PostgreSQL container
echo Creating PostgreSQL container with pgvector...
docker run -d --name %CONTAINER_NAME% -e POSTGRES_USER=%DB_USER% -e POSTGRES_PASSWORD=%DB_PASSWORD% -e POSTGRES_DB=%DB_NAME% -p %DB_PORT%:5432 %PGVECTOR_IMAGE%

echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

REM Wait for PostgreSQL to be ready
set MAX_RETRIES=30
set RETRY_COUNT=0

:wait_loop
docker exec %CONTAINER_NAME% pg_isready -U %DB_USER% >nul 2>&1
if not errorlevel 1 goto ready

set /a RETRY_COUNT+=1
if %RETRY_COUNT% geq %MAX_RETRIES% (
    echo ❌ Error: PostgreSQL did not start in time
    pause
    exit /b 1
)

echo Waiting for PostgreSQL... (%RETRY_COUNT%/%MAX_RETRIES%)
timeout /t 2 /nobreak >nul
goto wait_loop

:ready
echo ✅ PostgreSQL is ready!

REM Copy schema file to container
echo Copying schema file to container...
docker cp "%~dp0schema.sql" %CONTAINER_NAME%:/tmp/schema.sql

REM Execute schema
echo Creating database schema...
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -f /tmp/schema.sql

REM Clean up temp file
docker exec %CONTAINER_NAME% rm /tmp/schema.sql

echo.
echo =========================================
echo ✅ Setup completed successfully!
echo =========================================
echo.
echo Database Information:
echo - Host: localhost
echo - Port: %DB_PORT%
echo - Database: %DB_NAME%
echo - User: %DB_USER%
echo - Password: %DB_PASSWORD%
echo.
echo Connection string:
echo postgresql://%DB_USER%:%DB_PASSWORD%@localhost:%DB_PORT%/%DB_NAME%
echo.
echo To connect to the database:
echo docker exec -it %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME%
echo.
echo To stop the container:
echo docker stop %CONTAINER_NAME%
echo.
echo To start the container:
echo docker start %CONTAINER_NAME%
echo.
pause
