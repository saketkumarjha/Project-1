import session from 'express-session';
import RedisStore from 'connect-redis';
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
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          console.error('Redis session client: Max reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  // Error handling
  redisClient.on('error', (err: Error) => {
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

  // Create Redis store - RedisStore is a factory function that returns a class
  const RedisStoreClass = RedisStore(session);
  return new RedisStoreClass({
    client: redisClient as any, // Type workaround for redis v4 compatibility
    prefix: 'sess:',
    ttl: 604800,
  });
};

/**
 * Session configuration
 */
export const getSessionConfig = (store: session.Store): session.SessionOptions => ({
  store,
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-this',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
  },
  name: 'hospital.sid',
});