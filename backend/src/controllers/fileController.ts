import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendNotificationEmail } from '../utils/email';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Upload file to a request
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const file = req.file;

    if (!requestId || !file) {
      res.status(400).json({ error: 'Request ID and file are required' });
      return;
    }

    const { data: request, error: requestError } = await supabase
      .from('file_requests')
      .select('*, users(email)')
      .eq('id', requestId)
      .eq('is_active', true)
      .single();

    if (requestError || !request) {
      res.status(404).json({ error: 'File request not found or expired' });
      return;
    }

    if (new Date(request.expires_at) < new Date()) {
      res.status(400).json({ error: 'This file request has expired' });
      return;
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const storagePath = `uploads/${requestId}/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from('file-uploads')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });

    if (storageError) {
      res.status(500).json({ error: 'Failed to upload file to storage' });
      return;
    }

    const { data: fileData, error: fileError } = await supabase
      .from('uploaded_files')
      .insert({
        request_id: requestId,
        filename: file.originalname,
        storage_path: storagePath,
        content_type: file.mimetype,
        file_size: file.size
      })
      .select()
      .single();

    if (fileError) {
      res.status(500).json({ error: 'Failed to record file in database' });
      return;
    }

    await supabase
      .from('file_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);

    if (request.users?.email) {
      await sendNotificationEmail(
        request.users.email,
        'File uploaded to your request',
        `A file (${file.originalname}) has been uploaded to your request: ${request.description}`
      );
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
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error('Get request files error:', error);
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
    console.error('Download file error:', error);
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
    console.error('Download all files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
