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
import {
  getDashboard,
  getDashboardByEmail
} from '../controllers/dashboardController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// Configure multer for memory storage (files will be in req.file)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Request routes
router.post('/requests', authMiddleware.optionalAuth, createRequest);
router.get('/requests/link/:link', getRequestByLink);
router.get('/requests/user/:email', getUserRequests);

// Dashboard routes (optimized)
router.get('/dashboard/user/:userId', authMiddleware.authenticate, getDashboard);
router.get('/dashboard/email/:email', authMiddleware.authenticate, getDashboardByEmail);

// File routes
router.post('/files/:requestId', authMiddleware.optionalAuth, upload.single('file'), uploadFile);
router.post('/files/:requestId/batch', authMiddleware.optionalAuth, upload.array('files', 10), uploadFile);
router.get('/files/:requestId', authMiddleware.optionalAuth, getRequestFiles);
router.get('/files/download/:fileId', authMiddleware.optionalAuth, downloadFile);
router.get('/files/download-all/:requestId', authMiddleware.optionalAuth, downloadAllFiles);
router.get('/files/download-zip/:requestId', authMiddleware.optionalAuth, downloadZipFile);

export default router;