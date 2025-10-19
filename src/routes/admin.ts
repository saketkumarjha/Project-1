import express from "express";
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAllStaff,
  getAllAccountants,
} from "../controllers/adminController";
import {
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController";
import {
  createAccountant,
  getAccountantById,
  updateAccountant,
  deleteAccountant,
} from "../controllers/accountantController";
import {
  authenticateAdmin,
  requirePermission,
  requireSuperAdmin,
} from "../middleware/auth";
import {
  adminsCacheMiddleware,
  adminsCacheInvalidation,
  staffCacheMiddleware,
  staffCacheInvalidation,
  accountantsCacheMiddleware,
  accountantsCacheInvalidation,
} from "../middleware/cacheMiddleware";
const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Write operations - with cache invalidation
router.post("/createAdmin", requireSuperAdmin, adminsCacheInvalidation, createAdmin);
router.put("/updateAdmin/:id", requireSuperAdmin, adminsCacheInvalidation, updateAdmin);
router.delete("/deleteAdmin/:id", requireSuperAdmin, adminsCacheInvalidation, deleteAdmin);

// Read operations - with caching
router.get("/getAllAdmins", requireSuperAdmin, adminsCacheMiddleware, getAllAdmins);
router.get("/getAdmin/:id", requirePermission("adminManagement"), adminsCacheMiddleware, getAdminById);

// ============================================
// STAFF MANAGEMENT ROUTES
// ============================================

// Write operations - with cache invalidation
router.post("/createStaff", requirePermission("staffManagement"), staffCacheInvalidation, createStaff);
router.put("/updateStaff/:id", requirePermission("staffManagement"), staffCacheInvalidation, updateStaff);
router.delete("/deleteStaff/:id", requirePermission("staffManagement"), staffCacheInvalidation, deleteStaff);

// Read operations - with caching
router.get("/getAllStaff", requirePermission("staffManagement"), staffCacheMiddleware, getAllStaff);
router.get("/getStaff/:id", requirePermission("staffManagement"), staffCacheMiddleware, getStaffById);

// ============================================
// ACCOUNTANT MANAGEMENT ROUTES
// ============================================

// Write operations - with cache invalidation
router.post("/createAccountant", requirePermission("accountantManagement"), accountantsCacheInvalidation, createAccountant);
router.put("/updateAccountant/:id", requirePermission("accountantManagement"), accountantsCacheInvalidation, updateAccountant);
router.delete("/deleteAccountant/:id", requirePermission("accountantManagement"), accountantsCacheInvalidation, deleteAccountant);

// Read operations - with caching
router.get("/getAllAccountants", requirePermission("accountantManagement"), accountantsCacheMiddleware, getAllAccountants);
router.get("/getAccountantById/:id", requirePermission("accountantManagement"), accountantsCacheMiddleware, getAccountantById);

export default router;
