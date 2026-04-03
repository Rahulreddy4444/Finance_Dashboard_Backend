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

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get overall financial summary (income, expenses, balance)
 * @access  Viewer, Analyst, Admin
 */
router.get(
  '/summary',
  authorize(ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN),
  getSummary
);

/**
 * @route   GET /api/dashboard/category-summary
 * @desc    Get category-wise totals breakdown
 * @access  Analyst, Admin
 */
router.get(
  '/category-summary',
  authorize(ROLES.ANALYST, ROLES.ADMIN),
  getCategorySummary
);

/**
 * @route   GET /api/dashboard/trends
 * @desc    Get monthly income/expense trends (last 12 months)
 * @access  Analyst, Admin
 */
router.get(
  '/trends',
  authorize(ROLES.ANALYST, ROLES.ADMIN),
  getMonthlyTrends
);

/**
 * @route   GET /api/dashboard/recent
 * @desc    Get recent transactions
 * @access  Viewer, Analyst, Admin
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
