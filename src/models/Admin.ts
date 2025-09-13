import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
//The Document interface essentially transforms your plain TypeScript interface into a fully-functional
//database document with all the methods needed to interact with MongoDB.
// Admin permissions interface - all access for admin users
export interface IAdminPermissions {
  staffManagement: boolean;
  adminManagement: boolean;
  accountantManagement: boolean;
  patientManagement: boolean;
  systemSettings: boolean;
  reportAccess: boolean;
  billingAccess: boolean;
}

// Admin interface - simplified for MVP with profile image and all access permissions
export interface IAdmin extends Document {
  username: string;
  password: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
  profileImage?: string; // Simple URL string for profile image
  permissions: IAdminPermissions;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: keyof IAdminPermissions): boolean;
}

// Admin schema - simplified for MVP
const AdminSchema = new Schema<IAdmin>(
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
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "super_admin"],
      default: "admin",
    },
    profileImage: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Optional field
          // Basic URL validation for image
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: "Profile image must be a valid image URL",
      },
    },
    permissions: {
      staffManagement: {
        type: Boolean,
        default: true,
      },
      adminManagement: {
        type: Boolean,
        default: function () {
          return this.role === "super_admin";
        },
      },
      accountantManagement: {
        type: Boolean,
        default: true,
      },
      patientManagement: {
        type: Boolean,
        default: true,
      },
      systemSettings: {
        type: Boolean,
        default: function () {
          return this.role === "super_admin";
        },
      },
      reportAccess: {
        type: Boolean,
        default: true,
      },
      billingAccess: {
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
//The pre-save middleware is a Mongoose hook that runs automatically before a
//document is saved to the database. Here's how it works:
// Pre-save middleware for password hashing
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});
//This is a custom method you can call on any
//admin document to verify if a provided password matches the stored hashed password:
// Instance method to compare password
AdminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Instance method to check permissions
AdminSchema.methods.hasPermission = function (
  permission: keyof IAdminPermissions
): boolean {
  return this.permissions[permission] === true;
};

export default mongoose.model<IAdmin>("Admin", AdminSchema);
