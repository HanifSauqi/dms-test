-- Migration to add activity tracking and updated_at timestamps

-- Add updated_at column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create activity log table
CREATE TABLE IF NOT EXISTS document_activities (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('created', 'viewed', 'edited', 'downloaded', 'shared')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_activities_document ON document_activities(document_id);
CREATE INDEX IF NOT EXISTS idx_document_activities_user ON document_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_document_activities_created ON document_activities(created_at DESC);

-- Backfill updated_at with created_at for existing records
UPDATE documents SET updated_at = created_at WHERE updated_at IS NULL;
