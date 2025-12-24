#!/bin/bash

# ============================================================================
# Document Management System - Docker Database Setup
# ============================================================================
# This script sets up the PostgreSQL database using Docker
# Database name: dms_db
# ============================================================================

set -e  # Exit on error

echo "========================================="
echo "DMS Database Setup (Docker)"
echo "========================================="

# Configuration
DB_NAME="dms_db"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_PORT="5432"
CONTAINER_NAME="dms-postgres"
POSTGRES_IMAGE="postgres:16"

echo ""
echo "Configuration:"
echo "- Database: $DB_NAME"
echo "- User: $DB_USER"
echo "- Port: $DB_PORT"
echo "- Container: $CONTAINER_NAME"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if port is available
echo "Checking if port $DB_PORT is available..."
if lsof -Pi :$DB_PORT -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -an | grep -q ":$DB_PORT.*LISTEN" 2>/dev/null; then
    echo ""
    echo "⚠️  WARNING: Port $DB_PORT is already in use!"
    echo ""
    echo "You have two options:"
    echo "  1. Stop the service using port $DB_PORT and run this script again"
    echo "  2. Use a different port (e.g., 5433)"
    echo ""
    echo "To use a different port, you can:"
    echo "  - Edit DB_PORT in this script (line 20)"
    echo "  - Update your backend/.env to match the port"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled"
        exit 0
    fi
fi

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "⚠️  Container '$CONTAINER_NAME' already exists"
    read -p "Do you want to remove it and create a new one? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping and removing existing container..."
        docker stop $CONTAINER_NAME 2>/dev/null || true
        docker rm $CONTAINER_NAME 2>/dev/null || true
    else
        echo "Setup cancelled"
        exit 0
    fi
fi

# Create and start PostgreSQL container
echo "Creating PostgreSQL container..."
docker run -d \
    --name $CONTAINER_NAME \
    -e POSTGRES_USER=$DB_USER \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -e POSTGRES_DB=$DB_NAME \
    -p $DB_PORT:5432 \
    $POSTGRES_IMAGE

echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Wait for PostgreSQL to be ready
MAX_RETRIES=30
RETRY_COUNT=0
until docker exec $CONTAINER_NAME pg_isready -U $DB_USER > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Error: PostgreSQL did not start in time"
        exit 1
    fi
    echo "Waiting for PostgreSQL... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Copy schema file to container
echo "Copying schema file to container..."
docker cp "$(dirname "$0")/schema.sql" $CONTAINER_NAME:/tmp/schema.sql

# Execute schema
echo "Creating database schema..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -f /tmp/schema.sql

# Clean up temp file
docker exec $CONTAINER_NAME rm /tmp/schema.sql

echo ""
echo "========================================="
echo "✅ Setup completed successfully!"
echo "========================================="
echo ""
echo "Database Information:"
echo "- Host: localhost"
echo "- Port: $DB_PORT"
echo "- Database: $DB_NAME"
echo "- User: $DB_USER"
echo "- Password: $DB_PASSWORD"
echo ""
echo "Connection string:"
echo "postgresql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME"
echo ""
echo "To connect to the database:"
echo "docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"
echo ""
echo "To stop the container:"
echo "docker stop $CONTAINER_NAME"
echo ""
echo "To start the container:"
echo "docker start $CONTAINER_NAME"
echo ""
