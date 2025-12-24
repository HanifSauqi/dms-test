-- ============================================================================
-- Migration: Add user_id to labels table (Per-User Labels)
-- ============================================================================
-- Description: Changes labels from global/shared to per-user system.
--              Each user will have their own set of labels.
-- Date: 2025-12-19
-- Version: 005
-- ============================================================================

BEGIN;

-- Step 1: Delete existing global labels (they have no user_id)
DELETE FROM document_labels WHERE label_id IN (SELECT id FROM labels);
DELETE FROM labels;

-- Step 2: Add user_id column to labels table
ALTER TABLE labels ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Make user_id NOT NULL after column is added
ALTER TABLE labels ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Drop old unique constraint on name only
ALTER TABLE labels DROP CONSTRAINT IF EXISTS labels_name_key;

-- Step 5: Add new unique constraint on (name, user_id) - same label name allowed for different users
ALTER TABLE labels ADD CONSTRAINT labels_name_user_unique UNIQUE (name, user_id);

-- Step 6: Create index for better query performance on user_id
CREATE INDEX idx_labels_user_id ON labels(user_id);

COMMIT;

-- ============================================================================
-- Completion Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 005 completed successfully!';
    RAISE NOTICE 'Labels are now per-user (not global)';
    RAISE NOTICE '- Added: user_id column to labels table';
    RAISE NOTICE '- Added: Unique constraint on (name, user_id)';
    RAISE NOTICE '- Added: Index on user_id column';
    RAISE NOTICE '- Deleted: All existing global labels';
    RAISE NOTICE '========================================';
END $$;
