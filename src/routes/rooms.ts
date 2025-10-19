import express from "express";
import { authenticateUser, requireRoomAccess } from "../middleware/auth";
import {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  assignPatientToRoom,
  dischargePatientFromRoom,
  transferPatientFromRoom,
  deleteRoom,
  getAvailableRooms,
  getRoomsByDepartment,
  getRoomsByFloor,
} from "../controllers/roomController";
import { roomsCacheMiddleware, roomsCacheInvalidation } from "../middleware/cacheMiddleware";
const router = express.Router();

// All room routes require authentication and room access
// Only Admin with patientManagement=true OR Staff with roomManagementAccess=true can access
router.use(authenticateUser);
router.use(requireRoomAccess);

// Write operations - with cache invalidation
router.post("/create", roomsCacheInvalidation, createRoom);
router.put("/:id", roomsCacheInvalidation, updateRoom);
router.post("/:id/assign", roomsCacheInvalidation, assignPatientToRoom);
router.patch("/:id/discharge", roomsCacheInvalidation, dischargePatientFromRoom);
router.patch("/:id/transfer", roomsCacheInvalidation, transferPatientFromRoom);
router.delete("/:id", roomsCacheInvalidation, deleteRoom);

// Read operations - with caching
// Get all rooms with filters
router.get("/", roomsCacheMiddleware, getAllRooms);

// Get available rooms only
router.get("/available", roomsCacheMiddleware, getAvailableRooms);

// Get rooms by department
router.get("/department/:department", roomsCacheMiddleware, getRoomsByDepartment);

// Get rooms by floor
router.get("/floor/:floor", roomsCacheMiddleware, getRoomsByFloor);

// Get room by ID
router.get("/:id", roomsCacheMiddleware, getRoomById);

export default router;
