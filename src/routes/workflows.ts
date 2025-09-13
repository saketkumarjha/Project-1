import express from "express";
import { authenticateUser, requireWorkflowAccess } from "../middleware/auth";
import {
  createWorkflow,
  getAllWorkflows,
  getWorkflowById,
  updateWorkflowStage,
  updateWorkflowStatus,
  deleteWorkflow,
  getWorkflowsByStatus,
  getWorkflowsByStage,
} from "../controllers/workflowController";

const router = express.Router();

// All workflow routes require authentication and workflow access
// Only Admin with patientManagement=true OR Staff with workflowAccess=true can access
router.use(authenticateUser);
router.use(requireWorkflowAccess);

// Create new workflow
router.post("/create", createWorkflow);

// Get all workflows with filters
router.get("/", getAllWorkflows);

// Get workflows by status
router.get("/status/:status", getWorkflowsByStatus);

// Get workflows by current stage
router.get("/stage/:stage", getWorkflowsByStage);

// Get workflow by ID
router.get("/:id", getWorkflowById);

// Update workflow stage
router.put("/:id/stage", updateWorkflowStage);

// Update workflow status only
router.patch("/:id/status", updateWorkflowStatus);

// Delete workflow (soft delete)
router.delete("/:id", deleteWorkflow);

export default router;
