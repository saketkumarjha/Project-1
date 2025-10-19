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
import { workflowsCacheMiddleware, workflowsCacheInvalidation } from "../middleware/cacheMiddleware";
const router = express.Router();

// All workflow routes require authentication and workflow access
// Only Admin with patientManagement=true OR Staff with workflowAccess=true can access
router.use(authenticateUser);
router.use(requireWorkflowAccess);

// Write operations - with cache invalidation
router.post("/create", workflowsCacheInvalidation, createWorkflow);
router.put("/:id/stage", workflowsCacheInvalidation, updateWorkflowStage);
router.patch("/:id/status", workflowsCacheInvalidation, updateWorkflowStatus);
router.delete("/:id", workflowsCacheInvalidation, deleteWorkflow);

// Read operations - with caching
// Get all workflows with filters
router.get("/", workflowsCacheMiddleware, getAllWorkflows);

// Get workflows by status
router.get("/status/:status", workflowsCacheMiddleware, getWorkflowsByStatus);

// Get workflows by current stage
router.get("/stage/:stage", workflowsCacheMiddleware, getWorkflowsByStage);

// Get workflow by ID
router.get("/:id", workflowsCacheMiddleware, getWorkflowById);

export default router;
