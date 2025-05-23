-- Migration: 015_user_sessions.sql
-- Description: Add user_sessions table for authentication management

-- Create user_sessions table if it does not exist
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_info TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token) WHERE is_active = TRUE;

-- Add cleanupSessions function that can be scheduled to run periodically
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
    sessions_removed INTEGER;
BEGIN
    -- Remove expired and inactive sessions
    DELETE FROM user_sessions
    WHERE 
        expires_at < CURRENT_TIMESTAMP 
        OR is_active = FALSE;
        
    GET DIAGNOSTICS sessions_removed = ROW_COUNT;
    RETURN sessions_removed;
END;
$$ LANGUAGE plpgsql; 