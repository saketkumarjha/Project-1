// Global type declarations to resolve missing type definitions

declare module "@babel/core" {
  // Add minimal type declarations if needed
  export interface TransformOptions {
    [key: string]: any;
  }
}

// Extend global namespace if needed
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "staging";
      PORT: string;
      HOST: string;
      MONGODB_URI: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD?: string;
      REDIS_DB: string;
      JWT_SECRET: string;
      WEBSOCKET_CORS_ORIGIN: string;
      WEBSOCKET_MAX_CONNECTIONS: string;
      WEBSOCKET_HEARTBEAT_INTERVAL: string;
      WEBSOCKET_TIMEOUT: string;
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;
      RATE_LIMIT_BURST_LIMIT: string;
      CACHE_TTL_CRITICAL: string;
      CACHE_TTL_STANDARD: string;
      CACHE_TTL_HISTORICAL: string;
      CACHE_PREFIX: string;
      LOG_LEVEL: string;
      LOG_FILE: string;
      LOG_MAX_SIZE: string;
      LOG_MAX_FILES: string;
      MAX_MEMORY_USAGE: string;
      CPU_THRESHOLD: string;
      BATCH_SIZE: string;
      BATCH_INTERVAL: string;
      HEALTH_CHECK_INTERVAL: string;
      HEALTH_CHECK_TIMEOUT: string;
      METRICS_ENABLED: string;
      METRICS_INTERVAL: string;
      PERFORMANCE_MONITORING: string;
      ENABLE_HELMET: string;
      ENABLE_CORS: string;
      TRUST_PROXY: string;
      DEBUG_MODE: string;
      MOCK_DATA: string;
      SIMULATE_LOAD: string;
    }
  }
}

export {};
