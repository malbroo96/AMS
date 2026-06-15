const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const UserModel = require('../models/User.model');

/**
 * Validates JWT and attaches user (without password) to req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new ApiError('Authentication required', 401);
    }

    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      throw new ApiError('User not found', 401);
    }

    // College admins must be approved (isActive) before accessing protected routes
    if (user.role === 'college' && !user.isActive) {
      throw new ApiError('Your account is pending super admin approval', 403);
    }

    const { passwordHash, ...rest } = user;
    req.user = {
      id: rest.id,
      name: rest.name,
      email: rest.email,
      phone: rest.phone,
      role: rest.role,
      isActive: !!rest.isActive,
      createdAt: rest.created_at,
    };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError('Invalid or expired token', 401));
    }
    next(error);
  }
};

module.exports = authMiddleware;
