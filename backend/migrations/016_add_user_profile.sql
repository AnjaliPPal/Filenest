-- Migration: 016_add_user_profile.sql
-- Description: Add name and profile_picture columns to users table for Google login

-- Add columns if they don't exist
DO $$ 
BEGIN
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'users' 
                      AND column_name = 'name') THEN
            ALTER TABLE users ADD COLUMN name VARCHAR(255);
        END IF;
    EXCEPTION
        WHEN duplicate_column THEN
            NULL;
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'users' 
                      AND column_name = 'profile_picture') THEN
            ALTER TABLE users ADD COLUMN profile_picture TEXT;
        END IF;
    EXCEPTION
        WHEN duplicate_column THEN
            NULL;
    END;

    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' 
                      AND table_name = 'user_sessions' 
                      AND column_name = 'provider') THEN
            ALTER TABLE user_sessions ADD COLUMN provider VARCHAR(50) DEFAULT 'email';
        END IF;
    EXCEPTION
        WHEN duplicate_column THEN
            NULL;
    END;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email); 