import express from "express";
import { authenticateUser, requireBillingAccess } from "../middleware/auth";
import { 
  billsCacheMiddleware, 
  billsCacheInvalidation, 
  cacheHealthCheck 
} from "../middleware/cacheMiddleware";
import { httpCacheService } from "../services/cacheService";
import Bill from "../models/Bill";

const router = express.Router();

/**
 * Authentication & Authorization Middleware
 * All billing routes require user authentication and billing access permissions
 */
router.use(authenticateUser);
router.use(requireBillingAccess);

/**
 * Cache Health Check Middleware
 * Ensures Redis cache service is available for all routes
 * If cache fails, routes continue to work with database-only operations
 */
router.use(cacheHealthCheck);

/**
 * CREATE BILL - POST /api/billing/createBill
 * Creates a new bill and invalidates relevant cache entries
 * Cache Strategy: Invalidate related caches after successful creation
 */
router.post("/createBill", billsCacheInvalidation, async (req, res) => {
  try {
    const billData = req.body;
    const bill = new Bill(billData);
    await bill.save();

    // Additional specific cache invalidation for related data
    if (bill.patientId) {
      // Invalidate patient-specific bill cache
      await httpCacheService.invalidateCache('bills', `*patient:${bill.patientId}*`);
    }
    
    if (bill.status) {
      // Invalidate status-specific bill cache
      await httpCacheService.invalidateCache('bills', `*status:${bill.status}*`);
    }

    console.log(`[BILLING] New bill created: ${bill._id} for patient: ${bill.patientId}`);

    res.status(201).json({
      success: true,
      message: "Bill created successfully",
      data: { bill },
      cache: {
        invalidated: true,
        patterns: ['bills:*', `bills:*patient:${bill.patientId}*`, `bills:*status:${bill.status}*`]
      }
    });
  } catch (error) {
    console.error('[BILLING] Error creating bill:', error);
    res.status(400).json({
      success: false,
      message: "Error creating bill",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * UPDATE BILL - PUT /api/billing/updateBill/:id
 * Updates an existing bill and invalidates relevant cache entries
 * Cache Strategy: Invalidate specific bill cache and related patterns
 */
router.put("/updateBill/:id", billsCacheInvalidation, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const bill = await Bill.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!bill) {
      res.status(404).json({
        success: false,
        message: "Bill not found",
      });
      return;
    }

    // Specific cache invalidation for updated bill
    await httpCacheService.invalidateCache('bills', `*${id}*`);
    
    if (bill.patientId) {
      await httpCacheService.invalidateCache('bills', `*patient:${bill.patientId}*`);
    }
    
    if (bill.status) {
      await httpCacheService.invalidateCache('bills', `*status:${bill.status}*`);
    }

    console.log(`[BILLING] Bill updated: ${bill._id}`);

    res.json({
      success: true,
      message: "Bill updated successfully",
      data: { bill },
      cache: {
        invalidated: true,
        patterns: [`bills:*${id}*`, `bills:*patient:${bill.patientId}*`]
      }
    });
  } catch (error) {
    console.error('[BILLING] Error updating bill:', error);
    res.status(400).json({
      success: false,
      message: "Error updating bill",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET ALL BILLS - GET /api/billing/getAllBill
 * Retrieves bills with search, filters, and pagination
 * Cache Strategy: Cache results based on query parameters (5-minute TTL)
 */
router.get("/getAllBill", billsCacheMiddleware, async (req, res) => {
  try {
    const {
      search,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    console.log(`[BILLING] Fetching bills with filters:`, {
      search, status, fromDate, toDate, page, limit
    });

    // Build query object
    const query: any = {};

    // Search by patient name or patient ID
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by date range
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate as string);
      }
      if (toDate) {
        const endDate = new Date(toDate as string);
        endDate.setHours(23, 59, 59, 999); // End of day
        query.createdAt.$lte = endDate;
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get bills with pagination
    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalBills = await Bill.countDocuments(query);
    const totalPages = Math.ceil(totalBills / limitNum);

    const response = {
      success: true,
      message: "Bills retrieved successfully",
      data: {
        bills,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalBills,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
      cache: {
        served_from: 'database', // Will be overridden if served from cache
        query_signature: `search:${search || 'none'}_status:${status || 'all'}_dates:${fromDate || 'none'}-${toDate || 'none'}_page:${pageNum}_limit:${limitNum}`
      }
    };

    console.log(`[BILLING] Bills retrieved: ${bills.length} items, page ${pageNum}/${totalPages}`);

    res.json(response);
  } catch (error) {
    console.error('[BILLING] Error fetching bills:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching bills",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET BILL BY ID - GET /api/billing/getBill/:id
 * Retrieves a specific bill by its ID
 * Cache Strategy: Cache individual bills (10-minute TTL)
 */
router.get("/getBill/:id", billsCacheMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[BILLING] Fetching bill by ID: ${id}`);
    
    const bill = await Bill.findById(id);

    if (!bill) {
      res.status(404).json({
        success: false,
        message: "Bill not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Bill details retrieved successfully",
      data: { bill },
      cache: {
        served_from: 'database', // Will be overridden if served from cache
        bill_id: id
      }
    });
  } catch (error) {
    console.error('[BILLING] Error fetching bill details:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching bill details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * DELETE BILL - DELETE /api/billing/deleteBill/:id
 * Soft delete by updating status to cancelled
 * Cache Strategy: Invalidate related cache entries after soft delete
 */
router.delete("/deleteBill/:id", billsCacheInvalidation, async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    if (!bill) {
      res.status(404).json({
        success: false,
        message: "Bill not found",
      });
      return;
    }

    // Specific cache invalidation for cancelled bill
    await httpCacheService.invalidateCache('bills', `*${id}*`);
    
    if (bill.patientId) {
      await httpCacheService.invalidateCache('bills', `*patient:${bill.patientId}*`);
    }
    
    // Invalidate status-based caches (both old and new status)
    await httpCacheService.invalidateCache('bills', `*status:cancelled*`);

    console.log(`[BILLING] Bill cancelled: ${bill._id}`);

    res.json({
      success: true,
      message: "Bill cancelled successfully",
      data: { bill },
      cache: {
        invalidated: true,
        patterns: [`bills:*${id}*`, `bills:*patient:${bill.patientId}*`, 'bills:*status:cancelled*']
      }
    });
  } catch (error) {
    console.error('[BILLING] Error cancelling bill:', error);
    res.status(500).json({
      success: false,
      message: "Error cancelling bill",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET BILLS BY STATUS - GET /api/billing/getByStatus/:status
 * Retrieves bills filtered by status
 * Cache Strategy: Cache status-based queries (5-minute TTL)
 */
router.get("/getByStatus/:status", billsCacheMiddleware, async (req, res) => {
  try {
    const { status } = req.params;
    
    console.log(`[BILLING] Fetching bills by status: ${status}`);
    
    const bills = await Bill.find({ status }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: `Bills with status '${status}' retrieved successfully`,
      data: {
        bills,
        count: bills.length,
      },
      cache: {
        served_from: 'database', // Will be overridden if served from cache
        status_filter: status
      }
    });
  } catch (error) {
    console.error('[BILLING] Error fetching bills by status:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching bills by status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET BILLS BY PATIENT ID - GET /api/billing/getByPatient/:patientId
 * Retrieves bills for a specific patient
 * Cache Strategy: Cache patient-specific queries (5-minute TTL)
 */
router.get("/getByPatient/:patientId", billsCacheMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    console.log(`[BILLING] Fetching bills for patient: ${patientId}`);
    
    const bills = await Bill.find({ patientId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Patient bills retrieved successfully",
      data: {
        bills,
        count: bills.length,
      },
      cache: {
        served_from: 'database', // Will be overridden if served from cache
        patient_id: patientId
      }
    });
  } catch (error) {
    console.error('[BILLING] Error fetching patient bills:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching patient bills",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * CACHE MANAGEMENT ENDPOINTS
 * Administrative endpoints for cache operations
 */

/**
 * GET CACHE HEALTH - GET /api/billing/cache/health
 * Check Redis cache health for billing service
 */
router.get("/cache/health", async (req, res) => {
  try {
    const isHealthy = await httpCacheService.healthCheck();
    const cacheStats = await httpCacheService.getCacheStats();
    
    res.json({
      success: true,
      message: "Billing cache health check completed",
      data: { 
        healthy: isHealthy,
        service: httpCacheService.getServiceName(),
        stats: cacheStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Billing cache health check failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * DELETE CACHE - DELETE /api/billing/cache/flush
 * Flush all billing-related cache entries
 */
router.delete("/cache/flush", async (req, res) => {
  try {
    await httpCacheService.invalidateBillsCache();
    
    res.json({
      success: true,
      message: "Bills cache flushed successfully",
      data: {
        timestamp: new Date().toISOString(),
        service: httpCacheService.getServiceName()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error flushing bills cache",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET CACHE STATS - GET /api/billing/cache/stats
 * Get detailed cache statistics for billing
 */
router.get("/cache/stats", async (req, res) => {
  try {
    const stats = await httpCacheService.getCacheStats();
    
    res.json({
      success: true,
      message: "Billing cache statistics retrieved",
      data: {
        stats,
        namespace: 'bills',
        service: httpCacheService.getServiceName(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving cache statistics",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;