-- Migration: 001_initial_schema.sql
-- Description: Set up initial database schema for FileNest application

-- Enable UUID extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create file requests table
CREATE TABLE IF NOT EXISTS file_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, expired
  unique_link TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT status_check CHECK (status IN ('pending', 'completed', 'expired'))
);

-- Create uploaded files table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES file_requests(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  content_type TEXT,
  file_size INTEGER, -- size in bytes
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_requests_user_id ON file_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_file_requests_unique_link ON file_requests(unique_link);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_request_id ON uploaded_files(request_id);

-- Create function to generate secure random links
CREATE OR REPLACE FUNCTION generate_unique_link() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER := 0;
  length INTEGER := 12;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars))::integer + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql; 