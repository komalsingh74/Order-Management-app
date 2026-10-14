import dotenv from 'dotenv';

dotenv.config();

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food-delivery',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  simulateStatus: parseBoolean(process.env.SIMULATE_STATUS, true),
  statusStepMs: Number(process.env.STATUS_STEP_MS || 15000),
  adminApiKey: process.env.ADMIN_API_KEY || '',
};

export default env;