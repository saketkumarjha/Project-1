// Patient Types
export interface IPatient {
  _id?: string;
  uhid: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  phone: string;
  address: string;
  status: "Active" | "Discharged";
  createdAt?: Date;
  updatedAt?: Date;
}

// Appointment Types
export interface IAppointment {
  _id?: string;
  patientId: string;
  doctorName: string;
  department: string;
  date: Date;
  time: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  createdAt?: Date;
  updatedAt?: Date;
}

// Workflow Types
export type WorkflowStage =
  | "Registration"
  | "Consultation"
  | "Treatment"
  | "Billing"
  | "Discharge";

export interface IWorkflowStage {
  name: WorkflowStage;
  completedAt?: Date;
  notes?: string;
}

export interface IWorkflow {
  _id?: string;
  patientId: string;
  currentStage: WorkflowStage;
  stages: IWorkflowStage[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Room Types
export type RoomType =
  | "General"
  | "Private"
  | "ICU"
  | "Emergency"
  | "Surgery"
  | "Maternity"
  | "Pediatric";
export type RoomStatus = "Available" | "Occupied" | "Maintenance" | "Reserved";

export interface IRoom {
  _id?: string;
  roomNumber: string;
  roomType: RoomType;
  floor: number;
  department: string;
  capacity: number;
  currentOccupancy: number;
  status: RoomStatus;
  amenities: string[];
  pricePerDay: number;
  assignedPatients: string[];
  lastCleaned: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRoomAssignment {
  _id?: string;
  roomId: string;
  patientId: string;
  bedNumber?: string;
  admissionDate: Date;
  expectedDischargeDate?: Date;
  actualDischargeDate?: Date;
  status: "Active" | "Discharged" | "Transferred";
  createdAt?: Date;
  updatedAt?: Date;
}

// Admin Types - simplified for MVP with profile image
export interface IAdmin {
  _id?: string;
  username: string;
  password?: string; // Optional in responses for security
  email: string;
  name: string;
  role: "admin" | "super_admin";
  profileImage?: string; // Simple URL string for profile image
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
