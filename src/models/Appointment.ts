import mongoose, { Document, Schema } from "mongoose";

// Interface for Appointment document (MVP version - only fields from UI)
export interface IAppointment extends Document {
  appointmentId: string;
  patientId: mongoose.Types.ObjectId;
  patientType: "existing" | "new";
  doctorName: string;
  department: string;
  appointmentDate: Date;
  appointmentTime: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  createdBy: {
    userId: mongoose.Types.ObjectId;
    userType: "admin" | "staff";
    name: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Appointment Schema (MVP version)
const appointmentSchema = new Schema<IAppointment>(
  {
    appointmentId: {
      type: String,
      unique: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    patientType: {
      type: String,
      enum: ["existing", "new"],
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      enum: [
        "Cardiology",
        "Neurology",
        "Orthopedics",
        "Pediatrics",
        "General Medicine",
        "Surgery",
        "Emergency",
        "Radiology",
      ],
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled"],
      default: "scheduled",
    },
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate appointment ID
appointmentSchema.pre("save", async function (next) {
  if (this.isNew) {
    const currentYear = new Date().getFullYear();
    const count = await mongoose.model("Appointment").countDocuments();
    this.appointmentId = `APT-${currentYear}-${String(count + 1).padStart(
      5,
      "0"
    )}`;
  }
  next();
});

// Indexes for better query performance
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ department: 1 });
appointmentSchema.index({ doctorName: 1 });
appointmentSchema.index({ status: 1 });

// Instance methods
appointmentSchema.methods.canBeCancelled = function (): boolean {
  return this.status === "scheduled" || this.status === "confirmed";
};

appointmentSchema.methods.isUpcoming = function (): boolean {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  return (
    appointmentDateTime > now &&
    this.status !== "cancelled" &&
    this.status !== "completed"
  );
};

// Static methods
appointmentSchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date
) {
  return this.find({
    appointmentDate: {
      $gte: startDate,
      $lte: endDate,
    },
    isActive: true,
  });
};

appointmentSchema.statics.findByDepartment = function (department: string) {
  return this.find({
    department,
    isActive: true,
  }).sort({ appointmentDate: 1, appointmentTime: 1 });
};

appointmentSchema.statics.findByDoctor = function (doctorName: string) {
  return this.find({
    doctorName,
    isActive: true,
  }).sort({ appointmentDate: 1, appointmentTime: 1 });
};

const Appointment = mongoose.model<IAppointment>(
  "Appointment",
  appointmentSchema
);

export default Appointment;
