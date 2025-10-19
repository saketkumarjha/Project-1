// src/middleware/cacheMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { httpCacheService } from "../services/cacheService";

interface CacheMiddlewareOptions {
  ttl?: number;
  namespace: string;
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
}

// Generate cache key from request
const generateCacheKey = (req: Request): string => {
  const { method, path, query } = req;

  // For GET requests, include query parameters in cache key
  if (method === "GET") {
    const queryString = new URLSearchParams(
      query as Record<string, string>
    ).toString();
    return queryString ? `${path}?${queryString}` : path;
  }

  return path;
};

// general Cache middleware for GET requests
export const cacheMiddleware = (options: CacheMiddlewareOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Skip cache if condition is met
    if (options.skipCache && options.skipCache(req)) {
      return next();
    }

    try {
      // Ensure cache service is initialized
      await httpCacheService.initialize();

      // Generate cache key
      const cacheKey = options.keyGenerator
        ? options.keyGenerator(req)
        : generateCacheKey(req);

      // Try to get from cache
      const cachedData = await httpCacheService.getCachedData(
        options.namespace,
        cacheKey
      );

      if (cachedData) {
        console.log(`[HTTP] Cache HIT for ${options.namespace}:${cacheKey}`);
        return res.json(cachedData);
      }

      // Cache miss - continue to route handler
      console.log(`[HTTP] Cache MISS for ${options.namespace}:${cacheKey}`);

      // Store original res.json to intercept response
      const originalJson = res.json;

      res.json = function (data: any) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300 && data.success) {
          httpCacheService.cacheData(
            options.namespace,
            cacheKey,
            data,
            options.ttl
          );
        }

        // Call original res.json
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("[HTTP] Cache middleware error:", error);
      // Continue without caching on error
      next();
    }
  };
};

// general Cache invalidation middleware for write operations
export const cacheInvalidationMiddleware = (
  namespace: string,
  patterns?: string[]
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure cache service is initialized
      await httpCacheService.initialize();

      // Store original res.json to intercept response
      const originalJson = res.json;

      res.json = function (data: any) {
        // Invalidate cache on successful write operations
        if (res.statusCode >= 200 && res.statusCode < 300 && data.success) {
          // Invalidate specific patterns or all cache for this namespace
          if (patterns && patterns.length > 0) {
            patterns.forEach((pattern) => {
              httpCacheService.invalidateCache(namespace, pattern);
            });
          } else {
            httpCacheService.invalidateCache(namespace);
          }

          console.log(
            `[HTTP] Cache invalidated for ${namespace} after ${req.method} ${req.path}`
          );
        }

        // Call original res.json
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("[HTTP] Cache invalidation middleware error:", error);
      next();
    }
  };
};

/**
 * ADMIN-SPECIFIC CACHE MIDDLEWARE
 * Cache admin, staff, and accountant data with standard TTL
 */
export const adminsCacheMiddleware = cacheMiddleware({
  namespace: "admins",
  ttl: 300, // 5 minutes
  keyGenerator: (req: Request) => {
    const { search, role, isActive, page, limit } = req.query;
    const parts = [req.path];

    if (search) parts.push(`search:${search}`);
    if (role && role !== "all") parts.push(`role:${role}`);
    if (isActive !== undefined) parts.push(`active:${isActive}`);
    if (page) parts.push(`page:${page}`);
    if (limit) parts.push(`limit:${limit}`);

    return parts.join(":");
  },
});

export const adminsCacheInvalidation = cacheInvalidationMiddleware("admins");

/**
 * STAFF-SPECIFIC CACHE MIDDLEWARE
 * Cache staff data separately for better granular control
 */
export const staffCacheMiddleware = cacheMiddleware({
  namespace: "staff",
  ttl: 300, // 5 minutes
  keyGenerator: (req: Request) => {
    const { search, department, isActive, page, limit } = req.query;
    const parts = [req.path];

    if (search) parts.push(`search:${search}`);
    if (department && department !== "all") parts.push(`dept:${department}`);
    if (isActive !== undefined) parts.push(`active:${isActive}`);
    if (page) parts.push(`page:${page}`);
    if (limit) parts.push(`limit:${limit}`);

    return parts.join(":");
  },
});

export const staffCacheInvalidation = cacheInvalidationMiddleware("staff");

/**
 * ACCOUNTANT-SPECIFIC CACHE MIDDLEWARE
 * Cache accountant data separately
 */
