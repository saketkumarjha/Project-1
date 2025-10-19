// src/services/cacheService.ts
import redisPool from '../config/redisPool';
import Redis from 'ioredis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
}

interface CacheInvalidationMessage {
  namespace: string;
  pattern: string;
  service: string;
}

interface BatchCacheItem {
  key: string;
  value: any;
  ttl?: number;
}

class CacheService {
  private serviceName: string;
  private redis: Redis | null = null;
  private defaultTTL: number = 3600; // 1 hour default

  constructor(serviceName: string = 'default-service') {
    this.serviceName = serviceName;
  }

  // Initialize Redis connection for this service
  async initialize(): Promise<void> {
    try {
      this.redis = await redisPool.getConnection(this.serviceName);
      console.log(`Cache service initialized for '${this.serviceName}'`);
    } catch (error) {
      console.error(`Failed to initialize cache service for '${this.serviceName}':`, error);
      throw error;
    }
  }

  // Ensure Redis connection is available
  private async ensureConnection(): Promise<Redis> {
    if (!this.redis || this.redis.status !== 'ready') {
      await this.initialize();
    }
    return this.redis!;
  }

  // Generate cache key with namespace
  private generateKey(key: string, namespace?: string): string {
    const prefix = process.env.NODE_ENV || 'dev';
    return namespace ? `${prefix}:${namespace}:${key}` : `${prefix}:${key}`;
  }

  // Set cache with TTL
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      const redis = await this.ensureConnection();
      const cacheKey = this.generateKey(key, options?.namespace);
      const serializedValue = JSON.stringify(value);
      const ttl = options?.ttl || this.defaultTTL;

