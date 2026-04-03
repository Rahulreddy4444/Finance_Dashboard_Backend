import { validationResult } from 'express-validator';

/**
 * Validation Middleware
 * Processes express-validator results and returns formatted errors
 * Place this after validation chain in route definitions
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
    });
  }

  next();
};
