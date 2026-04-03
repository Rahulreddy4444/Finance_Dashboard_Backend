import Transaction from '../models/Transaction.js';

/**
 * Dashboard Service
 * MongoDB aggregation pipelines for analytics and summary data
 */
class DashboardService {
  /**
   * Get overall financial summary
   * Returns: total income, total expenses, net balance, transaction count
   */
  async getSummary() {
    const result = await Transaction.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
          totalTransactions: { $sum: 1 },
          incomeCount: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, 1, 0] },
          },
          expenseCount: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalIncome: { $round: ['$totalIncome', 2] },
          totalExpenses: { $round: ['$totalExpenses', 2] },
          netBalance: {
            $round: [{ $subtract: ['$totalIncome', '$totalExpenses'] }, 2],
          },
          totalTransactions: 1,
          incomeCount: 1,
          expenseCount: 1,
        },
      },
    ]);

    return (
      result[0] || {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        totalTransactions: 0,
        incomeCount: 0,
        expenseCount: 0,
      }
    );
  }

  /**
   * Get category-wise breakdown
   * Returns totals grouped by category and type
   */
  async getCategorySummary() {
    const result = await Transaction.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.category',
          breakdown: {
            $push: {
              type: '$_id.type',
              total: { $round: ['$total', 2] },
              count: '$count',
            },
          },
          grandTotal: { $sum: '$total' },
          totalCount: { $sum: '$count' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          grandTotal: { $round: ['$grandTotal', 2] },
          totalCount: 1,
          breakdown: 1,
        },
      },
      { $sort: { grandTotal: -1 } },
    ]);

    return result;
  }

  /**
   * Get monthly trends for the last 12 months
   * Returns income and expenses per month
   */
  async getMonthlyTrends() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const result = await Transaction.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          income: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          expenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          income: { $round: ['$income', 2] },
          expenses: { $round: ['$expenses', 2] },
          net: {
            $round: [{ $subtract: ['$income', '$expenses'] }, 2],
          },
          count: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    return result;
  }

  /**
   * Get recent transactions
   * Returns the last N transactions (default 10)
   */
  async getRecentActivity(limit = 10) {
    const transactions = await Transaction.find({ isDeleted: false })
      .populate('createdBy', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit));

    return transactions;
  }
}

export default new DashboardService();
