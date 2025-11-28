-- User Activity Log Table
-- Tracks all user activities: login, logout, document operations, folder operations, etc.

CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_description TEXT,
    target_type VARCHAR(50), -- 'document', 'folder', 'user', 'system'
    target_id INTEGER, -- ID of the target resource (if applicable)
    ip_address VARCHAR(45), -- Support IPv4 and IPv6
    user_agent TEXT,
    metadata JSONB, -- Additional data like old/new values for edits
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add check constraint for valid activity types
ALTER TABLE user_activities ADD CONSTRAINT check_activity_type
    CHECK (activity_type IN (
        'login',
        'logout',
        'create_document',
        'edit_document',
        'delete_document',
        'view_document',
        'download_document',
        'share_document',
        'create_folder',
        'edit_folder',
        'delete_folder',
        'create_user',
        'edit_user',
        'delete_user'
    ));

-- Add check constraint for valid target types
ALTER TABLE user_activities ADD CONSTRAINT check_target_type
    CHECK (target_type IS NULL OR target_type IN ('document', 'folder', 'user', 'system'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_target ON user_activities(target_type, target_id);

-- Composite index for common queries (user activities filtered by date)
CREATE INDEX IF NOT EXISTS idx_user_activities_user_date ON user_activities(user_id, created_at DESC);

COMMENT ON TABLE user_activities IS 'Tracks all user activities in the system for audit and monitoring purposes';
COMMENT ON COLUMN user_activities.activity_type IS 'Type of activity performed by the user';
COMMENT ON COLUMN user_activities.activity_description IS 'Human-readable description of the activity';
COMMENT ON COLUMN user_activities.target_type IS 'Type of resource the activity was performed on';
COMMENT ON COLUMN user_activities.target_id IS 'ID of the target resource';
COMMENT ON COLUMN user_activities.metadata IS 'Additional JSON data about the activity';
