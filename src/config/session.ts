import session from 'express-session';
import RedisStore from 'connect-redis';  // ✅ Default import, not named import
import { createClient } from 'redis';

/**
 * Create Redis client for session storage
 * Separate from cache Redis client (uses different DB)
 */
export const createSessionStore = async () => {
  // Parse Redis URL from environment
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries: number) => {  // ✅ Added type annotation
        if (retries > 10) {
          console.error('Redis session client: Max reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  // Error handling
  redisClient.on('error', (err: Error) => {  // ✅ Added type annotation
    console.error('Redis Session Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis session store connected');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis session store ready');
  });

  // Connect to Redis
  await redisClient.connect();

  // Create Redis store
  return new RedisStore({
    client: redisClient,
    prefix: 'sess:', // Session keys: sess:xxxxx
    ttl: 604800, // 7 days in seconds
  });
};

/**
 * Session configuration
 */
export const getSessionConfig = (store: RedisStore): session.SessionOptions => ({
  store,
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-this',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on every response
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // For CORS
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
  },
  name: 'hospital.sid', // Custom session cookie name
});