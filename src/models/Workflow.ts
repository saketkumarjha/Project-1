import mongoose, { Document, Schema } from "mongoose";

// Interface for Workflow document (MVP version - based on UI)
export interface IWorkflow extends Document {
  workflowId: string;
  patientId: mongoose.Types.ObjectId;
  patientName: string;
  uhid: string; // Unique Hospital ID
  startedDate: Date;
  currentStage: string;
  currentStageNumber: number;
  totalStages: number;
  status: "active" | "completed" | "cancelled" | "on-hold";
  stages: IWorkflowStage[];
  recentActivity: IRecentActivity[];
  createdBy: {
    userId: mongoose.Types.ObjectId;
    userType: "admin" | "staff";
    name: string;
  };
  updatedBy?: {
    userId: mongoose.Types.ObjectId;
    userType: "admin" | "staff";
    name: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for individual workflow stages
export interface IWorkflowStage {
  stageNumber: number;
  stageName: string;
  stageType:
    | "registration"
    | "triage"
    | "consultation"
    | "diagnostics"
    | "treatment-planning"
    | "active-treatment"
    | "observation"
    | "pre-discharge"
    | "billing"
    | "discharge";
  status: "pending" | "in-progress" | "completed" | "skipped";
  startedAt?: Date;
  completedAt?: Date;
  assignedTo?: {
    userId: mongoose.Types.ObjectId;
    userType: "admin" | "staff";
    name: string;
    department?: string;
  };
  notes?: string;
  patientCount?: number; // For display purposes (like "1 patient")
  description?: string; // Stage description
}

// Interface for recent activity tracking
export interface IRecentActivity {
  activityType:
    | "stage-started"
    | "stage-completed"
    | "stage-updated"
    | "note-added"
    | "assignment-changed";
  stageName: string;
  description: string;
  timestamp: Date;
  performedBy: {
    userId: mongoose.Types.ObjectId;
    userType: "admin" | "staff";
    name: string;
  };
}

// Workflow Schema (MVP version)
const workflowSchema = new Schema<IWorkflow>(
  {
    workflowId: {
      type: String,
      unique: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    uhid: {
      type: String,
      required: true,
      trim: true,
    },
    startedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    currentStage: {
      type: String,
      required: true,
      enum: [
        "Registration",
        "Triage",
        "Consultation",
        "Diagnostics",
        "Treatment Planning",
        "Active Treatment",
        "Observation",
        "Pre-Discharge",
        "Billing",
        "Discharge",
      ],
      default: "Registration",
    },
    currentStageNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 1,
    },
    totalStages: {
      type: Number,
      required: true,
      default: 10,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "on-hold"],
      default: "active",
    },
    stages: [
      {
        stageNumber: {
          type: Number,
          required: true,
        },
        stageName: {
          type: String,
          required: true,
        },
        stageType: {
          type: String,
          enum: [
            "registration",
            "triage",
            "consultation",
            "diagnostics",
            "treatment-planning",
            "active-treatment",
            "observation",
            "pre-discharge",
            "billing",
            "discharge",
          ],
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "in-progress", "completed", "skipped"],
          default: "pending",
        },
        startedAt: {
          type: Date,
        },
        completedAt: {
          type: Date,
        },
        assignedTo: {
          userId: {
            type: Schema.Types.ObjectId,
          },
          userType: {
            type: String,
            enum: ["admin", "staff"],
          },
          name: {
            type: String,
          },
          department: {
            type: String,
          },
        },
        notes: {
          type: String,
          trim: true,
        },
        patientCount: {
          type: Number,
          default: 1,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    recentActivity: [
      {
        activityType: {
          type: String,
          enum: [
            "stage-started",
            "stage-completed",
            "stage-updated",
            "note-added",
            "assignment-changed",
          ],
          required: true,
        },
        stageName: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        performedBy: {
          userId: {
            type: Schema.Types.ObjectId,
            required: true,
          },
          userType: {
            type: String,
            enum: ["admin", "staff"],
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
        },
      },
    ],
    createdBy: {
      userId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      userType: {
        type: String,
        enum: ["admin", "staff"],
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    updatedBy: {
      userId: {
        type: Schema.Types.ObjectId,
      },
      userType: {
        type: String,
        enum: ["admin", "staff"],
      },
      name: {
        type: String,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate workflow ID
workflowSchema.pre("save", async function (next) {
  if (this.isNew) {
    const currentYear = new Date().getFullYear();
    const count = await mongoose.model("Workflow").countDocuments();
    this.workflowId = `WF-${currentYear}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

// Static method to initialize default workflow stages
workflowSchema.statics.createDefaultStages = function () {
  return [
    {
      stageNumber: 1,
      stageName: "Registration",
      stageType: "registration",
      status: "completed", // Usually completed when workflow is created
      description: "Patient registration and initial registration",
      patientCount: 1,
    },
    {
      stageNumber: 2,
      stageName: "Triage",
      stageType: "triage",
      status: "pending",
      description: "Priority assessment and vital signs",
      patientCount: 1,
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
};

// Instance methods
workflowSchema.methods.updateStage = function (
  stageNumber: number,
  status: string,
  userId: mongoose.Types.ObjectId,
  userType: string,
  userName: string
) {
  const stage = this.stages.find(
    (s: IWorkflowStage) => s.stageNumber === stageNumber
  );
  if (stage) {
    const oldStatus = stage.status;
    stage.status = status;

    if (status === "in-progress" && oldStatus !== "in-progress") {
      stage.startedAt = new Date();
    }

    if (status === "completed" && oldStatus !== "completed") {
      stage.completedAt = new Date();
    }

    // Update current stage if this stage is now in progress
    if (status === "in-progress") {
      this.currentStage = stage.stageName;
      this.currentStageNumber = stageNumber;
    }

    // Add to recent activity
    this.recentActivity.unshift({
      activityType:
        status === "completed" ? "stage-completed" : "stage-started",
      stageName: stage.stageName,
      description: `${stage.stageName}: ${
        status === "completed" ? "Completed" : "Started"
      }`,
      timestamp: new Date(),
      performedBy: {
        userId,
        userType,
        name: userName,
      },
    });

    // Keep only last 10 activities
    if (this.recentActivity.length > 10) {
      this.recentActivity = this.recentActivity.slice(0, 10);
    }
  }
};

workflowSchema.methods.addActivity = function (
  activityType: string,
  stageName: string,
  description: string,
  userId: mongoose.Types.ObjectId,
  userType: string,
  userName: string
) {
  this.recentActivity.unshift({
    activityType,
    stageName,
    description,
    timestamp: new Date(),
    performedBy: {
      userId,
      userType,
      name: userName,
    },
  });

  // Keep only last 10 activities
  if (this.recentActivity.length > 10) {
    this.recentActivity = this.recentActivity.slice(0, 10);
  }
};

// Indexes for better query performance
workflowSchema.index({ workflowId: 1 });
workflowSchema.index({ patientId: 1 });
workflowSchema.index({ uhid: 1 });
workflowSchema.index({ currentStage: 1 });
workflowSchema.index({ status: 1 });
workflowSchema.index({ startedDate: 1 });

const Workflow = mongoose.model<IWorkflow>("Workflow", workflowSchema);

export default Workflow;
