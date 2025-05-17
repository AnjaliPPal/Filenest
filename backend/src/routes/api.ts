// backend/src/routes/api.ts
import express from 'express';
import multer from 'multer';
import { 
  createRequest, 
  getRequestByLink, 
  getUserRequests 
} from '../controllers/requestController';
import { 
  uploadFile, 
  getRequestFiles, 
  downloadFile, 
  downloadAllFiles,
  downloadZipFile
} from '../controllers/fileController';

const router = express.Router();

// Configure multer for memory storage (files will be in req.file)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Request routes
router.post('/requests', createRequest);
router.get('/requests/link/:link', getRequestByLink);
router.get('/requests/user/:email', getUserRequests);

// File routes
router.post('/files/:requestId', upload.single('file'), uploadFile);
router.post('/files/:requestId/batch', upload.array('files'), uploadFile);
router.get('/files/:requestId', getRequestFiles);
router.get('/files/download/:fileId', downloadFile);
router.get('/files/download-all/:requestId', downloadAllFiles);
router.get('/files/download-zip/:requestId', downloadZipFile);

export default router;