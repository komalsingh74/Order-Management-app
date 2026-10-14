import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import env from './config/env.js';
import routes from './routes/index.js';
import AppError from './utils/AppError.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // correct client IP behind Render/Railway proxies (rate limiting)

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header = curl/Postman/server-to-server; allow it.
      if (!origin || env.clientUrls.includes('*') || env.clientUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new AppError('Origin not allowed by CORS', 403));
    },
  })
);
app.use(express.json({ limit: '10kb' }));
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.nodeEnv === 'test',
  }),
  routes
);

app.use(notFound);
app.use(errorHandler);

export default app;
