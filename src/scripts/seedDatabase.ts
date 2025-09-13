import mongoose from "mongoose";
import Admin from "../models/Admin";
import Staff from "../models/Staff";
import Accountant from "../models/Accountant";
import Bill from "../models/Bill";
import Patient from "../models/Patient";
import Appointment from "../models/Appointment";
import Workflow from "../models/Workflow";
import Room from "../models/Room";
import connectDB from "../config/database";

// Sample data for seeding
const sampleAdmins = [
  {
    username: "admin1",
    password: "admin123",
    email: "admin1@hospital.com",
    name: "John Administrator",
    role: "super_admin" as const,
    profileImage: "https://example.com/images/admin1.jpg",
    permissions: {
      staffManagement: true,
      adminManagement: true,
      accountantManagement: true,
      patientManagement: true,
      systemSettings: true,
      reportAccess: true,
      billingAccess: true,
    },
  },
  {
    username: "admin2",
    password: "admin456",
    email: "admin2@hospital.com",
    name: "Sarah Manager",
    role: "admin" as const,
    permissions: {
      staffManagement: true,
      adminManagement: false,
      accountantManagement: true,
      patientManagement: true,
      systemSettings: false,
      reportAccess: true,
      billingAccess: true,
    },
  },
];

const sampleStaff = [
  {
    username: "nurse1",
    password: "nurse123",
    email: "nurse1@hospital.com",
    employeeId: "NUR001",
    name: "Emily Johnson",
    department: "Emergency",
    contact: "+1234567890",
    shift: "morning" as const,
    permissions: {
      patientAccess: true,
      registerPatientAccess: true,
      bookAppointmentAccess: true,
      roomManagementAccess: false,
      workflowAccess: true,
    },
  },
  {
    username: "doctor1",
    password: "doctor123",
    email: "doctor1@hospital.com",
    employeeId: "DOC001",
    name: "Dr. Michael Smith",
    department: "General Medicine",
    contact: "+1234567891",
    shift: "evening" as const,
    permissions: {
      patientAccess: true,
      registerPatientAccess: true,
      bookAppointmentAccess: true,
      roomManagementAccess: true,
      workflowAccess: true,
    },
  },
  {
    username: "surgeon1",
    password: "surgeon123",
    email: "surgeon1@hospital.com",
    employeeId: "SUR001",
    name: "Dr. Lisa Chen",
    department: "Surgery",
    contact: "+1234567892",
    shift: "night" as const,
    permissions: {
      patientAccess: true,
      registerPatientAccess: false,
      bookAppointmentAccess: true,
      roomManagementAccess: true,
      workflowAccess: true,
    },
  },
  {
    username: "icu_nurse",
    password: "icu123",
    email: "icunurse@hospital.com",
    employeeId: "ICU001",
    name: "Robert Wilson",
    department: "ICU",
    contact: "+1234567893",
    shift: "morning" as const,
    permissions: {
      patientAccess: true,
      registerPatientAccess: false,
      bookAppointmentAccess: false,
      roomManagementAccess: true,
      workflowAccess: true,
    },
  },
];

const sampleAccountants = [
  {
    username: "accountant1",
    password: "acc123",
    email: "accountant1@hospital.com",
    employeeId: "ACC001",
    name: "David Brown",
    contact: "+1234567894",
    permissions: {
      billingAccess: true,
      reportAccess: true,
    },
  },
  {
    username: "billing_clerk",
    password: "billing123",
    email: "billing@hospital.com",
    employeeId: "BIL001",
    name: "Maria Garcia",
    contact: "+1234567895",
    permissions: {
      billingAccess: true,
      reportAccess: false,
    },
  },
  {
    username: "finance_head",
    password: "finance123",
    email: "finance@hospital.com",
    employeeId: "FIN001",
    name: "James Taylor",
    contact: "+1234567896",
    permissions: {
      billingAccess: true,
      reportAccess: true,
    },
  },
];

