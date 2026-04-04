import ApiError from '../utils/ApiError.js';

/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent JSON responses
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error in development or test for debugging
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.error('Error in test:', err);
  }

  // ─── Mongoose Bad ObjectId ──────────────────────────────
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = ApiError.badRequest(message);
  }

  // ─── Mongoose Duplicate Key ─────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for '${field}'. This ${field} already exists.`;
    error = ApiError.conflict(message);
  }

  // ─── Mongoose Validation Error ──────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = ApiError.badRequest('Validation failed', messages);
  }

  // ─── JWT Errors ─────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token has expired');
  }

  // Send response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
