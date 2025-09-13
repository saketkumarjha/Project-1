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

const router = express.Router();

// All room routes require authentication and room access
// Only Admin with patientManagement=true OR Staff with roomManagementAccess=true can access
router.use(authenticateUser);
router.use(requireRoomAccess);

// Create new room
router.post("/create", createRoom);

// Get all rooms with filters
router.get("/", getAllRooms);

// Get available rooms only
router.get("/available", getAvailableRooms);

// Get rooms by department
router.get("/department/:department", getRoomsByDepartment);

// Get rooms by floor
router.get("/floor/:floor", getRoomsByFloor);

// Get room by ID
router.get("/:id", getRoomById);

// Update room details
router.put("/:id", updateRoom);

// Assign patient to room
router.post("/:id/assign", assignPatientToRoom);

// Discharge patient from room
router.patch("/:id/discharge", dischargePatientFromRoom);

// Transfer patient from room
router.patch("/:id/transfer", transferPatientFromRoom);

// Delete room (soft delete)
router.delete("/:id", deleteRoom);

export default router;
