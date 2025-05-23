-- Direct SQL migration to apply all necessary changes

-- Add name and profile_picture columns to users table if they don't exist
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

-- Fix orphaned file requests
UPDATE file_requests fr
SET user_id = u.id
FROM users u
WHERE fr.user_id IS NULL
AND fr.recipient_email = u.email;

-- Create users for any remaining orphaned requests
INSERT INTO users (email)
SELECT DISTINCT recipient_email
FROM file_requests
WHERE user_id IS NULL
AND recipient_email IS NOT NULL
AND recipient_email NOT IN (SELECT email FROM users);

-- Now link the remaining orphaned requests
UPDATE file_requests fr
SET user_id = u.id
FROM users u
WHERE fr.user_id IS NULL
AND fr.recipient_email = u.email;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_file_requests_user_id ON file_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_request_id ON uploaded_files(request_id);

-- Create stored procedure for dashboard data if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_dashboard_data'
    ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION get_dashboard_data(user_id_param UUID)
    RETURNS JSONB AS $$
    DECLARE
        subscription_tier TEXT;
        subscription_data JSONB;
        request_data JSONB;
        user_email TEXT;
    BEGIN
        -- Get user''s subscription tier
        SELECT tier::TEXT INTO subscription_tier 
        FROM subscriptions 
        WHERE user_id = user_id_param 
        LIMIT 1;
        
        -- Default to ''free'' if no subscription found
        IF subscription_tier IS NULL THEN
            subscription_tier := ''free'';
        END IF;
        
        -- Get user email for orphaned request check
        SELECT email INTO user_email 
        FROM users 
        WHERE id = user_id_param;
        
        -- Build subscription data based on tier
        CASE subscription_tier
            WHEN ''premium'' THEN
                subscription_data := jsonb_build_object(
                    ''tier'', subscription_tier,
                    ''activeLimit'', 100,
                    ''storageLimit'', 1000,
                    ''expiryDays'', 30,
                    ''maxFileSize'', 100
                );
            ELSE
                subscription_data := jsonb_build_object(
                    ''tier'', subscription_tier,
                    ''activeLimit'', 10,
                    ''storageLimit'', 100,
                    ''expiryDays'', 7,
                    ''maxFileSize'', 10
                );
        END CASE;
        
        -- Get all requests by user_id as well as orphaned requests by email
        WITH all_requests AS (
            -- Get requests by user ID
            SELECT fr.* 
            FROM file_requests fr
            WHERE fr.user_id = user_id_param
            AND fr.deleted_at IS NULL
            
            UNION
            
            -- Get orphaned requests by email
            SELECT fr.* 
            FROM file_requests fr
            WHERE fr.user_id IS NULL
            AND fr.recipient_email = user_email
            AND fr.deleted_at IS NULL
        ),
        request_files AS (
            SELECT 
                ar.id as request_id,
                COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            ''id'', uf.id,
                            ''filename'', uf.filename,
                            ''storage_path'', uf.storage_path,
                            ''content_type'', uf.content_type,
                            ''file_size'', uf.file_size,
                            ''uploaded_at'', uf.uploaded_at
                        ) ORDER BY uf.uploaded_at DESC
                    ) FILTER (WHERE uf.id IS NOT NULL),
                    ''[]''::jsonb
                ) as files
            FROM 
                all_requests ar
            LEFT JOIN 
                uploaded_files uf ON ar.id = uf.request_id 
                AND uf.deleted_at IS NULL
            GROUP BY 
                ar.id
        )
        SELECT 
            jsonb_build_object(
                ''requests'', COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            ''id'', ar.id,
                            ''description'', ar.description,
                            ''unique_link'', ar.unique_link,
                            ''status'', ar.status,
                            ''expires_at'', ar.expires_at,
                            ''created_at'', ar.created_at,
                            ''updated_at'', ar.updated_at,
                            ''is_active'', ar.is_active,
                            ''deadline'', ar.deadline,
                            ''recipient_email'', ar.recipient_email,
                            ''uploaded_files'', rf.files
                        ) ORDER BY ar.created_at DESC
                    ),
                    ''[]''::jsonb
                ),
                ''subscription'', subscription_data
            ) INTO request_data
        FROM 
            all_requests ar
        LEFT JOIN
            request_files rf ON ar.id = rf.request_id;
            
        RETURN request_data;
    END;
    $$ LANGUAGE plpgsql;
    ';
    END IF;
END$$; 