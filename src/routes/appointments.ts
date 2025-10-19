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
import { appointmentsCacheMiddleware, todaysAppointmentsCacheMiddleware, appointmentsCacheInvalidation } from "../middleware/cacheMiddleware";
const router = express.Router();

// All appointment routes require authentication and appointment access
// Only Admin with patientManagement=true OR Staff with bookAppointmentAccess=true can access
router.use(authenticateUser);
router.use(requireAppointmentAccess);

// Write operations - with cache invalidation
router.post("/create", appointmentsCacheInvalidation, createAppointment);
router.put("/:id", appointmentsCacheInvalidation, updateAppointment);
router.patch("/:id/status", appointmentsCacheInvalidation, updateAppointmentStatus);
router.delete("/:id", appointmentsCacheInvalidation, deleteAppointment);

// Read operations - with caching
// Get all appointments with filters
router.get("/", appointmentsCacheMiddleware, getAllAppointments);

// Get today's appointments (with shorter cache TTL)
router.get("/today", todaysAppointmentsCacheMiddleware, getTodaysAppointments);

// Get appointments by department
router.get("/department/:department", appointmentsCacheMiddleware, getAppointmentsByDepartment);

// Get appointment by ID
router.get("/:id", appointmentsCacheMiddleware, getAppointmentById);

export default router;
