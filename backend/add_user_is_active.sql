-- Migration: Add is_active column to users table
-- Purpose: Enable/disable user accounts
-- Date: 2025-12-19
-- Description: Adds a boolean column to track if user account is active.
--              Disabled users (is_active = FALSE) cannot login to the system.

BEGIN;

-- Add is_active column with default TRUE for all existing users
ALTER TABLE users
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN users.is_active IS 'Flag indicating if user account is active. FALSE means account is disabled and user cannot login.';

-- Create index for better query performance on login
CREATE INDEX idx_users_is_active ON users(is_active);

-- Verify existing users are all active
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

COMMIT;

-- Verification query (run separately after migration)
-- SELECT
--     COUNT(*) as total_users,
--     COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
--     COUNT(CASE WHEN is_active = FALSE THEN 1 END) as disabled_users
-- FROM users;
