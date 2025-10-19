import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import connectDB from "./config/database";
import corsMiddleware from "./middleware/cors";
import { errorHandler, notFound } from "./middleware/errorHandler";

// Redis Connection Pool and Cache Service imports
import redisPool from "./config/redisPool";
import { httpCacheService } from "./services/cacheService";
import { createSessionStore, getSessionConfig } from "./config/session";

// Load environment variables first before any other imports that might use them
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Initialize MongoDB Database Connection
 * Establishes connection to MongoDB using the configuration from database.ts
 */
connectDB();

/**
 * Initialize Redis Connection Pool for Caching and Sessions
 * Sets up Redis connections for different services (HTTP, Socket.io, Sessions)
 * Handles connection pooling, health monitoring, and cross-service communication
 */
const initializeRedis = async () => {
  try {
    // Create Redis connection for HTTP server cache
    const redisConnection = await redisPool.getConnection("http-server");
    console.log("✅ HTTP server Redis connection established");

    // Listen for connection pool events to monitor Redis health
    redisPool.on("connection:created", (serviceName) => {
      console.log(`📡 New Redis connection created for: ${serviceName}`);
    });

    redisPool.on("connection:error", (serviceName, error) => {
      console.error(`❌ Redis connection error for ${serviceName}:`, error);
    });

    redisPool.on("connection:closed", (serviceName) => {
      console.log(`🔌 Redis connection closed for: ${serviceName}`);
    });

    redisPool.on("connection:ready", (serviceName) => {
      console.log(`✅ Redis connection ready for: ${serviceName}`);
    });

    redisPool.on("connection:reconnecting", (serviceName) => {
      console.log(`🔄 Redis reconnecting for: ${serviceName}`);
    });
  } catch (error) {
    console.error(
      "⚠️ Redis initialization failed. Running without cache:",
      error
    );
    // Application continues to work without Redis cache
    // All cache operations will gracefully degrade to database-only operations
  }
};

/**
 * Initialize Session Store
 * Creates Redis-backed session store for session-based authentication
 * This must be initialized before session middleware is used
 */
const initializeSessions = async () => {
  try {
    console.log("🔐 Initializing Redis session store...");
    const sessionStore = await createSessionStore();

    // Configure session middleware with Redis store
    app.use(session(getSessionConfig(sessionStore)));

    console.log("✅ Redis session store initialized successfully");
    return true;
  } catch (error) {
    console.error("⚠️ Redis session store initialization failed:", error);
    console.error("⚠️ Sessions will not persist across server restarts");

    // Fallback to memory store (not recommended for production)
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "fallback-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        },
      })
    );

    return false;
  }
};

/**
 * Core Express Middleware Setup
 * Order matters: CORS must be before other middleware that might send responses
 */
app.use(corsMiddleware); // Handle Cross-Origin Resource Sharing

app.use(express.json()); // Parse JSON request bodies

/**
 * URL-encoded body parser middleware
 * When extended is set to true, the middleware uses the qs library to support
 * advanced parsing, such as handling nested data like:
 * user[name]=John&user[address][city]=NewYork
 * Result: req.body = { user: { name: 'John', address: { city: 'NewYork' } } }
 *
 * In contrast, extended: false limits parsing to flat key-value pairs or arrays
 * using the querystring library, so nested structures might not be handled
 * properly and could be treated as strings.
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Import Route Modules
 * Routes are imported after middleware setup to ensure they have access
 * to parsed request bodies and other middleware functionality
 */
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import billingRoutes from "./routes/billing";
import reportsRoutes from "./routes/reports";
import patientRoutes from "./routes/patients";
import appointmentRoutes from "./routes/appointments";
import workflowRoutes from "./routes/workflows";
import roomRoutes from "./routes/rooms";

/**
 * Authentication and Authorization Routes
 * Handle user login, logout, token refresh, and role-based access
 */

app.use("/api/auth", authRoutes);

/**
 * Admin Management Routes
 * Administrative functions, user management, system configuration
 */
app.use("/api/admin", adminRoutes);

/**
 * Business Logic Routes with Redis Caching
 * Each route group uses Redis caching middleware for performance optimization
 * Cache strategy: Cache-first for reads, invalidate-on-write for data consistency
 */

// Billing Management with Redis Cache
// Handles invoices, payments, billing history with 5-minute cache TTL
app.use("/api/billing", billingRoutes);

// Report Management with Redis Cache
// Analytics, financial reports, usage statistics with longer cache TTL
app.use("/api/reports", reportsRoutes);

// Patient Management with Redis Cache
// Patient records, medical history, demographics with moderate cache TTL
app.use("/api/patients", patientRoutes);

