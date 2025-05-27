-- Migration: 018_add_ip_address_to_sessions.sql
-- Description: Add ip_address column to user_sessions table

-- Add ip_address column to user_sessions table
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS ip_address INET;

-- Add index for IP address lookups (helpful for security monitoring)
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_address ON user_sessions(ip_address);

-- Add user_agent column as well since it's commonly used for session tracking
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Create index for user_agent (helpful for device tracking)
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_agent ON user_sessions(user_agent); 