-- Migration: 002_storage_bucket.sql
-- Description: Create storage bucket for file uploads

-- This would typically be done through the Supabase dashboard or API
-- But for documentation purposes, we include it here

-- Note: This SQL won't run directly in Supabase's SQL editor
-- You'll need to create this bucket through the Supabase Dashboard:
-- Storage > New Bucket > Name: "file-uploads" > Make it private

/*
CREATE BUCKET IF NOT EXISTS
  file-uploads
WITH
  PUBLIC = false,
  ALLOWED_MIME_TYPES = {
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'text/plain'
  },
  FILE_SIZE_LIMIT = 52428800; -- 50MB
*/ 