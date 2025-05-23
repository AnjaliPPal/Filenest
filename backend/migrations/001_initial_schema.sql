-- Migration: 001_initial_schema.sql
-- Description: Set up initial database schema for FileNest application

-- Enable UUID extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create file_requests table
CREATE TABLE IF NOT EXISTS file_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    description TEXT NOT NULL,
    unique_link VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    deadline TIMESTAMP WITH TIME ZONE,
    recipient_email VARCHAR(255) NOT NULL,
    CONSTRAINT file_requests_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE SET NULL
);

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uploaded_files_request_id_fkey FOREIGN KEY (request_id)
        REFERENCES file_requests(id) ON DELETE CASCADE
);

-- Add indexes
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

-- Create function for running SQL migrations
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS json AS $$
BEGIN
  EXECUTE sql_query;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies
ALTER TABLE file_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create policies for file_requests
CREATE POLICY "Users can view their own file requests"
ON file_requests FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create file requests"
ON file_requests FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own file requests"
ON file_requests FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policies for uploaded_files
CREATE POLICY "Users can view files for their requests"
ON uploaded_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM file_requests
    WHERE file_requests.id = uploaded_files.request_id
    AND (file_requests.user_id = auth.uid() OR file_requests.user_id IS NULL)
  )
);

CREATE POLICY "Anyone can upload files to a request"
ON uploaded_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM file_requests
    WHERE file_requests.id = request_id
    AND file_requests.is_active = true
    AND file_requests.expires_at > NOW()
  )
); 