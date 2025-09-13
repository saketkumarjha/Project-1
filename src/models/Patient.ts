import mongoose, { Document, Schema } from "mongoose";

// Patient interface
export interface IPatient extends Document {
  // Auto-generated fields
  patientId: string;

  // Personal Information (Emergency fields - required)
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  phoneNumber: string;
  address: string;

  // Personal Information (Normal registration - optional)
  gender?: "male" | "female" | "other";
  email?: string;
  alternatePhone?: string;

  // Identity Verification (optional)
  idType?: "passport" | "driver_license" | "national_id" | "other";
  idNumber?: string;

  // Emergency Contact (required)
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    alternateContact?: string;
  };

  // Medical Information (optional)
  knownAllergies?: string;
  currentMedications?: string;
  chronicConditions?: string;
  previousSurgeries?: string;
  preferredLanguage?: string;

  // Insurance & Payment (optional)
  insuranceStatus?: "insured" | "uninsured" | "self_pay" | "government";
  paymentMethod?: "cash" | "credit_card" | "debit_card" | "insurance" | "other";

  // Admission Details (optional)
  reasonForVisit?: string;
  patientType?: "inpatient" | "outpatient" | "emergency" | "consultation";

  // Additional fields (optional)
  referringPhysician?: string;
  specialInstructions?: string;
  patientImage?: string; // URL/path for patient profile image

  // System fields
  registrationType: "emergency" | "normal";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Patient schema
const PatientSchema = new Schema<IPatient>(
  {
    patientId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Personal Information (Emergency - required)
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    // Personal Information (Normal - optional)
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    alternatePhone: {
      type: String,
      trim: true,
    },

    // Identity Verification (optional)
    idType: {
      type: String,
      enum: ["passport", "driver_license", "national_id", "other"],
    },
    idNumber: {
      type: String,
      trim: true,
    },

    // Emergency Contact (required)
    emergencyContact: {
      name: {
        type: String,
        required: [true, "Emergency contact name is required"],
        trim: true,
      },
      relationship: {
        type: String,
        required: [true, "Emergency contact relationship is required"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Emergency contact phone is required"],
        trim: true,
      },
      alternateContact: {
        type: String,
        trim: true,
      },
    },

    // Medical Information (optional)
    knownAllergies: {
      type: String,
      trim: true,
    },
    currentMedications: {
      type: String,
      trim: true,
    },
    chronicConditions: {
      type: String,
      trim: true,
    },
    previousSurgeries: {
      type: String,
      trim: true,
    },
    preferredLanguage: {
      type: String,
      trim: true,
    },

    // Insurance & Payment (optional)
    insuranceStatus: {
      type: String,
      enum: ["insured", "uninsured", "self_pay", "government"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit_card", "debit_card", "insurance", "other"],
    },

    // Admission Details (optional)
    reasonForVisit: {
      type: String,
      trim: true,
    },
    patientType: {
      type: String,
      enum: ["inpatient", "outpatient", "emergency", "consultation"],
    },

    // Additional fields (optional)
    referringPhysician: {
      type: String,
      trim: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
    },
    patientImage: {
      type: String,
      default: "/images/default-patient-avatar.png",
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^(https?:\/\/.+\.(jpg|jpeg|png|gif|webp)|\/[\w\/-]+\.(jpg|jpeg|png|gif|webp))$/i.test(
            v
          );
        },
        message: "Patient image must be a valid image URL or file path",
      },
    },

    // System fields
    registrationType: {
      type: String,
      enum: ["emergency", "normal"],
      required: [true, "Registration type is required"],
      default: "normal",
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

// Pre-save middleware to generate patient ID
PatientSchema.pre("save", async function (next) {
  if (this.isNew && !this.patientId) {
    try {
      // Generate patient ID format: PAT-YYYY-NNNNNN
      const year = new Date().getFullYear();
      const count = await mongoose.model("Patient").countDocuments();
      const patientId = `PAT-${year}-${String(count + 1).padStart(6, "0")}`;
      this.patientId = patientId;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Indexes for performance
PatientSchema.index({ patientId: 1 });
PatientSchema.index({ firstName: 1, lastName: 1 });
PatientSchema.index({ phoneNumber: 1 });
PatientSchema.index({ email: 1 });
PatientSchema.index({ registrationType: 1 });
PatientSchema.index({ isActive: 1 });
PatientSchema.index({ createdAt: -1 });

export default mongoose.model<IPatient>("Patient", PatientSchema);
