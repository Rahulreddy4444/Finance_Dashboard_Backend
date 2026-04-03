import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { PAGINATION } from '../utils/constants.js';

/**
 * User Service
 * Handles user management business logic (Admin operations)
 */
class UserService {
  /**
   * Get all users with filtering, search, and pagination
   */
  async getAllUsers({ page, limit, search, role, status }) {
    const currentPage = parseInt(page) || PAGINATION.DEFAULT_PAGE;
    const perPage = Math.min(parseInt(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (currentPage - 1) * perPage;

    // Build filter query
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;

    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        currentPage,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        hasNextPage: currentPage * perPage < total,
        hasPrevPage: currentPage > 1,
      },
    };
  }

  /**
   * Get a single user by ID
   */
  async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return user;
  }

  /**
   * Update user details (name, email)
   */
  async updateUser(id, updateData) {
    // Prevent updating sensitive fields directly
    const allowedFields = ['name', 'email'];
    const filteredData = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }

    const user = await User.findByIdAndUpdate(id, filteredData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  }

  /**
   * Update user role
   */
  async updateUserRole(id, role) {
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  }

  /**
   * Update user status (active/inactive)
   */
  async updateUserStatus(id, status) {
    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  }

  /**
   * Delete user permanently
   */
  async deleteUser(id, currentUserId) {
    // Prevent self-deletion
    if (id === currentUserId.toString()) {
      throw ApiError.badRequest('You cannot delete your own account.');
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  }
}

export default new UserService();
