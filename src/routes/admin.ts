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

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Admin management routes (super admin only for most operations)
router.get("/getAllAdmins", requireSuperAdmin, getAllAdmins);
router.get("/getAdmin/:id", requirePermission("adminManagement"), getAdminById);
router.post("/createAdmin", requireSuperAdmin, createAdmin);
router.put("/updateAdmin/:id", requireSuperAdmin, updateAdmin);
router.delete("/deleteAdmin/:id", requireSuperAdmin, deleteAdmin);


// Staff management routes
router.get("/getAllStaff", requirePermission("staffManagement"), getAllStaff);
router.get("/getStaff/:id", requirePermission("staffManagement"), getStaffById);
router.post("/createStaff", requirePermission("staffManagement"), createStaff);
router.put("/updateStaff/:id", requirePermission("staffManagement"), updateStaff);
router.delete("/deleteStaff/:id", requirePermission("staffManagement"), deleteStaff);

// Accountant management routes
router.get(
  "/getAllAccountants",
  requirePermission("accountantManagement"),
  getAllAccountants
);
router.get(
  "/getAccountantById/:id",
  requirePermission("accountantManagement"),
  getAccountantById
);
router.post(
  "/createAccountant",
  requirePermission("accountantManagement"),
  createAccountant
);
router.put(
  "/updateAccountant/:id",
  requirePermission("accountantManagement"),
  updateAccountant
);
router.delete(
  "/deleteAccountant/:id",
  requirePermission("accountantManagement"),
  deleteAccountant
);

export default router;
