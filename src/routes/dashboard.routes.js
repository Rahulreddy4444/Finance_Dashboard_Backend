import { Router } from 'express';
import { query } from 'express-validator';
import {
  getSummary,
  getCategorySummary,
  getMonthlyTrends,
  getRecentActivity,
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Analytics and summary endpoints
 */

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get overall financial summary (income, expenses, balance)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved
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
 *                     totalIncome:
 *                       type: number
 *                       example: 29750
 *                     totalExpenses:
 *                       type: number
 *                       example: 6545
 *                     netBalance:
 *                       type: number
 *                       example: 23205
 *                     totalTransactions:
 *                       type: integer
 *                       example: 32
 *                     incomeCount:
 *                       type: integer
 *                       example: 10
 *                     expenseCount:
 *                       type: integer
 *                       example: 22
 */
router.get(
  '/summary',
  authorize(ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN),
  getSummary
);

/**
 * @swagger
 * /dashboard/category-summary:
 *   get:
 *     summary: Get category-wise totals breakdown
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category summary retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         example: salary
 *                       grandTotal:
 *                         type: number
 *                         example: 20000
 *                       totalCount:
 *                         type: integer
 *                         example: 4
 *                       breakdown:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               example: income
 *                             total:
 *                               type: number
 *                               example: 20000
 *                             count:
 *                               type: integer
 *                               example: 4
 *       403:
 *         description: Analyst or Admin only
 */
router.get(
  '/category-summary',
  authorize(ROLES.ANALYST, ROLES.ADMIN),
  getCategorySummary
);

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     summary: Get monthly income/expense trends (last 12 months)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly trends retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       year:
 *                         type: integer
 *                         example: 2026
 *                       month:
 *                         type: integer
 *                         example: 1
 *                       income:
 *                         type: number
 *                         example: 6200
 *                       expenses:
 *                         type: number
 *                         example: 2100
 *                       net:
 *                         type: number
 *                         example: 4100
 *                       count:
 *                         type: integer
 *                         example: 8
 *       403:
 *         description: Analyst or Admin only
 */
router.get(
  '/trends',
  authorize(ROLES.ANALYST, ROLES.ADMIN),
  getMonthlyTrends
);

/**
 * @swagger
 * /dashboard/recent:
 *   get:
 *     summary: Get recent transactions
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Number of recent transactions to return
 *     responses:
 *       200:
 *         description: Recent activity retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 */
router.get(
  '/recent',
  authorize(ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN),
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
    validate,
  ],
  getRecentActivity
);

export default router;
