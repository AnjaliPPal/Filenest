import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
// Unified email service is now used
import { sendUploadNotification } from '../utils/emailService';
import { logger } from '../utils/logger';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import stream from 'stream';
import { SubscriptionTier } from '../types/subscription';
import { getSubscriptionLimits } from './subscriptionController';

// Upload file to a request
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info(`Upload file request received for requestId: ${req.params.requestId}`);
    const { requestId } = req.params;
    
    // Handle both single file and array of files
    if (!requestId || (!req.file && (!req.files || (Array.isArray(req.files) && req.files.length === 0)))) {
      res.status(400).json({ error: 'Request ID and at least one file are required' });
      return;
    }

    // First check if the requestId is a unique_link rather than a UUID
    const { data: requestByLink, error: linkError } = await supabase
      .from('file_requests')
      .select('*, users!file_requests_user_id_fkey(id, email)')
      .eq('unique_link', requestId)
      .eq('is_active', true)
      .single();
    
    let request = requestByLink;
    let requestError = linkError;
    
    // If not found by unique_link, try with UUID
    if (linkError || !request) {
      try {
        const result = await supabase
          .from('file_requests')
          .select('*, users!file_requests_user_id_fkey(id, email)')
          .eq('id', requestId)
          .eq('is_active', true)
          .single();
          
        request = result.data;
        requestError = result.error;
      } catch (err) {
        logger.error('Error fetching request by ID:', err);
      }
    }

    if (requestError || !request) {
      logger.error('Request not found:', requestError);
      res.status(404).json({ error: 'File request not found or expired' });
      return;
    }

    if (new Date(request.expires_at) < new Date()) {
      res.status(400).json({ error: 'This file request has expired' });
      return;
    }

    // Default to FREE tier
    let tier = SubscriptionTier.FREE;
    
    // If user_id exists, try to get their subscription tier
    if (request.user_id) {
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', request.user_id)
        .eq('is_active', true)
        .single();
      
      if (subscriptionData) {
        tier = subscriptionData.tier;
      }
    }
    
    // Get subscription limits based on tier
    const limits = getSubscriptionLimits(tier);
    
    // Calculate current storage usage in MB by summing up existing files
    let currentStorageUsedMB = 0;
    
    if (request.user_id) {
      // Get all uploaded files for this user
      const { data: userFiles } = await supabase
        .from('uploaded_files')
        .select('file_size')
        .eq('request_id', request.id);
        
      if (userFiles && userFiles.length > 0) {
        const totalBytes = userFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
        currentStorageUsedMB = totalBytes / (1024 * 1024);
      }
    }
    
    // Calculate total size of files to upload in MB
    let newFilesSizeMB = 0;
    if (req.file) {
      newFilesSizeMB = req.file.size / (1024 * 1024);
    } else if (req.files && Array.isArray(req.files)) {
      newFilesSizeMB = (req.files as Express.Multer.File[]).reduce((total, file) => total + file.size, 0) / (1024 * 1024);
    }
    
    // Check if uploading these files would exceed storage limit
    if (currentStorageUsedMB + newFilesSizeMB > limits.maxStorageMB) {
      res.status(403).json({
        error: 'Storage limit exceeded for this subscription tier',
        tier,
        limit: limits.maxStorageMB,
        current: Math.round(currentStorageUsedMB * 100) / 100,
        needed: Math.round((currentStorageUsedMB + newFilesSizeMB) * 100) / 100,
        upgradeRequired: tier === SubscriptionTier.FREE
      });
      return;
    }

    // Array to store uploaded files for email notification
    const uploadedFiles = [];

    // Process single file
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const storagePath = `uploads/${request.id}/${fileName}`;

      logger.info(`Uploading file to storage path: ${storagePath}`);
      
      try {
        const { error: storageError } = await supabase.storage
          .from('file-uploads')
          .upload(storagePath, req.file.buffer, {
            contentType: req.file.mimetype,
            cacheControl: '3600'
          });

        if (storageError) {
          logger.error('Storage error:', storageError);
          res.status(500).json({ error: 'Failed to upload file to storage: ' + storageError.message });
          return;
        }
      } catch (storageErr) {
        logger.error('Storage exception:', storageErr);
        res.status(500).json({ error: 'Storage exception: ' + (storageErr instanceof Error ? storageErr.message : String(storageErr)) });
        return;
      }

      try {
        const { data: fileData, error: fileError } = await supabase
          .from('uploaded_files')
          .insert({
            request_id: request.id,
            filename: req.file.originalname,
            storage_path: storagePath,
            content_type: req.file.mimetype,
            file_size: req.file.size
          })
          .select()
          .single();

        if (fileError) {
          logger.error('Database error:', fileError);
          res.status(500).json({ error: 'Failed to record file in database: ' + fileError.message });
          return;
        }

        uploadedFiles.push(fileData);

        await supabase
          .from('file_requests')
          .update({ status: 'completed' })
          .eq('id', request.id);

        // Send email notification after successful upload
        if (request.recipient_email) {
          try {
            // Send notification to recipient
            await sendUploadNotification(
              request.recipient_email,
              request.description,
              [fileData],
              request.id
            );
          } catch (emailErr) {
            logger.error('Failed to send email notifications:', emailErr);
            // Continue even if email fails
          }
        }

        res.status(201).json({
          message: 'File uploaded successfully',
          file: {
            id: fileData.id,
            filename: fileData.filename,
            content_type: fileData.content_type,
            uploaded_at: fileData.uploaded_at
          }
        });
      } catch (dbErr) {
        logger.error('Database exception:', dbErr);
        res.status(500).json({ error: 'Database exception: ' + (dbErr instanceof Error ? dbErr.message : String(dbErr)) });
      }
    } 
    // Process multiple files
    else if (req.files && Array.isArray(req.files)) {
      const uploadResults = [];
      
      for (const file of req.files) {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        const storagePath = `uploads/${request.id}/${fileName}`;
        
        try {
          // Upload to storage
          const { error: storageError } = await supabase.storage
            .from('file-uploads')
            .upload(storagePath, file.buffer, {
              contentType: file.mimetype,
              cacheControl: '3600'
            });

          if (storageError) {
            logger.error('Storage error:', storageError);
            uploadResults.push({
              originalFilename: file.originalname,
              success: false,
              error: 'Failed to upload to storage'
            });
            continue;
          }
          
          // Record in database
          const { data: fileData, error: fileError } = await supabase
            .from('uploaded_files')
            .insert({
              request_id: request.id,
              filename: file.originalname,
              storage_path: storagePath,
              content_type: file.mimetype,
              file_size: file.size
            })
            .select()
            .single();
            
          if (fileError) {
            logger.error('Database error:', fileError);
            uploadResults.push({
              originalFilename: file.originalname,
              success: false,
              error: 'Failed to record in database'
            });
          } else {
            uploadResults.push({
              originalFilename: file.originalname,
              fileId: fileData.id,
              success: true
            });
            uploadedFiles.push(fileData);
          }
        } catch (err) {
          logger.error(`Error processing file ${file.originalname}:`, err);
          uploadResults.push({
            originalFilename: file.originalname,
            success: false,
            error: 'Processing error'
          });
        }
      }
      
      // Update request status if any files were uploaded successfully
      if (uploadResults.some(result => result.success)) {
        try {
          // Update file_request status to completed
          await supabase
            .from('file_requests')
            .update({ status: 'completed' })
            .eq('id', request.id);
          
          // Make sure users table reflects that user has uploaded files 
          // by ensuring the user_id in file_requests links to the user
          if (request.user_id) {
            const { error: userUpdateError } = await supabase
              .from('users')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', request.user_id);
              
            if (userUpdateError) {
              logger.error('Error updating user:', userUpdateError);
            }
          }
        } catch (updateError) {
          logger.error('Error updating request status or user:', updateError);
        }
        
        // Send email notification after successful batch upload
        if (uploadedFiles.length > 0 && request.recipient_email) {
          try {
            await sendUploadNotification(
              request.recipient_email,
              request.description,
              uploadedFiles,
              request.id
            );
          } catch (emailErr) {
            logger.error('Failed to send email notification:', emailErr);
            // Continue even if email fails
          }
        }
      }
      
      res.status(200).json({
        message: `Successfully processed ${uploadResults.filter(r => r.success).length} of ${req.files.length} files`,
        uploadResults
      });
    }
  } catch (error) {
    logger.error('Upload file error:', error);
    res.status(500).json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) });
  }
};

