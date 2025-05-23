import dotenv from 'dotenv';
import { supabase } from '../config/supabase';
import { DbIntegrityService } from '../services/dbIntegrityService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * This script fixes database issues by:
 * 1. Creating missing users
 * 2. Linking orphaned file requests to users
 * 3. Checking for other integrity issues
 */
async function fixDatabase() {
  try {
    logger.info('=== Starting Database Fix Script ===');

    // Step 1: Initialize and run the database integrity service
    await DbIntegrityService.initialize();

    // Step 2: Ensure all file requests have a user_id linked to recipient_email
    logger.info('Running comprehensive database fix...');
    const { data: allRequests, error: fetchError } = await supabase
      .from('file_requests')
      .select('id, recipient_email, user_id');

    if (fetchError) {
      logger.error('Error fetching file requests:', fetchError);
      return;
    }

    logger.info(`Found ${allRequests?.length || 0} total file requests to check`);
    
    let fixedCount = 0;
    let alreadyOkCount = 0;
    
    // Process each request to ensure it has user_id
    if (allRequests) {
      for (const request of allRequests) {
        // If already has user_id, skip
        if (request.user_id) {
          alreadyOkCount++;
          continue;
        }
        
        // No recipient email to link with, skip
        if (!request.recipient_email) {
          logger.warn(`Request ${request.id} has no recipient email, cannot fix`);
          continue;
        }
        
        // Find or create user for this email
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', request.recipient_email)
          .single();
          
        if (userError) {
          // Create user
          logger.info(`Creating user for email: ${request.recipient_email}`);
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({ email: request.recipient_email })
            .select('id')
            .single();
            
          if (createError) {
            logger.error(`Failed to create user: ${createError.message}`);
            continue;
          }
          
          // Link request to new user
          const { error: updateError } = await supabase
            .from('file_requests')
            .update({ user_id: newUser.id })
            .eq('id', request.id);
            
          if (updateError) {
            logger.error(`Failed to update request ${request.id}: ${updateError.message}`);
          } else {
            logger.info(`Fixed request ${request.id} by linking to new user ${newUser.id}`);
            fixedCount++;
          }
        } else {
          // Link request to existing user
          const { error: updateError } = await supabase
            .from('file_requests')
            .update({ user_id: user.id })
            .eq('id', request.id);
            
          if (updateError) {
            logger.error(`Failed to update request ${request.id}: ${updateError.message}`);
          } else {
            logger.info(`Fixed request ${request.id} by linking to existing user ${user.id}`);
            fixedCount++;
          }
        }
      }
    }

    logger.info(`Database fix complete. Fixed ${fixedCount} requests. ${alreadyOkCount} were already OK.`);
    
    // Step 3: Check for any files not linked to a request
    const { data: orphanedFiles, error: filesError } = await supabase
      .from('uploaded_files')
      .select('id, filename')
      .is('request_id', null);
      
    if (filesError) {
      logger.error('Error checking for orphaned files:', filesError);
    } else if (orphanedFiles && orphanedFiles.length > 0) {
      logger.warn(`Found ${orphanedFiles.length} files with no request_id. These files won't appear in any dashboard.`);
    } else {
      logger.info('No orphaned files found. All files have a valid request_id.');
    }
    
    logger.info('=== Database Fix Script Completed ===');
  } catch (error) {
    logger.error('Error running fix script:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixDatabase(); 