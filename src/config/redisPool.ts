// src/config/redisPool.ts
import Redis, { RedisOptions } from 'ioredis';
import { EventEmitter } from 'eventemitter3';

interface RedisConnectionConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  url?: string;
}

class RedisConnectionPool extends EventEmitter {
  private connections: Map<string, Redis> = new Map();
  private config: RedisOptions;
  private defaultConfig: RedisOptions;

  constructor(config?: RedisConnectionConfig) {
    super();
    
    // Default Redis configuration
    this.defaultConfig = {
      host: config?.host || process.env.REDIS_HOST || 'localhost',
      port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: config?.password || process.env.REDIS_PASSWORD,
      db: config?.db || parseInt(process.env.REDIS_DB || '0'),
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 60000,
      commandTimeout: 5000,
      // Connection pool settings
      family: 4,
      // retryInterval: 500,
    };

    // Use URL if provided, otherwise use individual config
    if (config?.url || process.env.REDIS_URL) {
      this.config = {
        ...this.defaultConfig,
        // ioredis will parse the URL automatically
      };
    } else {
      this.config = this.defaultConfig;
    }
  }

  // Create a new Redis connection for a specific service
  async createConnection(serviceName: string): Promise<Redis> {
    try {
      // Check if connection already exists
      if (this.connections.has(serviceName)) {
        const existingConnection = this.connections.get(serviceName)!;
        if (existingConnection.status === 'ready' || existingConnection.status === 'connecting') {
          return existingConnection;
        }
        // Clean up old connection if it's not working
        await this.closeConnection(serviceName);
      }

      // Create new connection
      let redis: Redis;
      if (process.env.REDIS_URL) {
        redis = new Redis(process.env.REDIS_URL, this.config);
      } else {
        redis = new Redis(this.config);
      }

      // Setup event handlers
      this.setupConnectionHandlers(redis, serviceName);

      // Connect and store
      await redis.connect();
      this.connections.set(serviceName, redis);

      console.log(`Redis connection '${serviceName}' established`);
      this.emit('connection:created', serviceName);

      return redis;
    } catch (error) {
      console.error(`Failed to create Redis connection '${serviceName}':`, error);
      this.emit('connection:error', serviceName, error);
      throw error;
    }
  }

  // Get existing connection or create new one
  async getConnection(serviceName: string): Promise<Redis> {
    const connection = this.connections.get(serviceName);
    
    if (connection && (connection.status === 'ready' || connection.status === 'connecting')) {
      return connection;
    }

    // Create new connection if none exists or current one is not working
    return await this.createConnection(serviceName);
  }

  // Setup event handlers for a connection
  private setupConnectionHandlers(redis: Redis, serviceName: string): void {
    redis.on('connect', () => {
      console.log(`Redis '${serviceName}' connecting...`);
      this.emit('connection:connecting', serviceName);
    });

    redis.on('ready', () => {
      console.log(`Redis '${serviceName}' ready`);
      this.emit('connection:ready', serviceName);
    });

    redis.on('error', (err) => {
      console.error(`Redis '${serviceName}' error:`, err);
      this.emit('connection:error', serviceName, err);
    });

    redis.on('close', () => {
      console.log(`Redis '${serviceName}' connection closed`);
      this.emit('connection:closed', serviceName);
    });

    redis.on('reconnecting', () => {
      console.log(`Redis '${serviceName}' reconnecting...`);
      this.emit('connection:reconnecting', serviceName);
    });
  }

  // Close specific connection
  async closeConnection(serviceName: string): Promise<void> {
    try {
      const connection = this.connections.get(serviceName);
      if (connection) {
        await connection.quit();
        this.connections.delete(serviceName);
        console.log(`Redis connection '${serviceName}' closed`);
        this.emit('connection:closed', serviceName);
      }
    } catch (error) {
      console.error(`Error closing Redis connection '${serviceName}':`, error);
    }
  }

  // Close all connections
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.connections.keys()).map(serviceName =>
      this.closeConnection(serviceName)
    );
    
    await Promise.all(closePromises);
    console.log('All Redis connections closed');
    this.emit('pool:closed');
  }

  // Health check for specific connection
  async healthCheck(serviceName: string): Promise<boolean> {
    try {
      const connection = this.connections.get(serviceName);
      if (!connection || connection.status !== 'ready') {
        return false;
      }
      
      const result = await connection.ping();
      return result === 'PONG';
    } catch (error) {
      console.error(`Health check failed for '${serviceName}':`, error);
      return false;
    }
  }

  // Health check for all connections
  async healthCheckAll(): Promise<{[serviceName: string]: boolean}> {
    const results: {[serviceName: string]: boolean} = {};
    
    for (const serviceName of this.connections.keys()) {
      results[serviceName] = await this.healthCheck(serviceName);
    }
    
    return results;
  }

  // Get connection info
  getConnectionInfo(serviceName?: string): object {
    if (serviceName) {
      const connection = this.connections.get(serviceName);
      if (connection) {
        return {
          service: serviceName,
          status: connection.status,
          host: connection.options.host,
          port: connection.options.port,
          db: connection.options.db,
        };
      }
      return { service: serviceName, status: 'not_found' };
    }

    // Return info for all connections
    const allInfo: {[key: string]: object} = {};
    for (const [name, connection] of this.connections) {
      allInfo[name] = {
        service: name,
        status: connection.status,
        host: connection.options.host,
        port: connection.options.port,
        db: connection.options.db,
      };
    }
    return allInfo;
  }

  // Get all active connection names
  getActiveConnections(): string[] {
    return Array.from(this.connections.keys()).filter(name => {
      const connection = this.connections.get(name);
      return connection && connection.status === 'ready';
    });
  }
}

// Create global pool instance
const redisPool = new RedisConnectionPool();

export default redisPool;
export { RedisConnectionPool };