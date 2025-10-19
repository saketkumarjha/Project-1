import express from "express";
import {
  getDailyStats,
  getWeeklyStats,
  getMonthlyStats,
  getYearlyStats,
  getCustomReport,
  getDashboardStats,
  // getComprehensiveAnalytics,
  // getKPISummary,
  // getTrendAnalysis,
} from "../controllers/reportController";
import { authenticateUser, requireReportAccess } from "../middleware/auth";
import { reportsCacheMiddleware } from "../middleware/cacheMiddleware";
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);
router.use(requireReportAccess);

router.get("/dashboard", reportsCacheMiddleware, getDashboardStats);

// Time-based reports - with caching
router.get("/daily", reportsCacheMiddleware, getDailyStats);
router.get("/weekly", reportsCacheMiddleware, getWeeklyStats);
router.get("/monthly", reportsCacheMiddleware, getMonthlyStats);
router.get("/yearly", reportsCacheMiddleware, getYearlyStats);

// Custom reports - with caching
router.get("/custom", reportsCacheMiddleware, getCustomReport);

// Advanced analytics
// router.get("/analytics", getComprehensiveAnalytics);
// router.get("/kpi", getKPISummary);
// router.get("/trends", getTrendAnalysis);

export default router;
