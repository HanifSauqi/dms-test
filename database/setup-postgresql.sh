#!/bin/bash

# ============================================================================
# Document Management System - PostgreSQL Database Setup
# ============================================================================
# This script sets up the PostgreSQL database using a local PostgreSQL installation
# Database name: dms_db
# ============================================================================

set -e  # Exit on error

echo "========================================="
echo "DMS Database Setup (PostgreSQL)"
echo "========================================="

# Configuration
DB_NAME="dms_db"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

echo ""
echo "Configuration:"
echo "- Database: $DB_NAME"
echo "- User: $DB_USER"
echo "- Host: $DB_HOST"
echo "- Port: $DB_PORT"
echo ""
echo "⚠️  Make sure PostgreSQL is running and you have the credentials"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Check if database already exists
if psql -U $DB_USER -h $DB_HOST -p $DB_PORT -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "⚠️  Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d postgres -c "DROP DATABASE $DB_NAME;"
    else
        echo "Setup cancelled"
        exit 0
    fi
fi

# Create database
echo "Creating database '$DB_NAME'..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d postgres -c "CREATE DATABASE $DB_NAME;"

# Execute schema
echo "Creating database schema..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f "$(dirname "$0")/schema.sql"

echo ""
echo "========================================="
echo "✅ Setup completed successfully!"
echo "========================================="
echo ""
echo "Database Information:"
echo "- Host: $DB_HOST"
echo "- Port: $DB_PORT"
echo "- Database: $DB_NAME"
echo "- User: $DB_USER"
echo ""
echo "Connection string:"
echo "postgresql://$DB_USER:PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "To connect to the database:"
echo "psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME"
echo ""
