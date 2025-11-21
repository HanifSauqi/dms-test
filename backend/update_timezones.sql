-- Update all existing timestamps by adding 7 hours (WIB offset)
-- This is a ONE-TIME migration to fix UTC timestamps to Asia/Jakarta

BEGIN;

-- Update document_activities timestamps
UPDATE document_activities 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < NOW() - INTERVAL '6 hours';

-- Update documents timestamps
UPDATE documents 
SET created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE created_at < NOW() - INTERVAL '6 hours';

-- Update folders timestamps
UPDATE folders 
SET created_at = created_at + INTERVAL '7 hours',
    updated_at = updated_at + INTERVAL '7 hours'
WHERE created_at < NOW() - INTERVAL '6 hours';

-- Update labels timestamps if they have timestamps
UPDATE labels 
SET created_at = created_at + INTERVAL '7 hours'
WHERE created_at < NOW() - INTERVAL '6 hours'
  AND created_at IS NOT NULL;

COMMIT;

-- Verify the update
SELECT 'document_activities' as table_name, COUNT(*) as records, MAX(created_at) as latest_timestamp
FROM document_activities
UNION ALL
SELECT 'documents', COUNT(*), MAX(created_at)
FROM documents
UNION ALL
SELECT 'folders', COUNT(*), MAX(created_at)
FROM folders;
