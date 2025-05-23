import express from 'express';
import { 
  loginWithEmail, 
  loginWithGoogle, 
  logout, 
  getCurrentUser,
  validateToken
} from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';
import rateLimit from 'express-rate-limit';

// Create a more lenient rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});

// Fix type incompatibility with rate limiter
const typedAuthLimiter = authLimiter as unknown as express.RequestHandler;

const router = express.Router();

// Authentication endpoints with custom rate limiter
router.post('/login/email', typedAuthLimiter, loginWithEmail);
router.post('/login/google', typedAuthLimiter, loginWithGoogle);
router.post('/validate-token', typedAuthLimiter, validateToken);
router.post('/logout', authMiddleware.authenticate, logout);
router.get('/me', authMiddleware.authenticate, getCurrentUser);

export default router; 