// Get all files for a request
export const getRequestFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      res.status(400).json({ error: 'Request ID is required' });
      return;
    }

    const { data: files, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('request_id', requestId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to fetch files' });
      return;
    }

    res.status(200).json(files);
  } catch (error) {
    logger.error('Get request files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Download a specific file
export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      res.status(400).json({ error: 'File ID is required' });
      return;
    }

    const { data: file, error: fileError } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const { data: signedURL, error: signedURLError } = await supabase
      .storage
      .from('file-uploads')
      .createSignedUrl(file.storage_path, 60);

    if (signedURLError || !signedURL) {
      res.status(500).json({ error: 'Failed to generate download URL' });
      return;
    }

    res.status(200).json({ download_url: signedURL.signedUrl });
  } catch (error) {
    logger.error('Download file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Download all files for a request as ZIP (or list of signed URLs for now)
export const downloadAllFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      res.status(400).json({ error: 'Request ID is required' });
      return;
    }

    const { data: files, error: filesError } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('request_id', requestId);

    if (filesError || !files || files.length === 0) {
      res.status(404).json({ error: 'No files found for this request' });
      return;
    }

    const downloadURLs = await Promise.all(files.map(async (file) => {
      const { data: signedURL } = await supabase
        .storage
        .from('file-uploads')
        .createSignedUrl(file.storage_path, 3600);

      return {
        id: file.id,
        filename: file.filename,
        download_url: signedURL?.signedUrl
      };
    }));

    res.status(200).json(downloadURLs);
  } catch (error) {
    logger.error('Download all files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Download all files for a request as a single ZIP file
export const downloadZipFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      res.status(400).json({ error: 'Request ID is required' });
      return;
    }

    // Get the request to check access permissions and get metadata
    const { data: request, error: requestError } = await supabase
      .from('file_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      res.status(404).json({ error: 'File request not found' });
      return;
    }

    // Get all files for the request
    const { data: files, error: filesError } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('request_id', requestId);

    if (filesError || !files || files.length === 0) {
      res.status(404).json({ error: 'No files found for this request' });
      return;
    }

    // Set up ZIP response headers
    const requestName = request.description
      ? request.description.replace(/[^a-z0-9]/gi, '_').substring(0, 30)
      : `request_${requestId.substring(0, 8)}`;
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${requestName}_files.zip`);

    // Create ZIP stream
    const archive = archiver('zip', {
      zlib: { level: 5 } // Compression level
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add files to ZIP
    for (const file of files) {
      try {
        // Get file from storage
        const { data, error: downloadError } = await supabase.storage
          .from('file-uploads')
          .download(file.storage_path);

        if (downloadError || !data) {
          logger.error(`Error downloading file ${file.id}:`, downloadError);
          continue; // Skip this file but continue with others
        }

        // Convert the data to a buffer if it's not already
        // Supabase returns ArrayBuffer in Node.js environment
        const fileBuffer = Buffer.from(await data.arrayBuffer());

        // Add file to ZIP with its original filename
        archive.append(fileBuffer, { name: file.filename });
      } catch (fileError) {
        logger.error(`Error processing file ${file.id}:`, fileError);
        // Continue with other files
      }
    }

    // Finalize the archive and wait for completion
    await archive.finalize();
  } catch (error) {
    logger.error('Download ZIP file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
