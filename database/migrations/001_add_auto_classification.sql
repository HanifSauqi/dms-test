-- Migration: Add Auto-Classification Feature
-- Date: 2025-01-26
-- Description: Add support for auto-document classification based on content keywords

-- Update documents table to support auto-classification
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS auto_classified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS classification_keyword VARCHAR(255);

-- Create user_classification_rules table
CREATE TABLE IF NOT EXISTS user_classification_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    target_folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_classification_user ON user_classification_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_classification_keyword ON user_classification_rules(keyword);
CREATE INDEX IF NOT EXISTS idx_classification_folder ON user_classification_rules(target_folder_id);

-- Create index for auto-classified documents
CREATE INDEX IF NOT EXISTS idx_documents_auto_classified ON documents(auto_classified);

-- Add comment for documentation
COMMENT ON TABLE user_classification_rules IS 'Store user-defined rules for automatic document classification based on content keywords';
COMMENT ON COLUMN user_classification_rules.keyword IS 'Keyword to search for in document content (case-insensitive)';
COMMENT ON COLUMN user_classification_rules.target_folder_id IS 'Folder ID where documents matching the keyword should be auto-moved';
COMMENT ON COLUMN user_classification_rules.priority IS 'Rule priority (higher number = higher priority)';

-- Success message
\echo 'Auto-classification migration completed successfully!'