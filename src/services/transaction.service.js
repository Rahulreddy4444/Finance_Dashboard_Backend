import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import { PAGINATION } from '../utils/constants.js';

/**
 * Transaction Service
 * Handles financial record business logic
 */
class TransactionService {
  /**
   * Create a new financial record
   */
  async create(data, userId) {
    const transaction = await Transaction.create({
      ...data,
      createdBy: userId,
    });

    return transaction;
  }

  /**
   * Get all transactions with filtering, sorting, and pagination
   * Supports: date range, category, type filters
   */
  async getAll({ page, limit, type, category, startDate, endDate, sort, order }) {
    const currentPage = parseInt(page) || PAGINATION.DEFAULT_PAGE;
    const perPage = Math.min(parseInt(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (currentPage - 1) * perPage;

    // Build filter (exclude soft-deleted)
    const filter = { isDeleted: false };

    if (type) filter.type = type;
    if (category) filter.category = category;

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Build sort object
    const sortField = sort || 'date';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortField]: sortOrder };

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('createdBy', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(perPage),
      Transaction.countDocuments(filter),
    ]);

    return {
      transactions,
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
   * Get a single transaction by ID
   */
  async getById(id) {
    const transaction = await Transaction.findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'name email');

    if (!transaction) {
      throw ApiError.notFound('Transaction not found.');
    }

    return transaction;
  }

  /**
   * Update a transaction
   */
  async update(id, updateData) {
    // Only allow updating these fields
    const allowedFields = ['amount', 'type', 'category', 'description', 'date'];
    const filteredData = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, isDeleted: false },
      filteredData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!transaction) {
      throw ApiError.notFound('Transaction not found.');
    }

    return transaction;
  }

  /**
   * Soft delete a transaction
   */
  async softDelete(id) {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!transaction) {
      throw ApiError.notFound('Transaction not found.');
    }

    return transaction;
  }

  /**
   * Restore a soft-deleted transaction
   */
  async restore(id) {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { isDeleted: false },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!transaction) {
      throw ApiError.notFound('Deleted transaction not found.');
    }

    return transaction;
  }
}

export default new TransactionService();
