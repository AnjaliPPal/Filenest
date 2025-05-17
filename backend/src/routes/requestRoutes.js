const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { FileRequest, FileUpload, User } = require('../models');
// If you're using path manipulation
const path = require('path');
// If you're using fs
const fs = require('fs');

// Configure multer for file uploads
// For memory storage (when uploading to cloud storage):
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// For disk storage (if storing locally):
/* 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
*/

/**
 * @route GET /api/requests/:id
 * @desc Get request by ID
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const request = await FileRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ request });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/requests/link/:link
 * @desc Get request by unique link
 * @access Public
 */
router.get('/link/:link', async (req, res) => {
  try {
    const request = await FileRequest.findOne({
      where: { unique_link: req.params.link }
    });
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found or expired' });
    }
    
    res.json({ request, error: null });
  } catch (error) {
    console.error('Error fetching request by link:', error);
    res.status(500).json({ error: 'Server error', request: null });
  }
});

/**
 * @route POST /api/requests
 * @desc Create a new file request
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    const { description, deadline, email } = req.body;
    
    // Generate a unique link (you can use a package like shortid or nanoid for this)
    const uniqueLink = uuidv4().substring(0, 12);
    
    // Set expiry date (e.g., 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const request = await FileRequest.create({
      description,
      deadline: deadline || null,
      email,
      unique_link: uniqueLink,
      expires_at: expiresAt,
      status: 'pending',
      is_active: true
    });
    
    res.status(201).json({
      success: true,
      request: {
        id: request.id,
        description: request.description,
        deadline: request.deadline,
        link: request.unique_link
      }
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ success: false, error: 'Failed to create request' });
  }
});

/**
 * @route POST /api/requests/:requestId/upload
 * @desc Upload a file to a request (single file)
 * @access Public
 */
router.post('/:requestId/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Upload file request received', req.params, 'with file');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }
    
    const requestId = req.params.requestId;
    
    // Find the request by its unique link
    const request = await FileRequest.findOne({
      where: { unique_link: requestId }
    });
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found or expired' });
    }
    
    // Update request status if it's pending
    if (request.status === 'pending') {
      request.status = 'completed';
      await request.save();
    }
    
    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}.${req.file.originalname.split('.').pop()}`;
    
    // Storage path
    const storagePath = `uploads/${request.id}/${uniqueFilename}`;
    console.log('Uploading to storage path:', storagePath);
    
    // Store the file (implementation depends on your storage solution)
    // For example, with S3 or other cloud storage
    
    // For direct file system (not recommended for production):
    // const uploadDir = path.join(__dirname, '../../uploads', request.id);
    // fs.mkdirSync(uploadDir, { recursive: true });
    // fs.writeFileSync(path.join(uploadDir, uniqueFilename), req.file.buffer);
    
    // Record file upload in database
    const fileUpload = await FileUpload.create({
      request_id: request.id,
      original_filename: req.file.originalname,
      storage_path: storagePath,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    });
    
    // Send notification to request owner
    try {
      const owner = await User.findByPk(request.user_id);
      if (owner && owner.email) {
        // Uncomment and implement email sending
        // await sendFileUploadNotification(owner.email, request);
        console.log(`Notification would be sent to: ${owner.email}`);
      }
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }
    
    res.status(200).json({
      message: 'File uploaded successfully',
      fileId: fileUpload.id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'An error occurred during file upload' });
  }
});

/**
 * @route POST /api/requests/:requestId/upload-batch
 * @desc Upload multiple files to a request in a single API call
 * @access Public
 */
router.post('/:requestId/upload-batch', upload.array('files'), async (req, res) => {
  try {
    console.log('Batch upload request received', req.params, 'with', req.files?.length || 0, 'files');
    
    // Validate request
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }

    const requestId = req.params.requestId;
    
    // Find the request by its unique link
    const request = await FileRequest.findOne({ where: { unique_link: requestId } });
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found or expired' });
    }
    
    // Update request status if it's pending
    if (request.status === 'pending') {
      request.status = 'completed';
      await request.save();
    }
    
    // Process each uploaded file
    const uploadResults = [];
    
    for (const file of req.files) {
      try {
        // Generate a unique filename
        const uniqueFilename = `${uuidv4()}.${file.originalname.split('.').pop()}`;
        
        // Storage path
        const storagePath = `uploads/${request.id}/${uniqueFilename}`;
        console.log('Uploading to storage path:', storagePath);
        
        // Upload file to storage
        // This will vary based on your storage solution
        // For example, with cloud storage:
        // const result = await uploadToCloudStorage(file.buffer, storagePath);
        
        // For direct file system (not recommended for production):
        const uploadDir = path.join(__dirname, '../../uploads', request.id);
        fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, uniqueFilename), file.buffer);
        
        // Record file upload in database
        const fileUpload = await FileUpload.create({
          request_id: request.id,
          original_filename: file.originalname,
          storage_path: storagePath,
          file_size: file.size,
          mime_type: file.mimetype
        });
        
        uploadResults.push({
          originalFilename: file.originalname,
          fileId: fileUpload.id,
          success: true
        });
      } catch (fileError) {
        console.error('Error uploading file:', file.originalname, fileError);
        uploadResults.push({
          originalFilename: file.originalname,
          success: false,
          error: 'Failed to upload file'
        });
      }
    }
    
    // Send notification to request owner
    try {
      const owner = await User.findByPk(request.user_id);
      if (owner && owner.email) {
        // Uncomment this when email sending is set up
        // await sendFileUploadNotification(owner.email, request, req.files.length);
        console.log(`Notification would be sent to: ${owner.email} for ${req.files.length} files`);
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }
    
    // Return success response
    res.status(200).json({
      message: `Successfully processed ${uploadResults.filter(r => r.success).length} of ${req.files.length} files`,
      uploadResults
    });
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({ error: 'An error occurred processing the upload' });
  }
});

module.exports = router; 