import ApiError from '../utils/ApiError.js';

/**
 * Role-Based Access Control Middleware
 * Factory function that returns middleware checking user role
 *
 * @param  {...string} allowedRoles - Roles permitted to access the route
 * @returns {Function} Express middleware
 *
 * Usage: authorize('admin', 'analyst')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized for this action. Required: ${allowedRoles.join(' or ')}.`
        )
      );
    }

    next();
  };
};
