-- Migration: Update permission levels from (read, write, admin) to (viewer, editor)
-- This migration updates the folder_permissions table to use the new permission levels

BEGIN;

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE folder_permissions DROP CONSTRAINT IF EXISTS folder_permissions_permission_level_check;

-- Step 2: Update existing permission levels
-- Map: read -> viewer, write -> editor, admin -> editor
UPDATE folder_permissions
SET permission_level = CASE
    WHEN permission_level = 'read' THEN 'viewer'
    WHEN permission_level = 'write' THEN 'editor'
    WHEN permission_level = 'admin' THEN 'editor'
    ELSE permission_level
END
WHERE permission_level IN ('read', 'write', 'admin');

-- Step 3: Add new CHECK constraint with updated values
ALTER TABLE folder_permissions
ADD CONSTRAINT folder_permissions_permission_level_check
CHECK (permission_level IN ('viewer', 'editor'));

COMMIT;
