-- Migration: 014_create_dashboard_procedure.sql
-- Description: Create optimized stored procedure for dashboard data retrieval

-- Create function to get dashboard data efficiently
CREATE OR REPLACE FUNCTION get_dashboard_data(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    subscription_tier TEXT;
    subscription_data JSONB;
    request_data JSONB;
BEGIN
    -- Get user's subscription tier
    SELECT tier::TEXT INTO subscription_tier 
    FROM subscriptions 
    WHERE user_id = user_id_param 
    LIMIT 1;
    
    -- Default to 'free' if no subscription found
    IF subscription_tier IS NULL THEN
        subscription_tier := 'free';
    END IF;
    
    -- Build subscription data based on tier
    CASE subscription_tier
        WHEN 'premium' THEN
            subscription_data := jsonb_build_object(
                'tier', subscription_tier,
                'activeLimit', 100,
                'storageLimit', 1000,
                'expiryDays', 30,
                'maxFileSize', 100
            );
        ELSE
            subscription_data := jsonb_build_object(
                'tier', subscription_tier,
                'activeLimit', 10,
                'storageLimit', 100,
                'expiryDays', 7,
                'maxFileSize', 10
            );
    END CASE;
    
    -- Get requests with their files using a more efficient approach
    WITH request_files AS (
        SELECT 
            fr.id as request_id,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'id', uf.id,
                        'filename', uf.filename,
                        'storage_path', uf.storage_path,
                        'content_type', uf.content_type,
                        'file_size', uf.file_size,
                        'uploaded_at', uf.uploaded_at
                    ) ORDER BY uf.uploaded_at DESC
                ) FILTER (WHERE uf.id IS NOT NULL),
                '[]'::jsonb
            ) as files
        FROM 
            file_requests fr
        LEFT JOIN 
            uploaded_files uf ON fr.id = uf.request_id 
            AND uf.deleted_at IS NULL
        WHERE 
            fr.user_id = user_id_param
            AND fr.deleted_at IS NULL
        GROUP BY 
            fr.id
    )
    SELECT 
        jsonb_build_object(
            'requests', COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'id', fr.id,
                        'description', fr.description,
                        'unique_link', fr.unique_link,
                        'status', fr.status,
                        'expires_at', fr.expires_at,
                        'created_at', fr.created_at,
                        'updated_at', fr.updated_at,
                        'is_active', fr.is_active,
                        'deadline', fr.deadline,
                        'recipient_email', fr.recipient_email,
                        'uploaded_files', rf.files
                    ) ORDER BY fr.created_at DESC
                ),
                '[]'::jsonb
            ),
            'subscription', subscription_data
        ) INTO request_data
    FROM 
        file_requests fr
    LEFT JOIN
        request_files rf ON fr.id = rf.request_id
    WHERE 
        fr.user_id = user_id_param
        AND fr.deleted_at IS NULL;
        
    RETURN request_data;
END;
$$ LANGUAGE plpgsql;

-- Create index to optimize the function
CREATE INDEX IF NOT EXISTS idx_file_requests_user_id_deleted_at 
ON file_requests(user_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_uploaded_files_request_id_deleted_at 
ON uploaded_files(request_id) 
WHERE deleted_at IS NULL; 