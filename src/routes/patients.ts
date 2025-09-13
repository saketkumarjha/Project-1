import express from "express";
import { authenticateUser, requirePatientAccess } from "../middleware/auth";
import {
  createPatient,
  getAllPatients,
  getPatientById,
  getPatientByPatientId,
  updatePatient,
  deletePatient,
  emergencyRegistration,
} from "../controllers/patientController";
const router = express.Router();

// All patient routes require authentication and patient access
router.use(authenticateUser);
router.use(requirePatientAccess);

// Create new patient (Only for Admin with patientManagement=true OR Staff with patientAccess=true)
router.post("/create", createPatient);
router.get("/getAllPatients", getAllPatients);
router.get("/getPatientById/:id", getPatientById);
router.get("/getPatientByPatientId/:patientId", getPatientByPatientId);
router.put("/updatePatient/:id", updatePatient);
router.delete("/deletePatient/:id", deletePatient);
router.post("/emergencyRegistration", emergencyRegistration);

export default router;
