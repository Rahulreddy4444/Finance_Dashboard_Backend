import transactionService from '../services/transaction.service.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Transaction Controller
 * Handles HTTP layer for financial record operations
 */

// POST /api/transactions
export const createTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.create(req.body, req.user.id);
    ApiResponse.created(transaction, 'Transaction created successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions
export const getAllTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.getAll(req.query);
    ApiResponse.success(result, 'Transactions retrieved successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions/:id
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getById(req.params.id);
    ApiResponse.success(transaction, 'Transaction retrieved successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// PUT /api/transactions/:id
export const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.update(req.params.id, req.body);
    ApiResponse.success(transaction, 'Transaction updated successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/transactions/:id
export const deleteTransaction = async (req, res, next) => {
  try {
    await transactionService.softDelete(req.params.id);
    ApiResponse.noContent('Transaction deleted successfully').send(res);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/transactions/:id/restore
export const restoreTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.restore(req.params.id);
    ApiResponse.success(transaction, 'Transaction restored successfully').send(res);
  } catch (error) {
    next(error);
  }
};
