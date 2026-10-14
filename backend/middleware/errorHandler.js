import env from '../config/env.js';
import AppError from '../utils/AppError.js';

const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// Converts known library errors into AppError so the response is consistent.
const normalizeError = (err) => {
  if (err instanceof AppError) return err;
  if (err.type === 'entity.parse.failed') return new AppError('Malformed JSON body', 400);
  if (err.type === 'entity.too.large') return new AppError('Request body too large', 413);
  if (err.name === 'CastError') return new AppError(`Invalid ${err.path}`, 400);
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new AppError('Validation failed', 400, errors);
  }
  if (err.code === 11000) return new AppError('Duplicate value', 409);
  return err;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const error = normalizeError(err);
  const statusCode = error.isOperational ? error.statusCode : 500;

  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : error.message,
    ...(error.errors && { errors: error.errors }),
    ...(env.nodeEnv === 'development' && statusCode === 500 && { stack: err.stack }),
  });
};

export { notFound, errorHandler };
