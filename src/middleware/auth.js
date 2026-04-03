import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

/**
 * Authentication Middleware
 * Extracts and verifies JWT from Authorization header
 * Attaches user data to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('Access denied. Invalid token format.');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and check if they still exist and are active
    const user = await User.findById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized('User belonging to this token no longer exists.');
    }

    if (user.status === 'inactive') {
      throw ApiError.forbidden('Your account has been deactivated. Contact an admin.');
    }

    // Attach user to request
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token has expired. Please login again.'));
    }
    next(error);
  }
};
