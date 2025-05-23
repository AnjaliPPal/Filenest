// Script to fix database relationships
import { supabase } from '../config/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function fixDatabaseRelationships() {
  console.log('Starting database relationship fix...');

  try {
    // 1. Get all uploaded files
    const { data: files, error: filesError } = await supabase
      .from('uploaded_files')
      .select('*');

    if (filesError) {
      console.error('Error fetching files:', filesError);
      return;
    }

    console.log(`Found ${files.length} files in uploaded_files table`);

    // 2. Get all file requests
    const { data: requests, error: requestsError } = await supabase
      .from('file_requests')
      .select('*');

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      return;
    }

    console.log(`Found ${requests.length} file requests in file_requests table`);

    // 3. Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users.length} users in users table`);

    // 4. Check for files with missing request references
    const orphanedFiles = files.filter(file => 
      !requests.some(request => request.id === file.request_id)
    );

    console.log(`Found ${orphanedFiles.length} orphaned files with no valid request`);

    // 5. Check for requests with missing user references
    const orphanedRequests = requests.filter(request => 
      request.user_id && !users.some(user => user.id === request.user_id)
    );

    console.log(`Found ${orphanedRequests.length} requests with invalid user references`);

    // 6. Fix orphaned files if we can
    if (orphanedFiles.length > 0 && requests.length > 0) {
      // Use the first valid request as default
      const defaultRequest = requests[0];
      console.log(`Will link orphaned files to request: ${defaultRequest.id}`);

      for (const file of orphanedFiles) {
        const { error: updateError } = await supabase
          .from('uploaded_files')
          .update({ request_id: defaultRequest.id })
          .eq('id', file.id);

        if (updateError) {
          console.error(`Failed to update file ${file.id}:`, updateError);
        } else {
          console.log(`Updated file ${file.id} to link to request ${defaultRequest.id}`);
        }
      }
    }

    // 7. Fix orphaned requests
    if (orphanedRequests.length > 0 && users.length > 0) {
      // Use the first valid user as default
      const defaultUser = users[0];
      console.log(`Will link orphaned requests to user: ${defaultUser.id}`);

      for (const request of orphanedRequests) {
        const { error: updateError } = await supabase
          .from('file_requests')
          .update({ user_id: defaultUser.id })
          .eq('id', request.id);

        if (updateError) {
          console.error(`Failed to update request ${request.id}:`, updateError);
        } else {
          console.log(`Updated request ${request.id} to link to user ${defaultUser.id}`);
        }
      }
    }

    console.log('Database relationship fix completed');
  } catch (error) {
    console.error('Error fixing database relationships:', error);
  }
}

// Execute the function
fixDatabaseRelationships().catch(console.error); 