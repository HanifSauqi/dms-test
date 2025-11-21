-- Migration: Add role column to users table
-- Date: 2025-01-19
-- Description: Add role support for superadmin and regular users

-- Add role column to users table
ALTER TABLE users
ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'superadmin'));

-- Create index for role queries
CREATE INDEX idx_users_role ON users(role);

-- Optional: Set first user as superadmin (modify email as needed)
-- UPDATE users SET role = 'superadmin' WHERE email = 'admin@example.com';
-- Or update by ID:
-- UPDATE users SET role = 'superadmin' WHERE id = 1;

COMMENT ON COLUMN users.role IS 'User role: user (default) or superadmin (can manage users)';
