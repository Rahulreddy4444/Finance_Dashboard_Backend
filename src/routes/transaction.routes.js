import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  restoreTransaction,
} from '../controllers/transaction.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { ROLES, TRANSACTION_TYPE_VALUES, CATEGORIES } from '../utils/constants.js';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/transactions
 * @desc    Create a new financial record
 * @access  Admin
 */
router.post(
  '/',
  authorize(ROLES.ADMIN),
  [
    body('amount')
      .notEmpty().withMessage('Amount is required')
      .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('type')
      .notEmpty().withMessage('Type is required')
      .isIn(TRANSACTION_TYPE_VALUES).withMessage(`Type must be one of: ${TRANSACTION_TYPE_VALUES.join(', ')}`),
    body('category')
      .notEmpty().withMessage('Category is required')
      .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('date')
      .optional()
      .isISO8601().withMessage('Date must be a valid ISO 8601 date'),
    validate,
  ],
  createTransaction
);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions (with filters, pagination, sorting)
 * @access  Analyst, Admin
 */
router.get(
  '/',
  authorize(ROLES.ANALYST, ROLES.ADMIN),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('type').optional().isIn(TRANSACTION_TYPE_VALUES).withMessage(`Invalid type filter`),
    query('category').optional().isIn(CATEGORIES).withMessage('Invalid category filter'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601'),
    validate,
  ],
  getAllTransactions
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get a single transaction
 * @access  Analyst, Admin
 */
router.get(
  '/:id',
  authorize(ROLES.ANALYST, ROLES.ADMIN),
  [
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    validate,
  ],
  getTransactionById
);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update a transaction
 * @access  Admin
 */
router.put(
  '/:id',
  authorize(ROLES.ADMIN),
  [
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    body('amount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('type')
      .optional()
      .isIn(TRANSACTION_TYPE_VALUES).withMessage(`Type must be one of: ${TRANSACTION_TYPE_VALUES.join(', ')}`),
    body('category')
      .optional()
      .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('date')
      .optional()
      .isISO8601().withMessage('Date must be a valid ISO 8601 date'),
    validate,
  ],
  updateTransaction
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Soft delete a transaction
 * @access  Admin
 */
router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  [
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    validate,
  ],
  deleteTransaction
);

/**
 * @route   PATCH /api/transactions/:id/restore
 * @desc    Restore a soft-deleted transaction
 * @access  Admin
 */
router.patch(
  '/:id/restore',
  authorize(ROLES.ADMIN),
  [
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    validate,
  ],
  restoreTransaction
);

export default router;