const samplePatients = [
  // Emergency Registration Patients (minimal required fields)
  {
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: new Date("1985-06-15"),
    phoneNumber: "+1234567800",
    address: "123 Main Street, New York, NY 10001",
    emergencyContact: {
      name: "Jane Doe",
      relationship: "Wife",
      phone: "+1234567801",
    },
    patientImage: "https://example.com/images/patients/john-doe.jpg",
    registrationType: "emergency" as const,
    patientType: "emergency" as const,
    reasonForVisit: "Chest pain and shortness of breath",
  },
  {
    firstName: "Maria",
    lastName: "Garcia",
    dateOfBirth: new Date("1992-03-22"),
    phoneNumber: "+1234567802",
    address: "456 Oak Avenue, Los Angeles, CA 90001",
    emergencyContact: {
      name: "Carlos Garcia",
      relationship: "Husband",
      phone: "+1234567803",
    },
    patientImage: "https://example.com/images/patients/maria-garcia.jpg",
    registrationType: "emergency" as const,
    patientType: "emergency" as const,
    reasonForVisit: "Severe abdominal pain",
  },

  // Normal Registration Patients (comprehensive information)
  {
    firstName: "Robert",
    lastName: "Smith",
    dateOfBirth: new Date("1978-11-08"),
    phoneNumber: "+1234567804",
    address: "789 Pine Street, Chicago, IL 60601",
    gender: "male" as const,
    email: "robert.smith@email.com",
    alternatePhone: "+1234567805",
    idType: "driver_license" as const,
    idNumber: "DL123456789",
    emergencyContact: {
      name: "Mary Smith",
      relationship: "Mother",
      phone: "+1234567806",
      alternateContact: "+1234567807",
    },
    knownAllergies: "Penicillin, Shellfish",
    currentMedications: "Lisinopril 10mg daily",
    chronicConditions: "Hypertension",
    previousSurgeries: "Appendectomy (2010)",
    preferredLanguage: "English",
    insuranceStatus: "insured" as const,
    paymentMethod: "insurance" as const,
    reasonForVisit: "Annual physical examination",
    patientType: "outpatient" as const,
    referringPhysician: "Dr. Johnson",
    specialInstructions: "Patient prefers morning appointments",
    patientImage: "https://example.com/images/patients/robert-smith.jpg",
    registrationType: "normal" as const,
  },
  {
    firstName: "Emily",
    lastName: "Davis",
    dateOfBirth: new Date("1995-09-12"),
    phoneNumber: "+1234567808",
    address: "321 Elm Street, Houston, TX 77001",
    gender: "female" as const,
    email: "emily.davis@email.com",
    idType: "passport" as const,
    idNumber: "P987654321",
    emergencyContact: {
      name: "Tom Davis",
      relationship: "Father",
      phone: "+1234567809",
    },
    knownAllergies: "None known",
    currentMedications: "Birth control pills",
    chronicConditions: "Asthma (mild)",
    preferredLanguage: "English",
    insuranceStatus: "insured" as const,
    paymentMethod: "credit_card" as const,
    reasonForVisit: "Routine gynecological checkup",
    patientType: "outpatient" as const,
    patientImage: "https://example.com/images/patients/emily-davis.jpg",
    registrationType: "normal" as const,
  },
  {
    firstName: "Ahmed",
    lastName: "Hassan",
    dateOfBirth: new Date("1988-01-25"),
    phoneNumber: "+1234567810",
    address: "654 Maple Drive, Phoenix, AZ 85001",
    gender: "male" as const,
    email: "ahmed.hassan@email.com",
    alternatePhone: "+1234567811",
    idType: "national_id" as const,
    idNumber: "ID456789123",
    emergencyContact: {
      name: "Fatima Hassan",
      relationship: "Wife",
      phone: "+1234567812",
    },
    knownAllergies: "Latex",
    currentMedications: "Metformin 500mg twice daily",
    chronicConditions: "Type 2 Diabetes",
    preferredLanguage: "Arabic",
    insuranceStatus: "government" as const,
    paymentMethod: "insurance" as const,
    reasonForVisit: "Diabetes management consultation",
    patientType: "consultation" as const,
    referringPhysician: "Dr. Williams",
    patientImage: "https://example.com/images/patients/ahmed-hassan.jpg",
    registrationType: "normal" as const,
  },
  {
    firstName: "Lisa",
    lastName: "Chen",
    dateOfBirth: new Date("1990-07-30"),
    phoneNumber: "+1234567813",
    address: "987 Cedar Lane, Seattle, WA 98101",
    gender: "female" as const,
    email: "lisa.chen@email.com",
    emergencyContact: {
      name: "Michael Chen",
      relationship: "Brother",
      phone: "+1234567814",
    },
    knownAllergies: "Peanuts, Tree nuts",
    currentMedications: "EpiPen as needed",
    preferredLanguage: "English",
    insuranceStatus: "self_pay" as const,
    paymentMethod: "cash" as const,
    reasonForVisit: "Allergy consultation",
    patientType: "consultation" as const,
    patientImage: "https://example.com/images/patients/lisa-chen.jpg",
    registrationType: "normal" as const,
  },
];

