/**
 * Auth Routes - Authentication endpoints
 * Login, Register, Google OAuth routes
 */

import express from 'express';
import {
  register,
  login,
  googleAuth,
  getProfile,
  updateProfile
} from '../controllers/authController.js';
import {
  registerValidation,
  loginValidation,
  googleAuthValidation,
  updateProfileValidation
} from '../middleware/validators.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===== PUBLIC ROUTES =====
/**
 * POST /api/v1/auth/register
 * Register new user with email/password
 */
router.post('/register', registerValidation, register);

/**
 * POST /api/v1/auth/login
 * Login with email/password
 */
router.post('/login', loginValidation, login);

/**
 * POST /api/v1/auth/google
 * Google OAuth login/register
 */
router.post('/google', googleAuthValidation, googleAuth);

// ===== PROTECTED ROUTES =====
/**
 * GET /api/v1/auth/me
 * Get current user profile (requires token)
 */
router.get('/me', verifyToken, getProfile);

/**
 * PUT /api/v1/auth/profile
 * Update user profile (requires token)
 */
router.put('/profile', verifyToken, updateProfileValidation, updateProfile);

export default router;
