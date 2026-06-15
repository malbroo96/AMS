const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = header.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { student: true, school: true },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(error);
  }
};

module.exports = authMiddleware;
