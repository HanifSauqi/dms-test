-- Add user_classification_rules table for auto-classification feature

CREATE TABLE user_classification_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    target_folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_classification_user ON user_classification_rules(user_id);
CREATE INDEX idx_classification_keyword ON user_classification_rules(keyword);
CREATE INDEX idx_classification_folder ON user_classification_rules(target_folder_id);

-- Success
SELECT 'Auto-classification table created successfully!' as message;