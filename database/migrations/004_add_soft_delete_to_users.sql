-- ============================================================================
-- Migration: Add Soft Delete to Users Table
-- ============================================================================
-- Description: Adds deleted_at column to users table to enable soft delete
--              functionality. This allows users to be marked as deleted
--              without permanently removing them from the database.
-- ============================================================================
-- Date: 2025-12-10
-- Version: 004
-- ============================================================================

-- Add deleted_at column to users table
ALTER TABLE users
ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;

-- Add index for better query performance when filtering deleted/active users
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Add comment to explain the column
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user was soft deleted. NULL means user is active, NOT NULL means user is in trash';

-- ============================================================================
-- Completion Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 004 completed successfully!';
    RAISE NOTICE 'Added: deleted_at column to users table';
    RAISE NOTICE 'Added: Index on deleted_at column';
    RAISE NOTICE 'Soft delete feature is now enabled!';
    RAISE NOTICE '========================================';
END $$;
