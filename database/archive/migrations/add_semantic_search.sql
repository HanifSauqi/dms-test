-- Migration: Add Semantic Search Support with pgvector
-- Run this migration to enable vector-based semantic search

-- Step 1: Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add vector column to documents table (384 dimensions for all-MiniLM-L6-v2 model)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_vector vector(384);

-- Step 3: Create HNSW index for fast similarity search
-- This index will be created after you have some documents with vectors
-- Uncomment and run this after populating vectors:
-- CREATE INDEX IF NOT EXISTS idx_documents_content_vector ON documents USING hnsw (content_vector vector_cosine_ops);

-- Note: For IVFFlat index (alternative to HNSW), use:
-- CREATE INDEX IF NOT EXISTS idx_documents_content_vector ON documents USING ivfflat (content_vector vector_cosine_ops) WITH (lists = 100);

-- Step 4: Add helpful function to calculate cosine distance
CREATE OR REPLACE FUNCTION cosine_distance(a vector, b vector)
RETURNS float AS $$
  SELECT 1 - (a <=> b);
$$ LANGUAGE SQL IMMUTABLE STRICT;
