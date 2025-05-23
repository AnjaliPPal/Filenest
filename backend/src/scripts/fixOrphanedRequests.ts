/**
 * Script to fix orphaned file requests
 * This script links requests with null user_id to users based on email matching
 */

import { supabase } from '../config/supabase';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the right location
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function fixOrphanedRequests() {
  console.log('Starting fix for orphaned file requests...');
  
  try {
    // Find all file requests with null user_id
    const { data: orphanedRequests, error: selectError } = await supabase
      .from('file_requests')
      .select('id, recipient_email')
      .is('user_id', null);
    
    if (selectError) {
      console.error('Error fetching orphaned requests:', selectError);
      return;
    }
    
    if (!orphanedRequests || orphanedRequests.length === 0) {
      console.log('No orphaned requests found. Exiting.');
      return;
    }
    
    console.log(`Found ${orphanedRequests.length} orphaned requests. Processing...`);
    
    let linkedCount = 0;
    let missingUserCount = 0;
    
    // Associate each orphaned request with a user based on recipient_email
    for (const request of orphanedRequests) {
      if (!request.recipient_email) {
        console.log(`Request ${request.id} has no recipient email. Skipping.`);
        continue;
      }
      
      console.log(`Processing request ${request.id} for email ${request.recipient_email}`);
      
      // First, check if a user with this email already exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', request.recipient_email)
        .single();
      
      if (userError || !user) {
        console.log(`No user found for email ${request.recipient_email}. Creating new user...`);
        
        // Create a new user with this email
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: request.recipient_email
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error(`Failed to create user for ${request.recipient_email}:`, createError);
          missingUserCount++;
          continue;
        }
        
        if (!newUser) {
          console.error(`Failed to create user for ${request.recipient_email}: No data returned`);
          missingUserCount++;
          continue;
        }
        
        console.log(`Created new user with ID ${newUser.id}`);
        
        // Update the file request with the newly created user_id
        const { error: updateError } = await supabase
          .from('file_requests')
          .update({ user_id: newUser.id })
          .eq('id', request.id);
        
        if (updateError) {
          console.error(`Failed to update request ${request.id}:`, updateError);
          missingUserCount++;
        } else {
          console.log(`Associated request ${request.id} with new user ${newUser.id}`);
          linkedCount++;
        }
      } else {
        console.log(`Found existing user with ID ${user.id}`);
        
        // Update the file request with the found user_id
        const { error: updateError } = await supabase
          .from('file_requests')
          .update({ user_id: user.id })
          .eq('id', request.id);
        
        if (updateError) {
          console.error(`Failed to update request ${request.id}:`, updateError);
          missingUserCount++;
        } else {
          console.log(`Associated request ${request.id} with existing user ${user.id}`);
          linkedCount++;
        }
      }
    }
    
    console.log('\nProcess completed:');
    console.log(`- Total orphaned requests: ${orphanedRequests.length}`);
    console.log(`- Successfully linked: ${linkedCount}`);
    console.log(`- Failed to link: ${missingUserCount}`);
    
  } catch (error) {
    console.error('Error in fix process:', error);
  } finally {
    // Close any connections
    process.exit(0);
  }
}

// Run the script
fixOrphanedRequests(); 