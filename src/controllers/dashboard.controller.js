import dashboardService from '../services/dashboard.service.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Dashboard Controller
 * Handles HTTP layer for dashboard analytics endpoints
 */

// GET /api/dashboard/summary
export const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary();
    ApiResponse.success(summary, 'Dashboard summary retrieved').send(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/category-summary
export const getCategorySummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getCategorySummary();
    ApiResponse.success(data, 'Category summary retrieved').send(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/trends
export const getMonthlyTrends = async (req, res, next) => {
  try {
    const data = await dashboardService.getMonthlyTrends();
    ApiResponse.success(data, 'Monthly trends retrieved').send(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/recent
export const getRecentActivity = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const data = await dashboardService.getRecentActivity(limit);
    ApiResponse.success(data, 'Recent activity retrieved').send(res);
  } catch (error) {
    next(error);
  }
};
