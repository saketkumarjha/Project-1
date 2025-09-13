import express from "express";
import { authenticateUser, requireAppointmentAccess } from "../middleware/auth";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByDepartment,
  getTodaysAppointments,
  updateAppointmentStatus,
} from "../controllers/appointmentController";

const router = express.Router();

// All appointment routes require authentication and appointment access
// Only Admin with patientManagement=true OR Staff with bookAppointmentAccess=true can access
router.use(authenticateUser);
router.use(requireAppointmentAccess);

// Create new appointment
router.post("/create", createAppointment);

// Get all appointments with filters
router.get("/", getAllAppointments);

// Get today's appointments
router.get("/today", getTodaysAppointments);

// Get appointments by department
router.get("/department/:department", getAppointmentsByDepartment);

// Get appointment by ID
router.get("/:id", getAppointmentById);

// Update appointment
router.put("/:id", updateAppointment);

// Update appointment status only
router.patch("/:id/status", updateAppointmentStatus);

// Delete appointment (soft delete)
router.delete("/:id", deleteAppointment);

export default router;
