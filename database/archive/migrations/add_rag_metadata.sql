-- Migration: Add RAG (Retrieval-Augmented Generation) metadata support
-- This adds a JSON column to store structured metadata extracted by Gemini AI

-- Add structured_metadata column to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS structured_metadata JSONB DEFAULT NULL;

-- Create index on structured_metadata for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_documents_structured_metadata
ON documents USING GIN (structured_metadata);

-- Create index on document_type within structured_metadata
CREATE INDEX IF NOT EXISTS idx_documents_metadata_type
ON documents ((structured_metadata->>'document_type'));

-- Add comment
COMMENT ON COLUMN documents.structured_metadata IS 'AI-extracted structured metadata (document type, fields, entities, tags)';

-- Example structured_metadata format:
-- {
--   "document_type": "cv",
--   "confidence": 0.95,
--   "extracted_fields": {
--     "name": "John Doe",
--     "years_experience": 7,
--     "skills": ["JavaScript", "Python", "React"],
--     "position": "Senior Developer",
--     "contact": "john@example.com"
--   },
--   "summary": "Senior developer with 7 years experience",
--   "key_entities": ["John Doe", "JavaScript", "Python"],
--   "suggested_tags": ["developer", "senior", "full-stack"]
-- }

SELECT 'Migration completed: structured_metadata column added' AS status;
