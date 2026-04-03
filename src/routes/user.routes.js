import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { ROLES, ROLE_VALUES, STATUS_VALUES } from '../utils/constants.js';

const router = Router();

// All user management routes require authentication + admin role
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

/**
 * @route   GET /api/users
 * @desc    Get all users (with pagination, search, filters)
 * @access  Admin
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 * @access  Admin
 */
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    validate,
  ],
  getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user details (name, email)
 * @access  Admin
 */
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Please provide a valid email'),
    validate,
  ],
  updateUser
);

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Update user role
 * @access  Admin
 */
router.patch(
  '/:id/role',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(ROLE_VALUES).withMessage(`Role must be one of: ${ROLE_VALUES.join(', ')}`),
    validate,
  ],
  updateUserRole
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user status (active/inactive)
 * @access  Admin
 */
router.patch(
  '/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(STATUS_VALUES).withMessage(`Status must be one of: ${STATUS_VALUES.join(', ')}`),
    validate,
  ],
  updateUserStatus
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Admin
 */
router.delete(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    validate,
  ],
  deleteUser
);

export default router;
