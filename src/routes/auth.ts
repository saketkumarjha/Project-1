import express from "express";
import {
  adminLogin,
  adminLogout,
  accountantLogin,
  staffLogin,
} from "../controllers/authController";
import { authenticateUser, requireRoomAccess } from "../middleware/auth";

const router = express.Router();

// Public routes
router.post("/admin/login", adminLogin);
router.post("/admin/logout", adminLogout);

router.post("/accountant/login", accountantLogin);
router.post("/staff/login", staffLogin);

// Test room access permissions (specific to roomManagementAccess)
router.get(
  "/test-room-access",
  authenticateUser,
  requireRoomAccess,
  (req, res) => {
    res.json({
      success: true,
      message: "Room access granted successfully!",
      data: {
        userType: req.userType,
        user:
          req.userType === "admin"
            ? {
                name: req.admin?.name,
                permissions: req.admin?.permissions,
              }
            : req.userType === "staff"
            ? {
                name: req.staff?.name,
                permissions: req.staff?.permissions,
              }
            : null,
        accessLevel:
          req.userType === "admin"
            ? "patientManagement"
            : "roomManagementAccess",
        availableActions: [
          "create",
          "read",
          "update",
          "delete",
          "assign-patient",
          "discharge-patient",
          "transfer-patient",
        ],
      },
    });
  }
);

export default router;
