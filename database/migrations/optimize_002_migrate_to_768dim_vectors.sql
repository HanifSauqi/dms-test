-- Migration: Change Vector Dimension from 1024 to 768
-- Purpose: Reduce vector storage by 24% (Gemini Embedding uses 768-dim)
-- Date: 2025-01-28
-- Risk: MEDIUM (requires re-generating all embeddings)

-- IMPORTANT: Run this AFTER updating embeddingService.js to use Gemini API!

-- Step 1: Drop HNSW index (will be recreated later)
DROP INDEX IF EXISTS idx_documents_content_vector_hnsw;

-- Step 2: Null out existing vectors (will be regenerated)
UPDATE documents SET content_vector = NULL;

-- Step 3: Change vector column type from 1024 to 768 dimensions
ALTER TABLE documents ALTER COLUMN content_vector TYPE vector(768);

-- Verify change
SELECT
    column_name,
    udt_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'documents'
AND column_name = 'content_vector';

-- Expected output:
-- column_name    | udt_name | data_type
-- content_vector | vector   | USER-DEFINED (should be vector(768) now)

-- Note: Embeddings will be regenerated automatically on next document upload
-- Or run the re-embedding script: node scripts/regenerate-embeddings.js

COMMIT;

-- After all embeddings are regenerated, recreate HNSW index:
-- CREATE INDEX idx_documents_content_vector_hnsw ON documents
-- USING hnsw (content_vector vector_cosine_ops)
-- WITH (m = 16, ef_construction = 64);
