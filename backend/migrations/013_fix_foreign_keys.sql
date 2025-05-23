-- Migration: 013_fix_foreign_keys.sql
-- Description: Fix relationships between tables to ensure proper foreign key constraints

-- First check if constraints exist and drop them if they do
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'uploaded_files_request_id_fkey' 
               AND table_name = 'uploaded_files') THEN
        ALTER TABLE uploaded_files DROP CONSTRAINT uploaded_files_request_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'file_requests_user_id_fkey' 
               AND table_name = 'file_requests') THEN
        ALTER TABLE file_requests DROP CONSTRAINT file_requests_user_id_fkey;
    END IF;
END;
$$;

-- Create index on file_requests(user_id) for better performance
CREATE INDEX IF NOT EXISTS idx_file_requests_user_id ON file_requests(user_id) 
WHERE deleted_at IS NULL;

-- Create index on uploaded_files(request_id) for better performance
CREATE INDEX IF NOT EXISTS idx_uploaded_files_request_id ON uploaded_files(request_id)
WHERE deleted_at IS NULL;

-- Add proper foreign key constraints with CASCADE options
ALTER TABLE file_requests
ADD CONSTRAINT fk_file_requests_user_id
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;

ALTER TABLE uploaded_files
ADD CONSTRAINT fk_uploaded_files_request_id
FOREIGN KEY (request_id) REFERENCES file_requests(id)
ON DELETE CASCADE;

-- Add soft delete columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'file_requests' AND column_name = 'deleted_at') THEN
        ALTER TABLE file_requests ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'uploaded_files' AND column_name = 'deleted_at') THEN
        ALTER TABLE uploaded_files ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;
END;
$$; 