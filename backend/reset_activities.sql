-- Reset all document activities (delete old activities)
TRUNCATE TABLE document_activities CASCADE;

-- Verify
SELECT COUNT(*) as total_activities FROM document_activities;
