const ApiError = require('../utils/ApiError');

/**
 * Global error handler — never leak stack traces in production.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.number === 2627 || err.number === 2601) {
    statusCode = 409;
    message = 'A record with this value already exists';
  }

  if (err.isJoi) {
    statusCode = 400;
    message = err.details.map((d) => d.message).join(', ');
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File size must not exceed 5 MB' : err.message;
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

module.exports = errorHandler;
