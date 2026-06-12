import dotenv from 'dotenv';

dotenv.config();

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) return ['http://localhost:5173'];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 8080),
  jwtSecret: process.env.JWT_SECRET ?? 'giftshop-dev-secret',
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? 'giftshop_session',
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
};
