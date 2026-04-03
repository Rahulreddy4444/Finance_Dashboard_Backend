import mongoose from 'mongoose';
import { TRANSACTION_TYPE_VALUES, CATEGORIES } from '../utils/constants.js';

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    type: {
      type: String,
      enum: {
        values: TRANSACTION_TYPE_VALUES,
        message: `Type must be one of: ${TRANSACTION_TYPE_VALUES.join(', ')}`,
      },
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes for Query Performance ──────────────────────────
transactionSchema.index({ type: 1, category: 1, date: -1 });
transactionSchema.index({ createdBy: 1 });
transactionSchema.index({ isDeleted: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
