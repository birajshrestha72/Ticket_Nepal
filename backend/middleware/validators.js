/**
 * Validation Middleware - Input validation using express-validator
 * Request data ko validation rules define garcha
 */

import { body, validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

/**
 * Validation result handler - Validation errors check garcha
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return next(new AppError(errorMessages, 400));
  }
  
  next();
};

/**
 * Registration validation rules
 */
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required (Naam aavashyak cha)')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3-100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[9][0-9]{9}$/)
    .withMessage('Invalid Nepal phone number (Must start with 9 and be 10 digits)'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters (Kam se kam 6 characters)'),
  
  body('role')
    .optional()
    .isIn(['customer', 'vendor'])
    .withMessage('Invalid role (Only customer or vendor allowed)'),
  
  validate
];

/**
 * Login validation rules
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate
];

/**
 * Google OAuth validation rules
 */
export const googleAuthValidation = [
  body('idToken')
    .notEmpty()
    .withMessage('Firebase ID token is required'),
  
  body('role')
    .optional()
    .isIn(['customer', 'vendor'])
    .withMessage('Invalid role'),
  
  validate
];

/**
 * Update profile validation rules
 */
export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3-100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[9][0-9]{9}$/)
    .withMessage('Invalid Nepal phone number'),
  
  validate
];
