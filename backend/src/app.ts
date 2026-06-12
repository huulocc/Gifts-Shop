import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { apiRoutes } from './routes';
import { sendData } from './utils/apiResponse';

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS origin ${origin} is not allowed.`));
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    sendData(res, {
      status: 'ok',
      service: 'giftshop-backend',
      stack: 'express-typescript-prisma',
    });
  });

  app.use('/api', apiRoutes());
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
