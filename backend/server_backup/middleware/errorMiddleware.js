const AppError = require('../utils/AppError');

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with this value already exists';
  }

  if (err.isJoi) {
    statusCode = 400;
    message = err.details.map((d) => d.message).join(', ');
  }

  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