export const accountantsCacheMiddleware = cacheMiddleware({
  namespace: "accountants",
  ttl: 300, // 5 minutes
  keyGenerator: (req: Request) => {
    const { search, isActive, page, limit } = req.query;
    const parts = [req.path];

    if (search) parts.push(`search:${search}`);
    if (isActive !== undefined) parts.push(`active:${isActive}`);
    if (page) parts.push(`page:${page}`);
    if (limit) parts.push(`limit:${limit}`);

    return parts.join(":");
  },
});

export const accountantsCacheInvalidation =
  cacheInvalidationMiddleware("accountants");
/**
 * BILLING-SPECIFIC CACHE MIDDLEWARE
 * Cache bills with 5-minute TTL including search and filter parameters
 */
export const billsCacheMiddleware = cacheMiddleware({
  namespace: "bills",
  ttl: 300, // 5 minutes
  keyGenerator: (req: Request) => {
    const { search, status, fromDate, toDate, page, limit } = req.query;
    const parts = [req.path];

    if (search) parts.push(`search:${search}`);
    if (status && status !== "all") parts.push(`status:${status}`);
    if (fromDate) parts.push(`from:${fromDate}`);
    if (toDate) parts.push(`to:${toDate}`);
    if (page) parts.push(`page:${page}`);
    if (limit) parts.push(`limit:${limit}`);

    return parts.join(":");
  },
});

export const billsCacheInvalidation = cacheInvalidationMiddleware("bills");

/**
 * APPOINTMENTS-SPECIFIC CACHE MIDDLEWARE
 * Cache appointments with different TTL based on route type
 * - Today's appointments: 2 minutes (frequently changing)
 * - Other appointments: 5 minutes (standard)
 */
export const appointmentsCacheMiddleware = cacheMiddleware({
  namespace: "appointments",
  ttl: 300, // 5 minutes default
  keyGenerator: (req: Request) => {
    const {
      department,
      doctorName,
      status,
      appointmentDate,
      fromDate,
      toDate,
      page,
      limit,
    } = req.query;
    const parts = [req.path];

    // Special handling for today's appointments with date-specific cache key
    if (req.path === "/today") {
      const today = new Date().toISOString().split("T")[0];
      parts.push(`today:${today}`);
      return parts.join(":");
    }

    // For getAllAppointments with comprehensive filter support
    if (department && department !== "all") parts.push(`dept:${department}`);
    if (doctorName) parts.push(`doctor:${doctorName}`);
    if (status && status !== "all") parts.push(`status:${status}`);
    if (appointmentDate) parts.push(`date:${appointmentDate}`);
    if (fromDate) parts.push(`from:${fromDate}`);
    if (toDate) parts.push(`to:${toDate}`);
    if (page) parts.push(`page:${page}`);
    if (limit) parts.push(`limit:${limit}`);

    return parts.join(":");
  },
});

/**
 * Today's appointments cache middleware with shorter TTL
 * Used specifically for /today endpoint which changes frequently
 */
export const todaysAppointmentsCacheMiddleware = cacheMiddleware({
  namespace: "appointments",
  ttl: 120, // 2 minutes for real-time dashboard updates
  keyGenerator: (req: Request) => {
    const today = new Date().toISOString().split("T")[0];
    return `today:appointments:${today}`;
  },
});

export const appointmentsCacheInvalidation =
  cacheInvalidationMiddleware("appointments");

/**
 * PATIENTS-SPECIFIC CACHE MIDDLEWARE
 * Cache patient data with registration and type filters
 */
export const patientsCacheMiddleware = cacheMiddleware({
  namespace: "patients",
  ttl: 300, // 5 minutes
  keyGenerator: (req: Request) => {
    const { search, registrationType, patientType, isActive, page, limit } =
      req.query;
    const parts = [req.path];

    if (search) parts.push(`search:${search}`);
    if (registrationType && registrationType !== "all")
      parts.push(`regType:${registrationType}`);
    if (patientType && patientType !== "all")
      parts.push(`patType:${patientType}`);
    if (isActive !== undefined) parts.push(`active:${isActive}`);
    if (page) parts.push(`page:${page}`);
    if (limit) parts.push(`limit:${limit}`);

    return parts.join(":");
  },
});

export const patientsCacheInvalidation =
  cacheInvalidationMiddleware("patients");

