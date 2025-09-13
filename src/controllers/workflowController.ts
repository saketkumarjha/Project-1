import { Request, Response } from "express";
import mongoose from "mongoose";
import Workflow from "../models/Workflow";
import Patient from "../models/Patient";

// Create new workflow
export const createWorkflow = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId, patientName, uhid } = req.body;

    // Validate required fields
    if (!patientId || !patientName || !uhid) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: patientId, patientName, uhid",
      });
      return;
    }

    // Validate ObjectId format for patientId
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      res.status(400).json({
        success: false,
        message: "Invalid patient ID format",
      });
      return;
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    // Check if workflow already exists for this patient
    const existingWorkflow = await Workflow.findOne({
      patientId,
      isActive: true,
      status: { $in: ["active", "on-hold"] },
    });

    if (existingWorkflow) {
      res.status(400).json({
        success: false,
        message: "Active workflow already exists for this patient",
        data: { existingWorkflow },
      });
      return;
    }

    // Create default stages
    const defaultStages = [
      {
        stageNumber: 1,
        stageName: "Registration",
        stageType: "registration",
        status: "completed",
        description: "Patient registration and initial registration",
        patientCount: 1,
        startedAt: new Date(),
        completedAt: new Date(),
      },
      {
        stageNumber: 2,
        stageName: "Triage",
        stageType: "triage",
        status: "in-progress",
        description: "Priority assessment and vital signs",
        patientCount: 1,
        startedAt: new Date(),
      },
      {
        stageNumber: 3,
        stageName: "Consultation",
        stageType: "consultation",
        status: "pending",
        description: "Doctor examination and history taking",
        patientCount: 1,
      },
      {
        stageNumber: 4,
        stageName: "Diagnostics",
        stageType: "diagnostics",
        status: "pending",
        description: "Lab work, imaging, and diagnostic procedures",
        patientCount: 1,
      },
      {
        stageNumber: 5,
        stageName: "Treatment Planning",
        stageType: "treatment-planning",
        status: "pending",
        description: "Care team reviews results and creates treatment plan",
        patientCount: 0,
      },
      {
        stageNumber: 6,
        stageName: "Active Treatment",
        stageType: "active-treatment",
        status: "pending",
        description: "Medication administration, procedures, surgery",
        patientCount: 1,
      },
      {
        stageNumber: 7,
        stageName: "Observation",
        stageType: "observation",
        status: "pending",
        description: "Patient treatment monitoring and recovery",
        patientCount: 1,
      },
      {
        stageNumber: 8,
        stageName: "Pre-Discharge",
        stageType: "pre-discharge",
        status: "pending",
        description: "Discharge planning and coordination",
        patientCount: 0,
      },
      {
        stageNumber: 9,
        stageName: "Billing",
        stageType: "billing",
        status: "pending",
        description: "Bill processing and financial clearance",
        patientCount: 0,
      },
      {
        stageNumber: 10,
        stageName: "Discharge",
        stageType: "discharge",
        status: "pending",
        description: "Patient discharge and handoff to primary care",
        patientCount: 0,
      },
    ];

    // Get user info for activities
    const userId = req.userType === "admin" ? req.admin?._id : req.staff?._id;
    const userName =
      req.userType === "admin" ? req.admin?.name : req.staff?.name;

    // Initial activity
    const initialActivity = [
      {
        activityType: "stage-completed",
        stageName: "Registration",
        description: "Registration: Patient registered successfully",
        timestamp: new Date(),
        performedBy: {
          userId: new mongoose.Types.ObjectId(userId!.toString()),
          userType: req.userType,
          name: userName,
        },
      },
      {
        activityType: "stage-started",
        stageName: "Triage",
        description: "Triage: Assessment started",
        timestamp: new Date(),
        performedBy: {
          userId: new mongoose.Types.ObjectId(userId!.toString()),
          userType: req.userType,
          name: userName,
        },
      },
    ];

    // Create workflow data
    const workflowData = {
      patientId,
      patientName,
      uhid,
      startedDate: new Date(),
      currentStage: "Triage",
      currentStageNumber: 2,
      status: "active",
      stages: defaultStages,
      recentActivity: initialActivity,
      createdBy: {
        userId: new mongoose.Types.ObjectId(userId!.toString()),
        userType: req.userType,
        name: userName,
      },
    };

    const workflow = new Workflow(workflowData);
    await workflow.save();

    res.status(201).json({
      success: true,
      message: "Workflow created successfully",
      data: {
        workflow,
        createdBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating workflow",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all workflows with filters
export const getAllWorkflows = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      status,
      currentStage,
      patientName,
      uhid,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query object
    const query: any = { isActive: true };

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by current stage
    if (currentStage && currentStage !== "all") {
      query.currentStage = currentStage;
    }

    // Search by patient name
    if (patientName) {
      query.patientName = { $regex: patientName, $options: "i" };
    }

    // Search by UHID
    if (uhid) {
      query.uhid = { $regex: uhid, $options: "i" };
    }

    // Filter by date range
    if (fromDate || toDate) {
      query.startedDate = {};
      if (fromDate) {
        query.startedDate.$gte = new Date(fromDate as string);
      }
      if (toDate) {
        const endDate = new Date(toDate as string);
        endDate.setHours(23, 59, 59, 999);
        query.startedDate.$lte = endDate;
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get workflows with patient details
    const workflows = await Workflow.find(query)
      .populate(
        "patientId",
        "firstName lastName phoneNumber patientId dateOfBirth"
      )
      .sort({ startedDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    // Get total count for pagination
    const totalWorkflows = await Workflow.countDocuments(query);
    const totalPages = Math.ceil(totalWorkflows / limitNum);

    res.json({
      success: true,
      message: "Workflows retrieved successfully",
      data: {
        workflows,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalWorkflows,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching workflows",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get workflow by ID
export const getWorkflowById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid workflow ID format",
      });
      return;
    }

    const workflow = await Workflow.findById(id)
      .populate(
        "patientId",
        "firstName lastName phoneNumber patientId dateOfBirth address"
      )
      .select("-__v");

    if (!workflow) {
      res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Workflow details retrieved successfully",
      data: {
        workflow,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching workflow details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update workflow stage
export const updateWorkflowStage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { stageNumber, status, notes } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid workflow ID format",
      });
      return;
    }

    // Validate required fields
    if (!stageNumber || !status) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: stageNumber, status",
      });
      return;
    }

    // Validate status
    const validStatuses = ["pending", "in-progress", "completed", "skipped"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
      return;
    }

    const workflow = await Workflow.findById(id);
    if (!workflow) {
      res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
      return;
    }

    // Get user info
    const userId = req.userType === "admin" ? req.admin?._id : req.staff?._id;
    const userName =
      req.userType === "admin" ? req.admin?.name : req.staff?.name;

    // Find and update the stage
    const stage = workflow.stages.find((s) => s.stageNumber === stageNumber);
    if (!stage) {
      res.status(404).json({
        success: false,
        message: "Stage not found",
      });
      return;
    }

    const oldStatus = stage.status;
    stage.status = status;

    // Update stage timestamps
    if (status === "in-progress" && oldStatus !== "in-progress") {
      stage.startedAt = new Date();
    }

    if (status === "completed" && oldStatus !== "completed") {
      stage.completedAt = new Date();
    }

    // Update current stage if this stage is now in progress
    if (status === "in-progress") {
      workflow.currentStage = stage.stageName;
      workflow.currentStageNumber = stageNumber;
    }

    // Add notes if provided
    if (notes) {
      stage.notes = notes;
    }

    // Add activity to recent activity
    const activityType =
      status === "completed"
        ? "stage-completed"
        : status === "in-progress"
        ? "stage-started"
        : "stage-updated";

    const activityDescription = notes
      ? `${stage.stageName}: ${
          status === "completed"
            ? "Completed"
            : status === "in-progress"
            ? "Started"
            : "Updated"
        } - ${notes}`
      : `${stage.stageName}: ${
          status === "completed"
            ? "Completed"
            : status === "in-progress"
            ? "Started"
            : "Updated"
        }`;

    workflow.recentActivity.unshift({
      activityType: activityType as any,
      stageName: stage.stageName,
      description: activityDescription,
      timestamp: new Date(),
      performedBy: {
        userId: new mongoose.Types.ObjectId(userId!.toString()),
        userType: req.userType as "admin" | "staff",
        name: userName!,
      },
    });

    // Keep only last 10 activities
    if (workflow.recentActivity.length > 10) {
      workflow.recentActivity = workflow.recentActivity.slice(0, 10);
    }

    // Update updatedBy
    workflow.updatedBy = {
      userId: new mongoose.Types.ObjectId(userId!.toString()),
      userType: req.userType as "admin" | "staff",
      name: userName!,
    };

    await workflow.save();

    res.json({
      success: true,
      message: "Workflow stage updated successfully",
      data: {
        workflow,
        updatedBy: {
          userType: req.userType,
          name: userName,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating workflow stage",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update workflow status
export const updateWorkflowStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid workflow ID format",
      });
      return;
    }

    // Validate status
    const validStatuses = ["active", "completed", "cancelled", "on-hold"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
      return;
    }

    const userId = req.userType === "admin" ? req.admin?._id : req.staff?._id;
    const userName =
      req.userType === "admin" ? req.admin?.name : req.staff?.name;

    const workflow = await Workflow.findByIdAndUpdate(
      id,
      {
        status,
        updatedBy: {
          userId: new mongoose.Types.ObjectId(userId!.toString()),
          userType: req.userType,
          name: userName,
        },
      },
      { new: true, runValidators: true }
    )
      .populate("patientId", "firstName lastName phoneNumber patientId")
      .select("-__v");

    if (!workflow) {
      res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
      return;
    }

    // Add activity for status change
    workflow.recentActivity.unshift({
      activityType: "stage-updated",
      stageName: workflow.currentStage,
      description: `Workflow status changed to ${status}`,
      timestamp: new Date(),
      performedBy: {
        userId: new mongoose.Types.ObjectId(userId!.toString()),
        userType: req.userType as "admin" | "staff",
        name: userName!,
      },
    });

    // Keep only last 10 activities
    if (workflow.recentActivity.length > 10) {
      workflow.recentActivity = workflow.recentActivity.slice(0, 10);
    }

    await workflow.save();

    res.json({
      success: true,
      message: `Workflow status updated to ${status}`,
      data: {
        workflow,
        updatedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating workflow status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete workflow (soft delete)
export const deleteWorkflow = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid workflow ID format",
      });
      return;
    }

    const workflow = await Workflow.findByIdAndUpdate(
      id,
      {
        isActive: false,
        status: "cancelled",
        updatedBy: {
          userId: req.userType === "admin" ? req.admin?._id : req.staff?._id,
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
      { new: true }
    )
      .populate("patientId", "firstName lastName phoneNumber patientId")
      .select("-__v");

    if (!workflow) {
      res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Workflow cancelled successfully",
      data: {
        workflow,
        cancelledBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling workflow",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get workflows by status
export const getWorkflowsByStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.params;

    const workflows = await Workflow.find({
      status,
      isActive: true,
    })
      .populate("patientId", "firstName lastName phoneNumber patientId")
      .sort({ startedDate: -1 })
      .select("-__v");

    res.json({
      success: true,
      message: `${status} workflows retrieved successfully`,
      data: {
        workflows,
        status,
        count: workflows.length,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching workflows by status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get workflows by current stage
export const getWorkflowsByStage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { stage } = req.params;

    const workflows = await Workflow.find({
      currentStage: stage,
      isActive: true,
      status: "active",
    })
      .populate("patientId", "firstName lastName phoneNumber patientId")
      .sort({ startedDate: -1 })
      .select("-__v");

    res.json({
      success: true,
      message: `Workflows in ${stage} stage retrieved successfully`,
      data: {
        workflows,
        stage,
        count: workflows.length,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching workflows by stage",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
