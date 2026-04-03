import authService from '../services/auth.service.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Auth Controller
 * Thin controller layer — delegates to auth service
 */

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    ApiResponse.created(result, 'User registered successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    ApiResponse.success(result, 'Login successful').send(res);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh-token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    ApiResponse.success(tokens, 'Token refreshed successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    ApiResponse.success(null, 'Logged out successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    ApiResponse.success(user, 'User profile retrieved').send(res);
  } catch (error) {
    next(error);
  }
};
