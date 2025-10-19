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
import { patientsCacheMiddleware, patientsCacheInvalidation } from "../middleware/cacheMiddleware";
const router = express.Router();

router.use(authenticateUser);
router.use(requirePatientAccess);

router.get("/getAllPatients", patientsCacheMiddleware, getAllPatients);
router.get("/getPatientById/:id", patientsCacheMiddleware, getPatientById);
router.get("/getPatientByPatientId/:patientId", patientsCacheMiddleware, getPatientByPatientId);

router.post("/create", patientsCacheInvalidation, createPatient);
router.put("/updatePatient/:id", patientsCacheInvalidation, updatePatient);
router.delete("/deletePatient/:id", patientsCacheInvalidation, deletePatient);
router.post("/emergencyRegistration", patientsCacheInvalidation, emergencyRegistration);

export default router;