const sampleRooms = [
  // Room 101 - Occupied (like in UI image)
  {
    roomNumber: "101",
    roomType: "General",
    department: "General Medicine",
    floor: 1,
    maxOccupancy: 2,
    pricePerDay: 150,
    patientAssignments: [
      {
        bedNumber: "Bed 1",
        patientId: new mongoose.Types.ObjectId("68bd9784846c12e797fd1427"),
        patientName: "John Doe",
        uhid: "UH001",
        admittedDate: new Date("2024-01-10"),
        expectedDischargeDate: new Date("2024-01-20"),
        status: "Active",
      },
      {
        bedNumber: "Bed 2",
        patientId: new mongoose.Types.ObjectId("68bd9784846c12e797fd142a"),
        patientName: "Jane Smith",
        uhid: "UH002",
        admittedDate: new Date("2024-01-12"),
        expectedDischargeDate: new Date("2024-01-18"),
        status: "Active",
      },
    ],
    amenities: ["TV", "AC", "Private Bathroom"],
    notes: "Recently renovated",
    lastCleaned: new Date("2024-01-15"),
  },

  // Room 102 - Available
  {
    roomNumber: "102",
    roomType: "General",
    department: "General Medicine",
    floor: 1,
    maxOccupancy: 2,
    pricePerDay: 150,
    patientAssignments: [],
    amenities: ["TV", "AC"],
    notes: "Ready for new patients",
    lastCleaned: new Date("2024-01-16"),
  },

  // Room 103 - Partially Occupied
  {
    roomNumber: "103",
    roomType: "General",
    department: "General Medicine",
    floor: 1,
    maxOccupancy: 2,
    pricePerDay: 150,
    patientAssignments: [
      {
        bedNumber: "Bed 1",
        patientId: new mongoose.Types.ObjectId("68bd9785846c12e797fd142d"),
        patientName: "Robert Smith",
        uhid: "UH003",
        admittedDate: new Date("2024-01-14"),
        expectedDischargeDate: new Date("2024-01-22"),
        status: "Active",
      },
    ],
    amenities: ["TV", "AC", "Private Bathroom"],
    notes: "One bed available",
    lastCleaned: new Date("2024-01-14"),
  },

  // Room 201 - ICU Room
  {
    roomNumber: "201",
    roomType: "ICU",
    department: "ICU",
    floor: 2,
    maxOccupancy: 1,
    pricePerDay: 500,
    patientAssignments: [
      {
        bedNumber: "ICU Bed 1",
        patientId: new mongoose.Types.ObjectId("68bd9785846c12e797fd1430"),
        patientName: "Emily Davis",
        uhid: "UH004",
        admittedDate: new Date("2024-01-13"),
        expectedDischargeDate: new Date("2024-01-19"),
        status: "Active",
      },
    ],
    amenities: ["Ventilator", "Cardiac Monitor", "IV Pump", "Private Bathroom"],
    notes: "Critical care unit with advanced monitoring",
    lastCleaned: new Date("2024-01-16"),
  },

  // Room 202 - ICU Available
  {
    roomNumber: "202",
    roomType: "ICU",
    department: "ICU",
    floor: 2,
    maxOccupancy: 1,
    pricePerDay: 500,
    patientAssignments: [],
    amenities: ["Ventilator", "Cardiac Monitor", "IV Pump", "Private Bathroom"],
    notes: "ICU bed ready for emergency cases",
    lastCleaned: new Date("2024-01-16"),
  },

  // Room 301 - Private Room
  {
    roomNumber: "301",
    roomType: "Private",
    department: "Surgery",
    floor: 3,
    maxOccupancy: 1,
    pricePerDay: 300,
    patientAssignments: [],
    amenities: ["TV", "AC", "Private Bathroom", "Refrigerator", "Sofa"],
    notes: "Premium private room with family accommodation",
    lastCleaned: new Date("2024-01-15"),
  },

  // Room 302 - Surgery Recovery
  {
    roomNumber: "302",
    roomType: "Surgery",
    department: "Surgery",
    floor: 3,
    maxOccupancy: 1,
    pricePerDay: 250,
    patientAssignments: [],
    amenities: ["Cardiac Monitor", "IV Pump", "Private Bathroom"],
    notes: "Post-surgery recovery room",
    lastCleaned: new Date("2024-01-16"),
  },

  // Room 401 - Emergency Room
  {
    roomNumber: "401",
    roomType: "Emergency",
    department: "Emergency",
    floor: 4,
    maxOccupancy: 1,
    pricePerDay: 200,
    patientAssignments: [],
    amenities: ["Defibrillator", "Oxygen Supply", "Emergency Cart"],
    notes: "Emergency treatment room",
    lastCleaned: new Date("2024-01-16"),
  },

  // Room 402 - Emergency Room
  {
    roomNumber: "402",
    roomType: "Emergency",
    department: "Emergency",
    floor: 4,
    maxOccupancy: 1,
    pricePerDay: 200,
    patientAssignments: [],
    amenities: ["Defibrillator", "Oxygen Supply", "Emergency Cart"],
    notes: "Emergency treatment room",
    lastCleaned: new Date("2024-01-16"),
  },

  // Room 501 - Semi-Private
  {
    roomNumber: "501",
    roomType: "Semi-Private",
    department: "Cardiology",
    floor: 5,
    maxOccupancy: 2,
    pricePerDay: 200,
    patientAssignments: [],
    amenities: ["TV", "AC", "Shared Bathroom"],
    notes: "Cardiology department room",
    lastCleaned: new Date("2024-01-15"),
  },

  // Room 502 - Maintenance
  {
    roomNumber: "502",
    roomType: "General",
    department: "General Medicine",
    floor: 5,
    maxOccupancy: 2,
    pricePerDay: 150,
    patientAssignments: [],
    amenities: ["TV", "AC"],
    notes: "Under maintenance - AC repair scheduled",
    lastCleaned: new Date("2024-01-10"),
    status: "Maintenance",
  },
];

