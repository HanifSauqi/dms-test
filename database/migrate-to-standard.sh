#!/bin/bash

# ============================================================================
# Database Migration Script - Migrate to Standardized Configuration
# ============================================================================
# This script migrates your existing database to the new standard:
#   - Old: document_management_system_optimized (port 54322, container: postgres-vector-optimized)
#   - New: dms_db (port 5432, container: dms-postgres)
# ============================================================================

set -e

echo "========================================="
echo "Database Migration to Standard Config"
echo "========================================="
echo ""
echo "This will:"
echo "1. Backup your current database"
echo "2. Create new standardized database"
echo "3. Migrate all data"
echo ""

OLD_CONTAINER="postgres-vector-optimized"
OLD_DB="document_management_system_optimized"
OLD_PORT="54322"

NEW_CONTAINER="dms-postgres"
NEW_DB="dms_db"
NEW_PORT="5432"

# Check if old container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${OLD_CONTAINER}$"; then
    echo "❌ Old container '$OLD_CONTAINER' not found"
    echo "Nothing to migrate. You can run setup-docker.sh to create new database."
    exit 0
fi

echo "Old container found: $OLD_CONTAINER"
echo ""

# Create backup
echo "Step 1: Creating backup..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec $OLD_CONTAINER pg_dump -U postgres -d $OLD_DB > "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Setup new database
echo "Step 2: Setting up new standardized database..."
bash "$(dirname "$0")/setup-docker.sh"
echo "✅ New database created"
echo ""

# Import data
echo "Step 3: Importing data to new database..."
cat "$BACKUP_FILE" | docker exec -i $NEW_CONTAINER psql -U postgres -d $NEW_DB
echo "✅ Data imported successfully"
echo ""

echo "========================================="
echo "✅ Migration Completed!"
echo "========================================="
echo ""
echo "New Configuration:"
echo "- Container: $NEW_CONTAINER"
echo "- Database: $NEW_DB"
echo "- Port: $NEW_PORT"
echo ""
echo "Backup saved at: $BACKUP_FILE"
echo ""
echo "Old container '$OLD_CONTAINER' is still running."
echo "You can:"
echo "  1. Keep it as backup: docker stop $OLD_CONTAINER"
echo "  2. Remove it: docker stop $OLD_CONTAINER && docker rm $OLD_CONTAINER"
echo ""
echo "Your .env files have already been updated to use the new database."
echo "Restart your backend server to apply changes."
echo ""
