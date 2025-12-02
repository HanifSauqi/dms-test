-- Create HNSW Index for Vector Similarity Search
-- Run this AFTER you have documents with embeddings in the database

-- Check if we have documents with vectors
DO $$
DECLARE
    vector_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO vector_count
    FROM documents
    WHERE content_vector IS NOT NULL;

    RAISE NOTICE 'Found % documents with vectors', vector_count;

    IF vector_count = 0 THEN
        RAISE WARNING 'No documents with vectors found. Upload some documents first!';
    END IF;
END $$;

-- Create HNSW index for fast approximate nearest neighbor search
-- HNSW (Hierarchical Navigable Small World) is faster than IVFFlat for most use cases
-- m = 16: Number of connections per layer (higher = better recall, more memory)
-- ef_construction = 64: Size of dynamic candidate list (higher = better quality, slower build)
CREATE INDEX IF NOT EXISTS idx_documents_content_vector_hnsw
ON documents
USING hnsw (content_vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Alternative: IVFFlat index (uncomment if you prefer this)
-- IVFFlat divides vectors into lists and searches only relevant lists
-- lists = 100: Number of clusters (rule of thumb: rows/1000 for < 1M rows)
-- CREATE INDEX IF NOT EXISTS idx_documents_content_vector_ivfflat
-- ON documents
-- USING ivfflat (content_vector vector_cosine_ops)
-- WITH (lists = 100);

-- Verify index creation
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'documents'
  AND indexname LIKE '%vector%';

-- Performance tip: For HNSW, you can adjust ef_search at query time:
-- SET hnsw.ef_search = 40;  -- Default is 40, increase for better recall, decrease for speed
