import userService from '../services/user.service.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * User Controller
 * Handles HTTP layer for user management (Admin only)
 */

// GET /api/users
export const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query);
    ApiResponse.success(result, 'Users retrieved successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    ApiResponse.success(user, 'User retrieved successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    ApiResponse.success(user, 'User updated successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/role
export const updateUserRole = async (req, res, next) => {
  try {
    const user = await userService.updateUserRole(req.params.id, req.body.role);
    ApiResponse.success(user, 'User role updated successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/status
export const updateUserStatus = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, req.body.status);
    ApiResponse.success(user, 'User status updated successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user.id);
    ApiResponse.noContent('User deleted successfully').send(res);
  } catch (error) {
    next(error);
  }
};