      await redis.setex(cacheKey, ttl, serializedValue);
      console.log(`[${this.serviceName}] Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`[${this.serviceName}] Cache SET error:`, error);
      // Don't throw error - cache failure shouldn't break the app
    }
  }

  // Get from cache
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const redis = await this.ensureConnection();
      const cacheKey = this.generateKey(key, options?.namespace);
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        console.log(`[${this.serviceName}] Cache HIT: ${cacheKey}`);
        return JSON.parse(cached) as T;
      }
      
      console.log(`[${this.serviceName}] Cache MISS: ${cacheKey}`);
      return null;
    } catch (error) {
      console.error(`[${this.serviceName}] Cache GET error:`, error);
      return null; // Return null on error, let DB handle it
    }
  }

  // Delete specific cache key
  async delete(key: string, options?: CacheOptions): Promise<void> {
    try {
      const redis = await this.ensureConnection();
      const cacheKey = this.generateKey(key, options?.namespace);
      await redis.del(cacheKey);
      console.log(`[${this.serviceName}] Cache DELETE: ${cacheKey}`);
    } catch (error) {
      console.error(`[${this.serviceName}] Cache DELETE error:`, error);
    }
  }

  // Delete multiple keys by pattern
  async deleteByPattern(pattern: string, options?: CacheOptions): Promise<void> {
    try {
      const redis = await this.ensureConnection();
      const searchPattern = this.generateKey(pattern, options?.namespace);
      const keys = await redis.keys(searchPattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[${this.serviceName}] Cache DELETE PATTERN: ${searchPattern} (${keys.length} keys)`);
      }
    } catch (error) {
      console.error(`[${this.serviceName}] Cache DELETE PATTERN error:`, error);
    }
  }

  // Check if key exists
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const redis = await this.ensureConnection();
      const cacheKey = this.generateKey(key, options?.namespace);
      const result = await redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error(`[${this.serviceName}] Cache EXISTS error:`, error);
      return false;
    }
  }

  // Get TTL of a key
  async getTTL(key: string, options?: CacheOptions): Promise<number> {
    try {
      const redis = await this.ensureConnection();
      const cacheKey = this.generateKey(key, options?.namespace);
      return await redis.ttl(cacheKey);
    } catch (error) {
      console.error(`[${this.serviceName}] Cache TTL error:`, error);
      return -1;
    }
  }

  // Flush all cache (use carefully!)
  async flushAll(): Promise<void> {
    try {
      const redis = await this.ensureConnection();
      await redis.flushall();
      console.log(`[${this.serviceName}] All cache flushed`);
    } catch (error) {
      console.error(`[${this.serviceName}] Cache FLUSH error:`, error);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      return await redisPool.healthCheck(this.serviceName);
    } catch (error) {
      return false;
    }
  }

  // Batch operations with pipeline
  async setBatch(items: BatchCacheItem[], namespace?: string): Promise<void> {
    try {
      const redis = await this.ensureConnection();
      const pipeline = redis.pipeline();
      
      items.forEach(item => {
        const cacheKey = this.generateKey(item.key, namespace);
        const serializedValue = JSON.stringify(item.value);
        const ttl = item.ttl || this.defaultTTL;
        pipeline.setex(cacheKey, ttl, serializedValue);
      });
      
      await pipeline.exec();
      console.log(`[${this.serviceName}] Batch SET: ${items.length} items in namespace: ${namespace || 'default'}`);
    } catch (error) {
      console.error(`[${this.serviceName}] Cache BATCH SET error:`, error);
    }
  }

  // Get multiple keys at once
  async getBatch<T>(keys: string[], namespace?: string): Promise<{[key: string]: T | null}> {
    try {
      const redis = await this.ensureConnection();
      const cacheKeys = keys.map(key => this.generateKey(key, namespace));
      const values = await redis.mget(...cacheKeys);
      
      const result: {[key: string]: T | null} = {};
      keys.forEach((originalKey, index) => {
        const value = values[index];
        result[originalKey] = value ? JSON.parse(value) as T : null;
      });
      
      return result;
    } catch (error) {
      console.error(`[${this.serviceName}] Cache BATCH GET error:`, error);
      return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});
    }
  }

  // Publish event to Redis pub/sub (for cross-server communication)
  async publish(channel: string, data: any): Promise<void> {
    try {
      const redis = await this.ensureConnection();
      const message = JSON.stringify({
        timestamp: new Date().toISOString(),
        service: this.serviceName,
        data
      });
      
      await redis.publish(channel, message);
      console.log(`[${this.serviceName}] Published to channel '${channel}'`);
    } catch (error) {
      console.error(`[${this.serviceName}] Publish error:`, error);
    }
  }

  // Subscribe to Redis pub/sub channel
  async subscribe(channel: string, callback: (data: any) => void): Promise<void> {
    try {
      const redis = await this.ensureConnection();
      
      redis.subscribe(channel, (err, count) => {
        if (err) {
          console.error(`[${this.serviceName}] Subscribe error:`, err);
          return;
        }
        console.log(`[${this.serviceName}] Subscribed to ${count} channel(s)`);
      });

      redis.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage.data);
          } catch (error) {
            console.error(`[${this.serviceName}] Message parse error:`, error);
          }
        }
      });
    } catch (error) {
      console.error(`[${this.serviceName}] Subscribe setup error:`, error);
    }
  }

  // Publish cache invalidation event
  private async publishInvalidation(message: CacheInvalidationMessage): Promise<void> {
    try {
      await this.publish('cache:invalidate', message);
    } catch (error) {
      console.error(`[${this.serviceName}] Cache invalidation publish error:`, error);
    }
  }

  // Bills-specific cache methods
  async cacheBills(key: string, bills: any[], ttl: number = 300): Promise<void> {
    await this.set(key, bills, { namespace: 'bills', ttl });
  }

  async getCachedBills<T>(key: string): Promise<T | null> {
    return await this.get<T>(key, { namespace: 'bills' });
  }

  async invalidateBillsCache(pattern?: string): Promise<void> {
    const deletePattern = pattern || '*';
    await this.deleteByPattern(deletePattern, { namespace: 'bills' });
    
    // Notify other services about cache invalidation
    await this.publishInvalidation({
      namespace: 'bills',
      pattern: deletePattern,
      service: this.serviceName
    });
  }

  // Patient-specific cache methods
  async cachePatients(key: string, patients: any[], ttl: number = 300): Promise<void> {
    await this.set(key, patients, { namespace: 'patients', ttl });
  }

  async getCachedPatients<T>(key: string): Promise<T | null> {
    return await this.get<T>(key, { namespace: 'patients' });
  }

  async invalidatePatientsCache(pattern?: string): Promise<void> {
    const deletePattern = pattern || '*';
    await this.deleteByPattern(deletePattern, { namespace: 'patients' });
    
    // Notify other services about cache invalidation
    await this.publishInvalidation({
      namespace: 'patients',
      pattern: deletePattern,
      service: this.serviceName
    });
  }

  // Generic cache methods for other modules
  async cacheData(namespace: string, key: string, data: any[], ttl: number = 300): Promise<void> {
    await this.set(key, data, { namespace, ttl });
  }

  async getCachedData<T>(namespace: string, key: string): Promise<T | null> {
    return await this.get<T>(key, { namespace });
  }

  async invalidateCache(namespace: string, pattern?: string): Promise<void> {
    const deletePattern = pattern || '*';
    await this.deleteByPattern(deletePattern, { namespace });
    
    // Notify other services about cache invalidation
    await this.publishInvalidation({
      namespace,
      pattern: deletePattern,
      service: this.serviceName
    });
  }

  // Get cache statistics
  async getCacheStats(): Promise<object> {
    try {
      const redis = await this.ensureConnection();
      const info = await redis.info('memory');
      const keyspace = await redis.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        service: this.serviceName,
        connected: await this.healthCheck(),
        connectionInfo: redisPool.getConnectionInfo(this.serviceName),
        allConnections: redisPool.getConnectionInfo(),
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Cache STATS error:`, error);
      return {};
    }
  }

  // Get service name
  getServiceName(): string {
    return this.serviceName;
  }

  // Cleanup connection
  async cleanup(): Promise<void> {
    try {
      await redisPool.closeConnection(this.serviceName);
      this.redis = null;
      console.log(`[${this.serviceName}] Cache service cleaned up`);
    } catch (error) {
      console.error(`[${this.serviceName}] Cleanup error:`, error);
    }
  }
}

// Create instances for different services
const httpCacheService = new CacheService('http-server');
const socketCacheService = new CacheService('socket-server');

export default httpCacheService;
export { CacheService, httpCacheService, socketCacheService };