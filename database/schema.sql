-- ============================================================================
-- Document Management System - Complete Database Schema
-- ============================================================================
-- Database name: dms_db
-- Description: Complete schema for document management system with folder
--              organization, user permissions, activity tracking, and
--              auto-classification features
-- ============================================================================

-- Enable pgvector extension for future semantic search capabilities
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users Table
-- Stores user accounts with role-based access control
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (role IN ('user', 'superadmin'))
);

-- Folders Table
-- Hierarchical folder structure for document organization
CREATE TABLE folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table
-- Stores document metadata and extracted content
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    extracted_content TEXT,
    folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auto_classified BOOLEAN DEFAULT FALSE,
    classification_keyword VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Labels Table
-- Stores document labels/tags for categorization
CREATE TABLE labels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    color VARCHAR(50) DEFAULT '#3B82F6'
);

-- Document Labels Junction Table
-- Many-to-many relationship between documents and labels
CREATE TABLE document_labels (
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, label_id)
);

-- Folder Permissions Table
-- Controls user access levels to shared folders
CREATE TABLE folder_permissions (
    folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (folder_id, user_id),
    CONSTRAINT folder_permissions_permission_level_check
        CHECK (permission_level IN ('viewer', 'editor'))
);

-- User Classification Rules Table
-- Auto-classification rules for organizing uploaded documents
CREATE TABLE user_classification_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    target_folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Activities Table
-- Tracks document-specific activities (view, edit, download, etc.)
CREATE TABLE document_activities (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT document_activities_activity_type_check
        CHECK (activity_type IN ('created', 'viewed', 'edited', 'downloaded', 'shared'))
);

-- User Activities Table
-- Comprehensive activity log for audit and monitoring
CREATE TABLE user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_description TEXT,
    target_type VARCHAR(50),
    target_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_activity_type CHECK (activity_type IN (
        'login', 'logout',
        'create_document', 'edit_document', 'delete_document',
        'view_document', 'download_document', 'share_document',
        'create_folder', 'edit_folder', 'delete_folder',
        'create_user', 'edit_user', 'delete_user'
    )),
    CONSTRAINT check_target_type CHECK (
        target_type IS NULL OR
        target_type IN ('document', 'folder', 'user', 'system')
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_role ON users(role);

-- Folders indexes
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_owner_id ON folders(owner_id);

-- Documents indexes
CREATE INDEX idx_documents_folder_id ON documents(folder_id);
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_documents_title ON documents(title);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);

-- Document Labels indexes
CREATE INDEX idx_document_labels_label_id ON document_labels(label_id);

-- Folder Permissions indexes
CREATE INDEX idx_folder_permissions_user_id ON folder_permissions(user_id);

-- User Classification Rules indexes
CREATE INDEX idx_classification_user ON user_classification_rules(user_id);
CREATE INDEX idx_classification_keyword ON user_classification_rules(keyword);
CREATE INDEX idx_classification_folder ON user_classification_rules(target_folder_id);

-- Document Activities indexes
CREATE INDEX idx_document_activities_document ON document_activities(document_id);
CREATE INDEX idx_document_activities_user ON document_activities(user_id);
CREATE INDEX idx_document_activities_created_at ON document_activities(created_at DESC);
CREATE INDEX idx_document_activities_doc_time ON document_activities(document_id, created_at DESC);

-- User Activities indexes
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_target ON user_activities(target_type, target_id);
CREATE INDEX idx_user_activities_user_date ON user_activities(user_id, created_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON TABLE folders IS 'Hierarchical folder structure for organizing documents';
COMMENT ON TABLE documents IS 'Document metadata and extracted content';
COMMENT ON TABLE labels IS 'Labels/tags for categorizing documents';
COMMENT ON TABLE folder_permissions IS 'User access permissions for shared folders';
COMMENT ON TABLE user_classification_rules IS 'Auto-classification rules for uploaded documents';
COMMENT ON TABLE document_activities IS 'Document-specific activity tracking';
COMMENT ON TABLE user_activities IS 'Comprehensive user activity log for audit and monitoring';

COMMENT ON COLUMN users.role IS 'User role: user (default) or superadmin (can manage users)';
COMMENT ON COLUMN documents.extracted_content IS 'Full extracted text content from the document';
COMMENT ON COLUMN folder_permissions.permission_level IS 'Access level: viewer (read-only) or editor (can modify)';
COMMENT ON COLUMN user_activities.activity_type IS 'Type of activity performed by the user';
COMMENT ON COLUMN user_activities.activity_description IS 'Human-readable description of the activity';
COMMENT ON COLUMN user_activities.target_type IS 'Type of resource the activity was performed on';
COMMENT ON COLUMN user_activities.target_id IS 'ID of the target resource';
COMMENT ON COLUMN user_activities.metadata IS 'Additional JSON data about the activity';

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default labels for document categorization
INSERT INTO labels (name, color) VALUES
    ('Project', '#3B82F6'),
    ('Important', '#EF4444'),
    ('Draft', '#F59E0B'),
    ('Completed', '#10B981'),
    ('Review', '#8B5CF6');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Database: dms_db';
    RAISE NOTICE 'Tables: % created', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE '========================================';
END $$;