const sampleBills = [
  {
    patientId: "PAT001",
    patientName: "John Doe",
    items: [
      {
        description: "General Consultation",
        category: "Consultation" as const,
        quantity: 1,
        unitPrice: 500,
        total: 500,
      },
      {
        description: "Blood Test",
        category: "Lab Test" as const,
        quantity: 1,
        unitPrice: 300,
        total: 300,
      },
    ],
    subtotal: 800,
    tax: 144, // 18% of 800
    discount: 50,
    totalAmount: 894,
    status: "paid" as const,
    notes: "Regular checkup with blood work",
  },
  {
    patientId: "PAT002",
    patientName: "Jane Smith",
    items: [
      {
        description: "Emergency Consultation",
        category: "Consultation" as const,
        quantity: 1,
        unitPrice: 1000,
        total: 1000,
      },
      {
        description: "X-Ray",
        category: "Lab Test" as const,
        quantity: 1,
        unitPrice: 800,
        total: 800,
      },
    ],
    subtotal: 1800,
    tax: 324, // 18% of 1800
    discount: 0,
    totalAmount: 2124,
    status: "partially_paid" as const,
    notes: "Emergency visit for chest pain",
  },
  {
    patientId: "PAT003",
    patientName: "Robert Johnson",
    items: [
      {
        description: "Appendectomy Surgery",
        category: "Surgery" as const,
        quantity: 1,
        unitPrice: 25000,
        total: 25000,
      },
      {
        description: "Room Charges",
        category: "Room Charges" as const,
        quantity: 2,
        unitPrice: 2000,
        total: 4000,
      },
    ],
    subtotal: 29000,
    tax: 5220, // 18% of 29000
    discount: 2000,
    totalAmount: 32220,
    status: "pending" as const,
    notes: "Emergency appendectomy with room stay",
  },
  {
    patientId: "PAT004",
    patientName: "Emily Davis",
    items: [
      {
        description: "Dental Checkup",
        category: "Consultation" as const,
        quantity: 1,
        unitPrice: 800,
        total: 800,
      },
    ],
    subtotal: 800,
    tax: 144, // 18% of 800
    discount: 0,
    totalAmount: 944,
    status: "cancelled" as const,
    notes: "Routine dental examination - cancelled by patient",
  },
];