// Appointment Management with Redis Cache
// Scheduling, calendar operations, availability with short cache TTL (data changes frequently)
app.use("/api/appointments", appointmentRoutes);

// Workflow Management with Redis Cache
// Business process workflows, task management, approval chains
app.use("/api/workflows", workflowRoutes);

// Room Management with Redis Cache
// Hospital rooms, bed management, occupancy tracking with real-time updates
app.use("/api/rooms", roomRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Hospital API Server",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});
/**
 * Health Check Endpoint
 * Provides comprehensive system health information including:
 * - Server status
 * - Database connectivity
 * - Redis connection pool health
 * - Cache service status
 * - Session store status
 * - Connection details for monitoring
 */
app.get("/api/health", async (req, res) => {
  try {
    // Check all Redis connections in the pool
    const redisHealth = await redisPool.healthCheckAll();
    const cacheStats = await httpCacheService.getCacheStats();
    const activeConnections = redisPool.getActiveConnections();
    const connectionInfo = redisPool.getConnectionInfo();

    // Check if session store is working
    const sessionHealthy = req.session !== undefined;

    // Return comprehensive health information
    res.json({
      success: true,
      message: "Server health check completed",
      data: {
        server: {
          status: "healthy",
          port: PORT,
          environment: process.env.NODE_ENV || "development",
          uptime: process.uptime(),
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            unit: "MB",
          },
          timestamp: new Date().toISOString(),
        },
        database: {
          mongodb: "connected",
          // Add actual DB health check if available
        },
        cache: {
          redis: {
            health: redisHealth,
            activeConnections: activeConnections,
            connectionInfo: connectionInfo,
            stats: cacheStats,
          },
        },
        session: {
          store: sessionHealthy ? "redis" : "memory",
          status: sessionHealthy ? "healthy" : "degraded",
        },
        services: {
          http: await httpCacheService.healthCheck(),
          // socket: will be added when Socket.io server is implemented
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Simple Health Check Endpoint for Load Balancers
 * Lightweight endpoint for uptime monitoring
 */
app.get("/health", async (req, res) => {
  try {
    const redisHealthy = await httpCacheService.healthCheck();

    if (redisHealthy) {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "degraded",
        message: "Redis cache unavailable",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Redis Connection Pool Management Endpoints
 * Administrative endpoints for monitoring and managing Redis connections
 */
app.get("/api/redis/connections", async (req, res) => {
  try {
    const connections = redisPool.getConnectionInfo();
    const health = await redisPool.healthCheckAll();

    res.json({
      success: true,
      message: "Redis connections information",
      data: {
        connections,
        health,
        activeConnections: redisPool.getActiveConnections(),
        totalConnections: Object.keys(connections).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve connections information",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Cache Management Endpoints
 * Administrative endpoints for cache operations
 */

// Flush all cache
app.delete("/api/cache/flush", async (req, res) => {
  try {
    await httpCacheService.flushAll();
    res.json({
      success: true,
      message: "All cache flushed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cache flush operation failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Flush specific namespace cache
app.delete("/api/cache/flush/:namespace", async (req, res) => {
  try {
    const { namespace } = req.params;
    await httpCacheService.invalidateCache(namespace);
    res.json({
      success: true,
      message: `Cache namespace '${namespace}' flushed successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cache flush operation failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get cache statistics
app.get("/api/cache/stats", async (req, res) => {
  try {
    const stats = await httpCacheService.getCacheStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get cache stats",
    });
  }
});

// Health check for cache service
app.get("/api/cache/health", async (req, res) => {
  try {
    const healthy = await httpCacheService.healthCheck();
    res.json({
      success: true,
      healthy,
      status: healthy ? "connected" : "disconnected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Health check failed",
    });
  }
});

// Get specific cache key
app.get("/api/cache/:namespace/:key", async (req, res) => {
  try {
    const { namespace, key } = req.params;
    const data = await httpCacheService.getCachedData(namespace, key);

    res.json({
      success: true,
      data,
      cached: data !== null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get cache data",
    });
  }
});

// Set cache data
app.post("/api/cache/:namespace/:key", async (req, res) => {
  try {
    const { namespace, key } = req.params;
    const { value, ttl } = req.body;

    await httpCacheService.cacheData(namespace, key, value, ttl);
    res.json({
      success: true,
      message: "Cache data set successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to set cache data",
    });
  }
});

// Delete specific cache key
app.delete("/api/cache/:namespace/:key", async (req, res) => {
  try {
    const { namespace, key } = req.params;
    await httpCacheService.delete(key, { namespace });
    res.json({
      success: true,
      message: "Cache key deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete cache key",
    });
  }
});

/**
 * Error Handling Middleware
 * Must be placed after all routes and other middleware
 * Order matters: notFound should come before errorHandler
 */
app.use(notFound); // Handle 404 errors for undefined routes
app.use(errorHandler); // Handle all other errors with proper logging and response formatting

/**
 * Graceful Shutdown Handlers
 * Ensures clean shutdown of all connections and services
 */
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received, initiating graceful shutdown...`);

  try {
    // Step 1: Stop accepting new requests
    console.log("🛑 Stopping server from accepting new requests...");

    // Step 2: Clean up cache service connections
    console.log("🧹 Cleaning up cache services...");
    await httpCacheService.cleanup();

    // Step 3: Close all Redis connections in the pool
    console.log("🔌 Closing Redis connection pool...");
    await redisPool.closeAll();

    // Step 4: Close database connections
    console.log("💾 Closing database connections...");
    // await mongoose.connection.close(); // Uncomment if using mongoose directly

    console.log("✅ Graceful shutdown completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // Docker/Kubernetes/Render shutdown
process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl+C

// Handle uncaught exceptions and unhandled promise rejections
process.on("uncaughtException", async (error) => {
  console.error("💥 Uncaught Exception:", error);
  await gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  await gracefulShutdown("UNHANDLED_REJECTION");
});

/**
 * Server Startup Function
 * Initializes all services in the correct order
 */
const startServer = async () => {
  try {
    console.log("🚀 Starting server initialization...");
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔢 Node version: ${process.version}`);

    // Step 1: Initialize Redis connection pool for cache
    console.log("\n📡 Initializing Redis connection pool...");
    await initializeRedis();

    // Step 2: Initialize Redis session store
    console.log("\n🔐 Initializing session management...");
    const sessionInitialized = await initializeSessions();

    if (!sessionInitialized) {
      console.warn(
        "⚠️  Warning: Session store not using Redis. Sessions will not persist across server restarts."
      );
    }

    // Step 3: Start HTTP server
    app.listen(PORT, () => {
      console.log(
        "\n🎉 ═══════════════════════════════════════════════════════"
      );
      console.log("🎉 SERVER STARTUP COMPLETED SUCCESSFULLY!");
      console.log(
        "🎉 ═══════════════════════════════════════════════════════\n"
      );

      console.log(`🌐 Server running on port: ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `🔐 Session store: ${
          sessionInitialized ? "Redis (persistent)" : "Memory (non-persistent)"
        }\n`
      );

      console.log("📊 Health & Monitoring:");
      console.log(`  ├─ Health check: http://localhost:${PORT}/health`);
      console.log(`  ├─ Detailed health: http://localhost:${PORT}/api/health`);
      console.log(
        `  └─ Redis info: http://localhost:${PORT}/api/redis/connections\n`
      );

      console.log("🏥 Core API Endpoints:");
      console.log("  ├─ Authentication: /api/auth");
      console.log("  ├─ Administration: /api/admin");
      console.log("  ├─ Patients: /api/patients (cached)");
      console.log("  ├─ Appointments: /api/appointments (cached)");
      console.log("  ├─ Rooms: /api/rooms (cached)");
      console.log("  ├─ Workflows: /api/workflows (cached)");
      console.log("  ├─ Billing: /api/billing (cached)");
      console.log("  └─ Reports: /api/reports (cached)\n");

      console.log("🧰 Cache Management:");
      console.log("  ├─ Cache stats: GET /api/cache/stats");
      console.log("  ├─ Cache health: GET /api/cache/health");
      console.log("  ├─ Flush all: DELETE /api/cache/flush");
      console.log("  ├─ Flush namespace: DELETE /api/cache/flush/:namespace");
      console.log("  ├─ Get cache: GET /api/cache/:namespace/:key");
      console.log("  ├─ Set cache: POST /api/cache/:namespace/:key");
      console.log("  └─ Delete cache: DELETE /api/cache/:namespace/:key\n");

      console.log("═══════════════════════════════════════════════════════\n");
      console.log("✨ Ready to accept requests!");
      console.log("💡 Press Ctrl+C to shutdown gracefully\n");
    });
  } catch (error) {
    console.error(
      "\n💥 ═══════════════════════════════════════════════════════"
    );
    console.error("💥 FAILED TO START SERVER");
    console.error(
      "💥 ═══════════════════════════════════════════════════════\n"
    );
    console.error("Error details:", error);
    console.error("\n");
    process.exit(1);
  }
};

// Start the server
startServer();

// Export app for testing purposes
export default app;
