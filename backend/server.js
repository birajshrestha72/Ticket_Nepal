/**
 * Server.js - Main entry point for Ticket Nepal backend
 * Express server setup with middleware and routes
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
// CORS - Frontend bata request accept garcha
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// JSON parser - Request body parse garcha
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development mode ma)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ===== ROUTES =====
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Ticket Nepal API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);

// 404 handler - Route na bhettiye
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}${API_PREFIX}`);
});

export default app;
