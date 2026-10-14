import AppError from '../utils/AppError.js';

// validate(schema) -> parses req.body, replaces it with the cleaned data or raises 400.
const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(new AppError('Validation failed', 400, errors));
  }
  req.body = result.data;
  return next();
};

export default validate;