/**
 * ROOMS-SPECIFIC CACHE MIDDLEWARE
 * Cache room data with shorter TTL due to frequent availability changes
 */
export const roomsCacheMiddleware = cacheMiddleware({
  namespace: "rooms",
  ttl: 180, // 3 minutes (room availability changes frequently)
  keyGenerator: (req: Request) => {
    const { roomType, status, floor, availability, page, limit } = req.query;
    const parts = [req.path];

    if (roomType && roomType !== "all") parts.push(`type:${roomType}`);
    if (status && status !== "all") parts.push(`status:${status}`);
    if (floor) parts.push(`floor:${floor}`);
    if (availability && availability !== "all")
      parts.push(`avail:${availability}`);
    if (page) parts.push(`page:${page}`);
    if (limit) parts.push(`limit:${limit}`);

    return parts.join(":");
  },
});

export const roomsCacheInvalidation = cacheInvalidationMiddleware("rooms");

/**
 * REPORTS-SPECIFIC CACHE MIDDLEWARE
 * Cache reports with longer TTL as they change less frequently
 */
export const reportsCacheMiddleware = cacheMiddleware({
  namespace: "reports",
  ttl: 600, // 10 minutes (reports are generated less frequently)
  keyGenerator: (req: Request) => {
    const { reportType, fromDate, toDate, department, format } = req.query;
    const parts = [req.path];

    if (reportType) parts.push(`type:${reportType}`);
    if (fromDate) parts.push(`from:${fromDate}`);
    if (toDate) parts.push(`to:${toDate}`);
    if (department && department !== "all") parts.push(`dept:${department}`);
    if (format) parts.push(`format:${format}`);

    return parts.join(":");
  },
});

export const reportsCacheInvalidation = cacheInvalidationMiddleware("reports");

/**
 * WORKFLOWS-SPECIFIC CACHE MIDDLEWARE
 * Cache workflow data with standard TTL
 */
export const workflowsCacheMiddleware = cacheMiddleware({
  namespace: "workflows",
  ttl: 300, // 5 minutes
  keyGenerator: (req: Request) => {
    const { workflowType, status, assignedTo, priority, page, limit } =
      req.query;
    const parts = [req.path];

    if (workflowType && workflowType !== "all")
      parts.push(`type:${workflowType}`);
    if (status && status !== "all") parts.push(`status:${status}`);
    if (assignedTo) parts.push(`assigned:${assignedTo}`);
    if (priority && priority !== "all") parts.push(`priority:${priority}`);
    if (page) parts.push(`page:${page}`);
    if (limit) parts.push(`limit:${limit}`);

    return parts.join(":");
  },
});

export const workflowsCacheInvalidation =
  cacheInvalidationMiddleware("workflows");

/**
 * Generic middleware factory for other modules
 * Creates cache and invalidation middleware with custom TTL
 */
export const createCacheMiddleware = (
  namespace: string,
  ttl: number = 300
) => ({
  cache: cacheMiddleware({ namespace, ttl }),
  invalidate: cacheInvalidationMiddleware(namespace),
});

/**
 * Health check middleware
 * Ensures Redis cache service is available for all routes
 * If cache fails, routes continue to work with database-only operations
 */
export const cacheHealthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await httpCacheService.initialize();
    const isHealthy = await httpCacheService.healthCheck();

    if (!isHealthy) {
      console.warn(
        "[HTTP] Redis health check failed - continuing without cache"
      );
    }

    // Store cache health status in request for route handlers
    (req as any).cacheHealthy = isHealthy;
    next();
  } catch (error) {
    console.error("[HTTP] Cache health check error:", error);
    (req as any).cacheHealthy = false;
    next();
  }
};

/**
 * Cache performance monitoring middleware
 * Adds response time and cache status headers for monitoring
 */
export const cacheStatsMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Store original res.json to add performance metrics
  const originalJson = res.json;

  res.json = function (data: any) {
    const responseTime = Date.now() - startTime;

    // Add performance headers for monitoring
    res.setHeader("X-Cache-Service", httpCacheService.getServiceName());
    res.setHeader("X-Response-Time", `${responseTime}ms`);

    // Add cache hit/miss status if available
    if (data.cache) {
      res.setHeader("X-Cache-Status", data.cache.served_from || "unknown");
    }

    return originalJson.call(this, data);
  };

  next();
};
