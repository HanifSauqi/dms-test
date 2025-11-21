-- Migration: Remove content_summary column (redundant)
-- Date: 2025-11-05
-- Reason: No need for separate summary - just use SUBSTRING on extracted_content in frontend

-- Drop content_summary column (redundant with extracted_content)
ALTER TABLE documents
DROP COLUMN IF EXISTS content_summary;

-- Add comment
COMMENT ON COLUMN documents.extracted_content IS 'Full extracted text content. Use SUBSTRING in queries for preview.';
