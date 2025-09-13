import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Simplified Staff permissions for MVP
export interface IStaffPermissions {
  patientAccess: boolean;
  registerPatientAccess: boolean;
  bookAppointmentAccess: boolean;
  roomManagementAccess: boolean;
  workflowAccess: boolean;
}

// Simplified Staff interface for MVP
export interface IStaff extends Document {
  username: string;
  password: string;
  email: string;
  employeeId: string;
  name: string;
  department: string;
  contact: string;
  shift: "morning" | "evening" | "night";
  profileImage?: string; // URL/path for profile image
  permissions: IStaffPermissions;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: keyof IStaffPermissions): boolean;
}

// Simplified Staff schema for MVP
const StaffSchema = new Schema<IStaff>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      enum: [
        "Emergency",
        "General Medicine",
        "Surgery",
        "ICU",
        "Nursing",
        "Administration",
      ],
    },
    contact: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    shift: {
      type: String,
      required: [true, "Shift is required"],
      enum: ["morning", "evening", "night"],
    },
    profileImage: {
      type: String,
      default: "/images/default-avatar.png",
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^(https?:\/\/.+\.(jpg|jpeg|png|gif|webp)|\/[\w\/-]+\.(jpg|jpeg|png|gif|webp))$/i.test(
            v
          );
        },
        message: "Profile image must be a valid image URL or file path",
      },
    },
    permissions: {
      patientAccess: {
        type: Boolean,
        default: true,
      },
      registerPatientAccess: {
        type: Boolean,
        default: false,
      },
      bookAppointmentAccess: {
        type: Boolean,
        default: true,
      },
      roomManagementAccess: {
        type: Boolean,
        default: false,
      },
      workflowAccess: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete (ret as any).password;
        return ret;
      },
    },
  }
);

// Pre-save middleware for password hashing
StaffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
StaffSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Instance method to check permissions
StaffSchema.methods.hasPermission = function (
  permission: keyof IStaffPermissions
): boolean {
  return this.permissions[permission] === true;
};

// Basic indexes for performance (employeeId already has unique index)
StaffSchema.index({ department: 1 });
StaffSchema.index({ isActive: 1 });

export default mongoose.model<IStaff>("Staff", StaffSchema);
