-- Migration: Create reports table
-- Date: 2024-12-19
-- Description: Move reports from localStorage to database for persistence

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    time_range VARCHAR(50) NOT NULL DEFAULT 'monthly',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- Create index for faster keyword searches
CREATE INDEX IF NOT EXISTS idx_reports_keywords ON reports USING GIN(keywords);

-- Add unique constraint for report name per user
ALTER TABLE reports ADD CONSTRAINT unique_report_name_per_user UNIQUE (name, user_id);

-- Comment on table
COMMENT ON TABLE reports IS 'Stores user-created statistical reports with keywords for document counting';
COMMENT ON COLUMN reports.keywords IS 'Array of keywords that documents must contain to be counted';
COMMENT ON COLUMN reports.time_range IS 'Time range for grouping: daily, weekly, monthly, yearly';
