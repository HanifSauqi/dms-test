-- Document Management System Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'superadmin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Folders table
CREATE TABLE folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Labels table
CREATE TABLE labels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    color VARCHAR(50) DEFAULT '#3B82F6'
);

-- Document Labels junction table
CREATE TABLE document_labels (
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    label_id INTEGER REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, label_id)
);

-- Folder Permissions table
CREATE TABLE folder_permissions (
    folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(50) NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (folder_id, user_id)
);

-- User Classification Rules table
CREATE TABLE user_classification_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    target_folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_documents_folder_id ON documents(folder_id);
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_owner_id ON folders(owner_id);
CREATE INDEX idx_classification_user ON user_classification_rules(user_id);
CREATE INDEX idx_classification_keyword ON user_classification_rules(keyword);
CREATE INDEX idx_classification_folder ON user_classification_rules(target_folder_id);

-- Full-text search indexes
CREATE INDEX idx_documents_content_search ON documents USING gin(to_tsvector('english', COALESCE(extracted_content, '')));
CREATE INDEX idx_documents_title_search ON documents USING gin(to_tsvector('english', title));

-- Insert default labels
INSERT INTO labels (name, color) VALUES 
('Project', '#3B82F6'),
('Important', '#EF4444'),
('Draft', '#F59E0B'),
('Completed', '#10B981'),
('Review', '#8B5CF6'); 
