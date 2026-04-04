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

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Financial record management (CRUD with soft delete)
 */

// All transaction routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a new financial record
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category]
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 example: 5000
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: income
 *               category:
 *                 type: string
 *                 enum: [salary, freelance, investment, business, food, transport, utilities, entertainment, health, education, shopping, rent, insurance, other]
 *                 example: salary
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Monthly salary
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-01"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin only
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
 * @swagger
 * /transactions:
 *   get:
 *     summary: List all transactions with filters, pagination, and sorting
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by transaction type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [salary, freelance, investment, business, food, transport, utilities, entertainment, health, education, shopping, rent, insurance, other]
 *         description: Filter by category
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (ISO 8601)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: date
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       403:
 *         description: Analyst or Admin only
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
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get a single transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
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
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Transaction updated
 *       403:
 *         description: Admin only
 *       404:
 *         description: Transaction not found
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
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Soft delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted (soft)
 *       403:
 *         description: Admin only
 *       404:
 *         description: Transaction not found
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
 * @swagger
 * /transactions/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction restored
 *       403:
 *         description: Admin only
 *       404:
 *         description: Deleted transaction not found
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
