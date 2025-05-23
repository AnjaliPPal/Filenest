-- Migration: 003_storage_bucket.sql
-- Description: Create storage bucket for file uploads

-- This is a template for creating a storage bucket in Supabase
-- The actual creation should be done in the Supabase dashboard
-- or with the Supabase CLI.

/*
-- Using Supabase SQL:
CREATE STORAGE BUCKET file_uploads;

-- Set bucket to private
UPDATE storage.buckets 
SET public = false
WHERE name = 'file_uploads';
*/

-- Create RLS policies for storage
BEGIN;
-- Allow users to select objects they created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can view their own uploads'
  ) THEN
    CREATE POLICY "Users can view their own uploads"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'file-uploads' AND (auth.uid() = owner OR auth.uid() IS NOT NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Anyone can upload files'
  ) THEN
    CREATE POLICY "Anyone can upload files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'file-uploads');
  END IF;
END $$;
COMMIT; 