// Function to create sample appointments with actual patient and staff IDs (MVP version)
const createSampleAppointments = async (patients: any[], staff: any[]) => {
  const appointmentTemplates = [
    {
      patientName: "John Doe",
      doctorName: "Dr. Michael Smith",
      department: "General Medicine",
      appointmentDate: new Date(),
      appointmentTime: "09:00",
      status: "confirmed",
    },
    {
      patientName: "Maria Garcia",
      doctorName: "Dr. Emily Johnson",
      department: "Emergency",
      appointmentDate: new Date(),
      appointmentTime: "10:30",
      status: "scheduled",
    },
    {
      patientName: "Robert Smith",
      doctorName: "Dr. Sarah Wilson",
      department: "Cardiology",
      appointmentDate: new Date(),
      appointmentTime: "14:00",
      status: "scheduled",
    },
    {
      patientName: "Emily Davis",
      doctorName: "Dr. Lisa Chen",
      department: "Surgery",
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      appointmentTime: "09:30",
      status: "confirmed",
    },
    {
      patientName: "Ahmed Hassan",
      doctorName: "Dr. James Williams",
      department: "General Medicine",
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      appointmentTime: "11:00",
      status: "scheduled",
    },
    {
      patientName: "Lisa Chen",
      doctorName: "Dr. Robert Anderson",
      department: "Radiology",
      appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      appointmentTime: "15:00",
      status: "scheduled",
    },
    {
      patientName: "John Doe", // New patient example
      doctorName: "Dr. David Brown",
      department: "Orthopedics",
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      appointmentTime: "10:00",
      status: "scheduled",
    },
    {
      patientName: "Maria Garcia", // New patient example
      doctorName: "Dr. Jennifer Lee",
      department: "Pediatrics",
      appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      appointmentTime: "16:00",
      status: "scheduled",
    },
    {
      patientName: "Robert Smith",
      doctorName: "Dr. Michael Smith",
      department: "General Medicine",
      appointmentDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday (completed)
      appointmentTime: "14:00",
      status: "completed",
    },
    {
      patientName: "Emily Davis",
      doctorName: "Dr. Sarah Wilson",
      department: "Cardiology",
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow (cancelled)
      appointmentTime: "16:30",
      status: "cancelled",
    },
  ];

  const appointments = [];

  for (let i = 0; i < appointmentTemplates.length; i++) {
    const template = appointmentTemplates[i];

    // Find matching patient or use a fallback
    const matchingPatient =
      patients.find(
        (p) => `${p.firstName} ${p.lastName}` === template.patientName
      ) || patients[i % patients.length];

    const appointmentData = {
      patientId: matchingPatient._id,
      patientType: "existing",
      doctorName: template.doctorName,
      department: template.department,
      appointmentDate: template.appointmentDate,
      appointmentTime: template.appointmentTime,
      status: template.status,
      createdBy: {
        userId: staff[i % staff.length]._id,
        userType: "staff",
        name: staff[i % staff.length].name,
      },
    };

    const appointment = new Appointment(appointmentData);
    await appointment.save();
    appointments.push(appointment);
  }

  return appointments;
};

