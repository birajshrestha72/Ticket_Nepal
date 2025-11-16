/**
 * Auth Controller - Authentication logic
 * Login, Register, Google OAuth handling
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { verifyIdToken } from '../config/firebase.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.user_id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user (Email/Password)
 * @access  Public
 */
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, phone, password, role = 'customer' } = req.body;

  // Check if user already exists
  const existingUser = await query(
    'SELECT user_id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('Email already registered (Yo email pahile nai register cha)', 409);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Insert new user
  const result = await query(
    `INSERT INTO users (name, email, phone, password_hash, role, auth_provider, is_active)
     VALUES ($1, $2, $3, $4, $5, 'email', true)
     RETURNING user_id, name, email, phone, role, created_at`,
    [name, email, phone || null, hashedPassword, role]
  );

  const user = result.rows[0];

  // Generate token
  const token = generateToken(user);

  res.status(201).json({
    status: 'success',
    message: 'Registration successful (Safalta purvak darta bhayo)',
    data: {
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      },
      token
    }
  });
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user (Email/Password)
 * @access  Public
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email
  const result = await query(
    `SELECT user_id, name, email, phone, password_hash, role, is_active, auth_provider
     FROM users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password (Email ya password milena)', 401);
  }

  const user = result.rows[0];

  // Check if account is active
  if (!user.is_active) {
    throw new AppError('Account is deactivated. Contact support.', 403);
  }

  // Check if user registered with email/password
  if (user.auth_provider !== 'email') {
    throw new AppError(`Please login with ${user.auth_provider}`, 400);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password (Email ya password milena)', 401);
  }

  // Update last login
  await query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
    [user.user_id]
  );

  // Generate token
  const token = generateToken(user);

  res.json({
    status: 'success',
    message: 'Login successful (Safalta purvak login bhayo)',
    data: {
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    }
  });
});

/**
 * @route   POST /api/v1/auth/google
 * @desc    Google OAuth login/register
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res, next) => {
  const { idToken, role = 'customer' } = req.body;

  // Verify Firebase ID token
  let decodedToken;
  try {
    decodedToken = await verifyIdToken(idToken);
  } catch (error) {
    throw new AppError('Invalid Google token', 401);
  }

  const { email, name, picture, uid } = decodedToken;

  if (!email) {
    throw new AppError('Email not provided by Google', 400);
  }

  // Check if user exists
  let result = await query(
    `SELECT user_id, name, email, phone, role, is_active
     FROM users WHERE email = $1`,
    [email]
  );

  let user;

  if (result.rows.length > 0) {
    // Existing user - login
    user = result.rows[0];

    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403);
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );
  } else {
    // New user - register
    result = await query(
      `INSERT INTO users (name, email, role, auth_provider, firebase_uid, is_active)
       VALUES ($1, $2, $3, 'google', $4, true)
       RETURNING user_id, name, email, phone, role, created_at`,
      [name, email, role, uid]
    );

    user = result.rows[0];
  }

  // Generate token
  const token = generateToken(user);

  res.json({
    status: 'success',
    message: 'Google authentication successful',
    data: {
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    }
  });
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res, next) => {
  const result = await query(
    `SELECT user_id, name, email, phone, role, auth_provider, created_at, last_login
     FROM users WHERE user_id = $1`,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];

  res.json({
    status: 'success',
    data: {
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        authProvider: user.auth_provider,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    }
  });
});

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone } = req.body;
  const updates = [];
  const values = [];
  let paramCount = 1;

  // Build dynamic update query
  if (name) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }

  if (phone) {
    updates.push(`phone = $${paramCount++}`);
    values.push(phone);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  // Add user_id as last parameter
  values.push(req.user.id);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $${paramCount}
     RETURNING user_id, name, email, phone, role`,
    values
  );

  res.json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: result.rows[0]
    }
  });
});
