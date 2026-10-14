import env from '../config/env.js';
import AppError from '../utils/AppError.js';

// Protects "admin" endpoints (status updates). Disabled when ADMIN_API_KEY is empty.
const adminAuth = (req, _res, next) => {
  if (!env.adminApiKey) return next();
  if (req.get('x-admin-key') === env.adminApiKey) return next();
  return next(new AppError('Unauthorized: valid x-admin-key header required', 401));
};

export default adminAuth;
