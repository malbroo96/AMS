const ApiError = require('../utils/ApiError');

/**
 * Restrict route access to specific roles.
 * Usage: roleMiddleware('super_admin', 'school_admin')
 */
const roleMiddleware = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError('Authentication required', 401));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError('You do not have permission to perform this action', 403));
  }
  next();
};

module.exports = roleMiddleware;
