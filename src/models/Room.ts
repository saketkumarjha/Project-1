import mongoose, { Document, Schema } from "mongoose";

// Interface for Room document (MVP version - based on UI)
export interface IRoom extends Document {
  roomNumber: string;
  roomType:
    | "General"
    | "ICU"
    | "Emergency"
    | "Surgery"
    | "Private"
    | "Semi-Private";
  department: string;
  floor: number;
  maxOccupancy: number;
  currentOccupancy: number;
  pricePerDay: number;
  status:
    | "Available"
    | "Occupied"
    | "Partially-Occupied"
    | "Maintenance"
    | "Reserved";
  patientAssignments: IPatientAssignment[];
  amenities: string[];
  notes?: string;
  lastCleaned?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for patient assignments in rooms
export interface IPatientAssignment {
  bedNumber: string;
  patientId: mongoose.Types.ObjectId;
  patientName: string;
  uhid: string;
  admittedDate: Date;
  expectedDischargeDate?: Date;
  status: "Active" | "Discharge" | "Transferred";
}

// Room Schema (MVP version)
const roomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    roomType: {
      type: String,
      enum: [
        "General",
        "ICU",
        "Emergency",
        "Surgery",
        "Private",
        "Semi-Private",
      ],
      required: true,
      default: "General",
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
      min: 1,
    },
    maxOccupancy: {
      type: Number,
      required: true,
      min: 1,
      default: 2,
    },
    currentOccupancy: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    pricePerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "Available",
        "Occupied",
        "Partially-Occupied",
        "Maintenance",
        "Reserved",
      ],
      default: "Available",
    },
    patientAssignments: [
      {
        bedNumber: {
          type: String,
          required: true,
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
        admittedDate: {
          type: Date,
          required: true,
          default: Date.now,
        },
        expectedDischargeDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["Active", "Discharge", "Transferred"],
          default: "Active",
        },
      },
    ],
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    lastCleaned: {
      type: Date,
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

// Pre-save middleware to update room status based on occupancy
roomSchema.pre("save", function (next) {
  // Update current occupancy based on active patient assignments
  this.currentOccupancy = this.patientAssignments.filter(
    (assignment: IPatientAssignment) => assignment.status === "Active"
  ).length;

  // Only auto-update status if not manually set to Maintenance or Reserved
  if (this.status !== "Maintenance" && this.status !== "Reserved") {
    // Update room status based on occupancy
    if (this.currentOccupancy === 0) {
      this.status = "Available";
    } else if (this.currentOccupancy < this.maxOccupancy) {
      this.status = "Partially-Occupied";
    } else if (this.currentOccupancy >= this.maxOccupancy) {
      this.status = "Occupied";
    }
  }

  next();
});

// Instance methods
roomSchema.methods.addPatient = function (
  bedNumber: string,
  patientId: mongoose.Types.ObjectId,
  patientName: string,
  uhid: string,
  expectedDischargeDate?: Date
) {
  // Check if room has capacity
  if (this.currentOccupancy >= this.maxOccupancy) {
    throw new Error("Room is at maximum capacity");
  }

  // Check if bed is already occupied
  const existingAssignment = this.patientAssignments.find(
    (assignment: IPatientAssignment) =>
      assignment.bedNumber === bedNumber && assignment.status === "Active"
  );

  if (existingAssignment) {
    throw new Error(`Bed ${bedNumber} is already occupied`);
  }

  // Add patient assignment
  this.patientAssignments.push({
    bedNumber,
    patientId,
    patientName,
    uhid,
    admittedDate: new Date(),
    expectedDischargeDate,
    status: "Active",
  });
};

roomSchema.methods.dischargePatient = function (
  patientId: mongoose.Types.ObjectId
) {
  const assignment = this.patientAssignments.find(
    (assignment: IPatientAssignment) =>
      assignment.patientId.toString() === patientId.toString() &&
      assignment.status === "Active"
  );

  if (!assignment) {
    throw new Error("Patient not found in this room");
  }

  assignment.status = "Discharge";
};

roomSchema.methods.transferPatient = function (
  patientId: mongoose.Types.ObjectId
) {
  const assignment = this.patientAssignments.find(
    (assignment: IPatientAssignment) =>
      assignment.patientId.toString() === patientId.toString() &&
      assignment.status === "Active"
  );

  if (!assignment) {
    throw new Error("Patient not found in this room");
  }

  assignment.status = "Transferred";
};

// Static methods
roomSchema.statics.getAvailableRooms = function () {
  return this.find({
    status: { $in: ["Available", "Partially-Occupied"] },
    isActive: true,
  });
};

roomSchema.statics.getRoomsWithAvailableBeds = function () {
  return this.find({
    $expr: { $lt: ["$currentOccupancy", "$maxOccupancy"] },
    status: { $nin: ["Maintenance", "Reserved"] },
    isActive: true,
  });
};

roomSchema.statics.getRoomsByDepartment = function (department: string) {
  return this.find({
    department,
    isActive: true,
  }).populate("patientAssignments.patientId", "firstName lastName phoneNumber");
};

roomSchema.statics.getRoomsByFloor = function (floor: number) {
  return this.find({
    floor,
    isActive: true,
  }).populate("patientAssignments.patientId", "firstName lastName phoneNumber");
};

// Indexes for better query performance
roomSchema.index({ roomNumber: 1 });
roomSchema.index({ department: 1 });
roomSchema.index({ floor: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ "patientAssignments.patientId": 1 });
roomSchema.index({ "patientAssignments.uhid": 1 });

const Room = mongoose.model<IRoom>("Room", roomSchema);

export default Room;