// Function to create sample workflows with specific patient IDs
const createSampleWorkflows = async (patients: any[], staff: any[]) => {
  const specificPatientIds = [
    "68bd8586679e74f97502fca7",
    "68bd8586679e74f97502fcaa",
    "68bd8587679e74f97502fcad",
    "68bd8587679e74f97502fcb0",
  ];

  const workflowTemplates = [
    {
      patientId: specificPatientIds[0], // John Doe - Diagnostics stage (like in UI)
      patientName: "John Doe",
      uhid: "UH001",
      currentStage: "Diagnostics",
      currentStageNumber: 4,
      status: "active",
      startedDate: new Date("2024-02-15"),
      recentActivity: [
        {
          activityType: "stage-started",
          stageName: "Diagnostics",
          description: "Diagnostics: Lab work in progress",
          timestamp: new Date(),
        },
        {
          activityType: "stage-completed",
          stageName: "Consultation",
          description:
            "Consultation: Dr. Smith - Ordered ECG and blood work (2/15/2024, 9:30:00 AM)",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          activityType: "stage-completed",
          stageName: "Triage",
          description:
            "Triage: Priority 2 - Stable vitals (2/15/2024, 8:15:00 AM)",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        },
      ],
    },
    {
      patientId: specificPatientIds[1], // Maria Garcia - Active Treatment
      patientName: "Maria Garcia",
      uhid: "UH002",
      currentStage: "Active Treatment",
      currentStageNumber: 6,
      status: "active",
      startedDate: new Date("2024-02-14"),
      recentActivity: [
        {
          activityType: "stage-started",
          stageName: "Active Treatment",
          description: "Active Treatment: Medication administration started",
          timestamp: new Date(),
        },
        {
          activityType: "stage-completed",
          stageName: "Treatment Planning",
          description: "Treatment Planning: Care plan approved by Dr. Johnson",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
      ],
    },
    {
      patientId: specificPatientIds[2], // Robert Smith - Consultation
      patientName: "Robert Smith",
      uhid: "UH003",
      currentStage: "Consultation",
      currentStageNumber: 3,
      status: "active",
      startedDate: new Date("2024-02-15"),
      recentActivity: [
        {
          activityType: "stage-started",
          stageName: "Consultation",
          description: "Consultation: Waiting for Dr. Wilson",
          timestamp: new Date(),
        },
        {
          activityType: "stage-completed",
          stageName: "Triage",
          description: "Triage: Priority 1 - Requires immediate attention",
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
      ],
    },
    {
      patientId: specificPatientIds[3], // Emily Davis - Completed workflow
      patientName: "Emily Davis",
      uhid: "UH004",
      currentStage: "Discharge",
      currentStageNumber: 10,
      status: "completed",
      startedDate: new Date("2024-02-13"),
      recentActivity: [
        {
          activityType: "stage-completed",
          stageName: "Discharge",
          description: "Discharge: Patient discharged successfully",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        },
        {
          activityType: "stage-completed",
          stageName: "Billing",
          description: "Billing: Payment processed and cleared",
          timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // Yesterday
        },
      ],
    },
  ];

  const workflows = [];

  for (let i = 0; i < workflowTemplates.length; i++) {
    const template = workflowTemplates[i];

    // Create default stages manually (avoiding TypeScript issues)
    const defaultStages = [
      {
        stageNumber: 1,
        stageName: "Registration",
        stageType: "registration",
        status: "completed",
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

    // Update stages based on current progress
    const updatedStages = defaultStages.map((stage: any) => {
      if (stage.stageNumber < template.currentStageNumber) {
        return {
          ...stage,
          status: "completed",
          startedAt: new Date(
            template.startedDate.getTime() +
              (stage.stageNumber - 1) * 60 * 60 * 1000
          ),
          completedAt: new Date(
            template.startedDate.getTime() + stage.stageNumber * 60 * 60 * 1000
          ),
        };
      } else if (
        stage.stageNumber === template.currentStageNumber &&
        template.status === "active"
      ) {
        return {
          ...stage,
          status: "in-progress",
          startedAt: new Date(),
        };
      } else if (
        stage.stageNumber === template.currentStageNumber &&
        template.status === "completed"
      ) {
        return {
          ...stage,
          status: "completed",
          startedAt: new Date(
            template.startedDate.getTime() +
              (stage.stageNumber - 1) * 60 * 60 * 1000
          ),
          completedAt: new Date(
            template.startedDate.getTime() + stage.stageNumber * 60 * 60 * 1000
          ),
        };
      } else {
        return {
          ...stage,
          status: "pending",
        };
      }
    });

    // Add performedBy to recent activities
    const activitiesWithUser = template.recentActivity.map((activity) => ({
      ...activity,
      performedBy: {
        userId: staff[i % staff.length]._id,
        userType: "staff",
        name: staff[i % staff.length].name,
      },
    }));

    const workflowData = {
      patientId: new mongoose.Types.ObjectId(template.patientId),
      patientName: template.patientName,
      uhid: template.uhid,
      startedDate: template.startedDate,
      currentStage: template.currentStage,
      currentStageNumber: template.currentStageNumber,
      status: template.status,
      stages: updatedStages,
      recentActivity: activitiesWithUser,
      createdBy: {
        userId: staff[i % staff.length]._id,
        userType: "staff",
        name: staff[i % staff.length].name,
      },
    };

    const workflow = new Workflow(workflowData);
    await workflow.save();
    workflows.push(workflow);
  }

  return workflows;
};

// Function to create sample rooms
const createSampleRooms = async () => {
  const rooms = [];

  for (const roomData of sampleRooms) {
    const room = new Room(roomData);
    await room.save();
    rooms.push(room);
  }

  return rooms;
};

async function seedDatabase() {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database for seeding...");

    // Clear existing data (optional - remove if you want to keep existing data)
    console.log("Clearing existing data...");
    await Admin.deleteMany({});
    await Staff.deleteMany({});
    await Accountant.deleteMany({});
    await Patient.deleteMany({});
    await Bill.deleteMany({});
    await Appointment.deleteMany({});
    await Workflow.deleteMany({});
    await Room.deleteMany({});

    // Seed Admins (using individual saves to trigger pre-save middleware)
    console.log("Seeding Admins...");
    const createdAdmins = [];
    for (const adminData of sampleAdmins) {
      const admin = new Admin(adminData);
      await admin.save();
      createdAdmins.push(admin);
    }
    console.log(`Created ${createdAdmins.length} admin records`);

    // Seed Staff (using individual saves to trigger pre-save middleware)
    console.log("Seeding Staff...");
    const createdStaff = [];
    for (const staffData of sampleStaff) {
      const staff = new Staff(staffData);
      await staff.save();
      createdStaff.push(staff);
    }
    console.log(`Created ${createdStaff.length} staff records`);

    // Seed Accountants (using individual saves to trigger pre-save middleware)
    console.log("Seeding Accountants...");
    const createdAccountants = [];
    for (const accountantData of sampleAccountants) {
      const accountant = new Accountant(accountantData);
      await accountant.save();
      createdAccountants.push(accountant);
    }
    console.log(`Created ${createdAccountants.length} accountant records`);

    // Seed Patients
    console.log("Seeding Patients...");
    const createdPatients = [];
    for (const patientData of samplePatients) {
      const patient = new Patient(patientData);
      await patient.save();
      createdPatients.push(patient);
    }
    console.log(`Created ${createdPatients.length} patient records`);

    // Seed Bills
    console.log("Seeding Bills...");
    const createdBills = [];
    for (const billData of sampleBills) {
      const bill = new Bill(billData);
      await bill.save();
      createdBills.push(bill);
    }
    console.log(`Created ${createdBills.length} bill records`);

    // Seed Appointments
    console.log("Seeding Appointments...");
    const createdAppointments = await createSampleAppointments(
      createdPatients,
      createdStaff
    );
    console.log(`Created ${createdAppointments.length} appointment records`);

    // Seed Workflows
    console.log("Seeding Workflows...");
    const createdWorkflows = await createSampleWorkflows(
      createdPatients,
      createdStaff
    );
    console.log(`Created ${createdWorkflows.length} workflow records`);

    // Seed Rooms
    console.log("Seeding Rooms...");
    const createdRooms = await createSampleRooms();
    console.log(`Created ${createdRooms.length} room records`);

    console.log("Database seeding completed successfully!");

    // Display created records summary
    console.log("\n=== SEEDING SUMMARY ===");
    console.log(`Admins created: ${createdAdmins.length}`);
    console.log(`Staff created: ${createdStaff.length}`);
    console.log(`Accountants created: ${createdAccountants.length}`);
    console.log(`Patients created: ${createdPatients.length}`);
    console.log(`Bills created: ${createdBills.length}`);
    console.log(`Appointments created: ${createdAppointments.length}`);
    console.log(`Workflows created: ${createdWorkflows.length}`);
    console.log(`Rooms created: ${createdRooms.length}`);

    console.log("\n=== SAMPLE LOGIN CREDENTIALS ===");
    console.log("Super Admin: username='admin1', password='admin123'");
    console.log("Regular Admin: username='admin2', password='admin456'");
    console.log("Emergency Nurse: username='nurse1', password='nurse123'");
    console.log("Doctor: username='doctor1', password='doctor123'");
    console.log("Surgeon: username='surgeon1', password='surgeon123'");
    console.log("ICU Nurse: username='icu_nurse', password='icu123'");
    console.log("Accountant: username='accountant1', password='acc123'");

    console.log("\n=== SAMPLE PATIENT DATA ===");
    console.log("Emergency Patients: 2 (John Doe, Maria Garcia)");
    console.log(
      "Normal Registration Patients: 4 (Robert Smith, Emily Davis, Ahmed Hassan, Lisa Chen)"
    );

    console.log("\n=== SAMPLE APPOINTMENT DATA (MVP) ===");
    console.log("Today's Appointments: 3");
    console.log("Tomorrow's Appointments: 2");
    console.log("Upcoming Appointments: 6");
    console.log("Completed Appointments: 1");
    console.log("Cancelled Appointments: 1");
    console.log(
      "Departments: Cardiology, Neurology, Orthopedics, Pediatrics, General Medicine, Surgery, Emergency, Radiology"
    );

    console.log("\n=== SAMPLE WORKFLOW DATA (MVP) ===");
    console.log("Active Workflows: 3");
    console.log("Completed Workflows: 1");
    console.log("Patient IDs used:");
    console.log("- 68bd8586679e74f97502fca7 (John Doe - Diagnostics Stage)");
    console.log("- 68bd8586679e74f97502fcaa (Maria Garcia - Active Treatment)");
    console.log("- 68bd8587679e74f97502fcad (Robert Smith - Consultation)");
    console.log("- 68bd8587679e74f97502fcb0 (Emily Davis - Completed)");

    console.log("\n=== SAMPLE ROOM DATA (MVP) ===");
    console.log("Total Rooms: 11");
    console.log("Occupied Rooms: 3 (Room 101, 103, 201)");
    console.log("Available Rooms: 7");
    console.log("Maintenance Rooms: 1 (Room 502)");
    console.log(
      "Room Types: General (6), ICU (2), Private (1), Surgery (1), Emergency (2), Semi-Private (1)"
    );
    console.log(
      "Departments: General Medicine, ICU, Surgery, Emergency, Cardiology"
    );
    console.log("Floors: 1-5");
    console.log("Patient Assignments:");
    console.log("- Room 101: John Doe (Bed 1), Jane Smith (Bed 2)");
    console.log("- Room 103: Robert Smith (Bed 1)");
    console.log("- Room 201: Emily Davis (ICU Bed 1)");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  }
}

// Run the seeding function
seedDatabase();
