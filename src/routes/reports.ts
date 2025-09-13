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

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);
router.use(requireReportAccess);

// Dashboard statistics
router.get("/dashboard", getDashboardStats);

// Time-based reports
router.get("/daily", getDailyStats);
router.get("/weekly", getWeeklyStats);
router.get("/monthly", getMonthlyStats);
router.get("/yearly", getYearlyStats);

// Custom reports
router.get("/custom", getCustomReport);

// Advanced analytics
// router.get("/analytics", getComprehensiveAnalytics);
// router.get("/kpi", getKPISummary);
// router.get("/trends", getTrendAnalysis);

export default router;
