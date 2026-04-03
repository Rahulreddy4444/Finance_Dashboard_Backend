import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

/**
 * Auth Service
 * Handles all authentication business logic
 */
class AuthService {
  /**
   * Generate JWT access token
   */
  generateAccessToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  /**
   * Generate both tokens and save refresh token to user doc
   */
  async generateTokens(user) {
    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user
   */
  async register({ name, email, password }) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('A user with this email already exists.');
    }

    // Create user (password is hashed by pre-save hook)
    const user = await User.create({ name, email, password });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      ...tokens,
    };
  }

  /**
   * Login user with email and password
   */
  async login({ email, password }) {
    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // Check if user is active
    if (user.status === 'inactive') {
      throw ApiError.forbidden('Your account has been deactivated. Contact an admin.');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(token) {
    if (!token) {
      throw ApiError.badRequest('Refresh token is required.');
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired refresh token.');
    }

    // Find user and check stored refresh token
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      throw ApiError.unauthorized('Invalid refresh token.');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    return tokens;
  }

  /**
   * Logout user by clearing refresh token
   */
  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  /**
   * Get current authenticated user profile
   */
  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return user;
  }
}

export default new AuthService();
