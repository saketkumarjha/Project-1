// import Patient from "../models/Patient";
// import Appointment from "../models/Appointment";
// import Room from "../models/Room";
// import Bill from "../models/Bill";
// import Workflow from "../models/Workflow";

// export interface AnalyticsFilters {
//   startDate: Date;
//   endDate: Date;
//   department?: string;
// }

// export interface PatientAnalytics {
//   totalPatients: number;
//   newRegistrations: number;
//   activePatients: number;
//   dischargedPatients: number;
//   patientsByDepartment: Array<{
//     department: string;
//     count: number;
//   }>;
//   patientsByType: Array<{
//     type: string;
//     count: number;
//   }>;
// }

// export interface AppointmentAnalytics {
//   totalAppointments: number;
//   completedAppointments: number;
//   cancelledAppointments: number;
//   scheduledAppointments: number;
//   appointmentsByDepartment: Array<{
//     department: string;
//     count: number;
//   }>;
//   appointmentsByStatus: Array<{
//     status: string;
//     count: number;
//   }>;
// }

// export interface RoomAnalytics {
//   totalRooms: number;
//   availableRooms: number;
//   occupiedRooms: number;
//   partiallyOccupiedRooms: number;
//   maintenanceRooms: number;
//   occupancyRate: number;
//   averageLengthOfStay: number;
//   roomUtilizationByDepartment: Array<{
//     department: string;
//     totalRooms: number;
//     occupiedRooms: number;
//     occupancyRate: number;
//   }>;
// }

// export interface RevenueAnalytics {
//   totalRevenue: number;
//   paidRevenue: number;
//   pendingRevenue: number;
//   revenueByCategory: Array<{
//     category: string;
//     amount: number;
//     percentage: number;
//   }>;
//   revenueByPaymentMethod: Array<{
//     method: string;
//     amount: number;
//     count: number;
//   }>;
//   averageRevenuePerPatient: number;
// }

// export interface WorkflowAnalytics {
//   totalWorkflows: number;
//   activeWorkflows: number;
//   completedWorkflows: number;
//   averageCompletionTime: number;
//   stageAnalytics: Array<{
//     stageName: string;
//     averageTime: number;
//     completionRate: number;
//   }>;
//   bottlenecks: Array<{
//     stageName: string;
//     averageWaitTime: number;
//     patientCount: number;
//   }>;
// }

// export class AnalyticsService {
//   // Get patient analytics
//   static async getPatientAnalytics(
//     filters: AnalyticsFilters
//   ): Promise<PatientAnalytics> {
//     const { startDate, endDate, department } = filters;
//     const departmentFilter = department ? { department } : {};

//     // Total patients (all time up to end date)
//     const totalPatients = await Patient.countDocuments({
//       createdAt: { $lte: endDate },
//       ...departmentFilter,
//     });

//     // New registrations in period
//     const newRegistrations = await Patient.countDocuments({
//       createdAt: { $gte: startDate, $lte: endDate },
//       ...departmentFilter,
//     });

//     // Active patients
//     const activePatients = await Patient.countDocuments({
//       status: "Active",
//       ...departmentFilter,
//     });

//     // Discharged patients in period
//     const dischargedPatients = await Workflow.countDocuments({
//       currentStage: "Discharge",
//       status: "completed",
//       updatedAt: { $gte: startDate, $lte: endDate },
//     });

//     // Patients by department
//     const patientsByDepartment = await Patient.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startDate, $lte: endDate },
//         },
//       },
//       {
//         $lookup: {
//           from: "appointments",
//           localField: "_id",
//           foreignField: "patientId",
//           as: "appointments",
//         },
//       },
//       {
//         $unwind: { path: "$appointments", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $group: {
//           _id: "$appointments.department",
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $match: { _id: { $ne: null } },
//       },
//       {
//         $project: {
//           department: "$_id",
//           count: 1,
//           _id: 0,
//         },
//       },
//     ]);

//     // Patients by type
//     const patientsByType = await Patient.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startDate, $lte: endDate },
//           ...departmentFilter,
//         },
//       },
//       {
//         $group: {
//           _id: "$patientType",
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $project: {
//           type: "$_id",
//           count: 1,
//           _id: 0,
//         },
//       },
//     ]);

//     return {
//       totalPatients,
//       newRegistrations,
//       activePatients,
//       dischargedPatients,
//       patientsByDepartment,
//       patientsByType,
//     };
//   }

//   // Get appointment analytics
//   static async getAppointmentAnalytics(
//     filters: AnalyticsFilters
//   ): Promise<AppointmentAnalytics> {
//     const { startDate, endDate, department } = filters;
//     const departmentFilter = department ? { department } : {};

//     // Total appointments in period
//     const totalAppointments = await Appointment.countDocuments({
//       appointmentDate: { $gte: startDate, $lte: endDate },
//       ...departmentFilter,
//     });

//     // Appointments by status
//     const appointmentsByStatus = await Appointment.aggregate([
//       {
//         $match: {
//           appointmentDate: { $gte: startDate, $lte: endDate },
//           ...departmentFilter,
//         },
//       },
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $project: {
//           status: "$_id",
//           count: 1,
//           _id: 0,
//         },
//       },
//     ]);

//     const completedAppointments =
//       appointmentsByStatus.find((a) => a.status === "completed")?.count || 0;
//     const cancelledAppointments =
//       appointmentsByStatus.find((a) => a.status === "cancelled")?.count || 0;
//     const scheduledAppointments =
//       appointmentsByStatus.find((a) => a.status === "scheduled")?.count || 0;

//     // Appointments by department
//     const appointmentsByDepartment = await Appointment.aggregate([
//       {
//         $match: {
//           appointmentDate: { $gte: startDate, $lte: endDate },
//         },
//       },
//       {
//         $group: {
//           _id: "$department",
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $project: {
//           department: "$_id",
//           count: 1,
//           _id: 0,
//         },
//       },
//     ]);

//     return {
//       totalAppointments,
//       completedAppointments,
//       cancelledAppointments,
//       scheduledAppointments,
//       appointmentsByDepartment,
//       appointmentsByStatus,
//     };
//   }

//   // Get room analytics
//   static async getRoomAnalytics(
//     filters: AnalyticsFilters
//   ): Promise<RoomAnalytics> {
//     const { department } = filters;
//     const departmentFilter = department ? { department } : {};

//     // Room counts by status
//     const totalRooms = await Room.countDocuments({
//       isActive: true,
//       ...departmentFilter,
//     });

//     const availableRooms = await Room.countDocuments({
//       status: "Available",
//       isActive: true,
//       ...departmentFilter,
//     });

//     const occupiedRooms = await Room.countDocuments({
//       status: "Occupied",
//       isActive: true,
//       ...departmentFilter,
//     });

//     const partiallyOccupiedRooms = await Room.countDocuments({
//       status: "Partially-Occupied",
//       isActive: true,
//       ...departmentFilter,
//     });

//     const maintenanceRooms = await Room.countDocuments({
//       status: "Maintenance",
//       isActive: true,
//       ...departmentFilter,
//     });

//     const occupancyRate =
//       totalRooms > 0
//         ? ((occupiedRooms + partiallyOccupiedRooms) / totalRooms) * 100
//         : 0;

//     // Calculate average length of stay
//     const roomAssignments = await Room.aggregate([
//       {
//         $match: {
//           isActive: true,
//           ...departmentFilter,
//         },
//       },
//       { $unwind: "$patientAssignments" },
//       {
//         $match: {
//           "patientAssignments.status": { $in: ["Discharge", "Transferred"] },
//         },
//       },
//       {
//         $addFields: {
//           lengthOfStay: {
//             $divide: [
//               { $subtract: [new Date(), "$patientAssignments.admittedDate"] },
//               1000 * 60 * 60 * 24, // Convert to days
//             ],
//           },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           averageLengthOfStay: { $avg: "$lengthOfStay" },
//         },
//       },
//     ]);

//     const averageLengthOfStay =
//       roomAssignments.length > 0 ? roomAssignments[0].averageLengthOfStay : 0;

//     // Room utilization by department
//     const roomUtilizationByDepartment = await Room.aggregate([
//       {
//         $match: {
//           isActive: true,
//         },
//       },
//       {
//         $group: {
//           _id: "$department",
//           totalRooms: { $sum: 1 },
//           occupiedRooms: {
//             $sum: {
//               $cond: [
//                 { $in: ["$status", ["Occupied", "Partially-Occupied"]] },
//                 1,
//                 0,
//               ],
//             },
//           },
//         },
//       },
//       {
//         $addFields: {
//           occupancyRate: {
//             $multiply: [{ $divide: ["$occupiedRooms", "$totalRooms"] }, 100],
//           },
//         },
//       },
//       {
//         $project: {
//           department: "$_id",
//           totalRooms: 1,
//           occupiedRooms: 1,
//           occupancyRate: 1,
//           _id: 0,
//         },
//       },
//     ]);

//     return {
//       totalRooms,
//       availableRooms,
//       occupiedRooms,
//       partiallyOccupiedRooms,
//       maintenanceRooms,
//       occupancyRate: Math.round(occupancyRate * 100) / 100,
//       averageLengthOfStay: Math.round(averageLengthOfStay * 100) / 100,
//       roomUtilizationByDepartment,
//     };
//   }

//   // Get revenue analytics
//   static async getRevenueAnalytics(
//     filters: AnalyticsFilters
//   ): Promise<RevenueAnalytics> {
//     const { startDate, endDate } = filters;

//     // Get all bills in the period
//     const bills = await Bill.find({
//       createdAt: { $gte: startDate, $lte: endDate },
//     });

//     let totalRevenue = 0;
//     let paidRevenue = 0;
//     let pendingRevenue = 0;
//     const categoryRevenue: { [key: string]: number } = {};
//     const paymentMethodRevenue: {
//       [key: string]: { amount: number; count: number };
//     } = {};

//     bills.forEach((bill) => {
//       const billAmount = bill.totalAmount;
//       totalRevenue += billAmount;

//       if (bill.status === "paid") {
//         paidRevenue += billAmount;
//       } else if (
//         bill.status === "pending" ||
//         bill.status === "partially_paid"
//       ) {
//         pendingRevenue += billAmount;
//       }

//       // Revenue by category
//       bill.items.forEach((item: any) => {
//         const category = item.category || "Other";
//         const amount = item.total || item.unitPrice * item.quantity;
//         categoryRevenue[category] = (categoryRevenue[category] || 0) + amount;
//       });

//       // Revenue by payment method (mock data since Bill model doesn't have paymentMethod)
//       const mockPaymentMethod = "Cash"; // Default payment method for now
//       if (!paymentMethodRevenue[mockPaymentMethod]) {
//         paymentMethodRevenue[mockPaymentMethod] = { amount: 0, count: 0 };
//       }
//       paymentMethodRevenue[mockPaymentMethod].amount += billAmount;
//       paymentMethodRevenue[mockPaymentMethod].count += 1;
//     });

//     // Convert to arrays with percentages
//     const revenueByCategory = Object.entries(categoryRevenue).map(
//       ([category, amount]) => ({
//         category,
//         amount,
//         percentage:
//           totalRevenue > 0
//             ? Math.round((amount / totalRevenue) * 100 * 100) / 100
//             : 0,
//       })
//     );

//     const revenueByPaymentMethod = Object.entries(paymentMethodRevenue).map(
//       ([method, data]) => ({
//         method,
//         amount: data.amount,
//         count: data.count,
//       })
//     );

//     // Calculate average revenue per patient
//     const patientCount = await Patient.countDocuments({
//       createdAt: { $gte: startDate, $lte: endDate },
//     });

//     const averageRevenuePerPatient =
//       patientCount > 0 ? totalRevenue / patientCount : 0;

//     return {
//       totalRevenue: Math.round(totalRevenue * 100) / 100,
//       paidRevenue: Math.round(paidRevenue * 100) / 100,
//       pendingRevenue: Math.round(pendingRevenue * 100) / 100,
//       revenueByCategory,
//       revenueByPaymentMethod,
//       averageRevenuePerPatient:
//         Math.round(averageRevenuePerPatient * 100) / 100,
//     };
//   }

//   // Get workflow analytics
//   static async getWorkflowAnalytics(
//     filters: AnalyticsFilters
//   ): Promise<WorkflowAnalytics> {
//     const { startDate, endDate } = filters;

//     // Total workflows
//     const totalWorkflows = await Workflow.countDocuments({
//       startedDate: { $gte: startDate, $lte: endDate },
//     });

//     const activeWorkflows = await Workflow.countDocuments({
//       status: "active",
//       startedDate: { $gte: startDate, $lte: endDate },
//     });

//     const completedWorkflows = await Workflow.countDocuments({
//       status: "completed",
//       startedDate: { $gte: startDate, $lte: endDate },
//     });

//     // Calculate average completion time for completed workflows
//     const completionTimes = await Workflow.aggregate([
//       {
//         $match: {
//           status: "completed",
//           startedDate: { $gte: startDate, $lte: endDate },
//         },
//       },
//       {
//         $addFields: {
//           completionTime: {
//             $divide: [
//               { $subtract: ["$updatedAt", "$startedDate"] },
//               1000 * 60 * 60, // Convert to hours
//             ],
//           },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           averageCompletionTime: { $avg: "$completionTime" },
//         },
//       },
//     ]);

//     const averageCompletionTime =
//       completionTimes.length > 0 ? completionTimes[0].averageCompletionTime : 0;

//     // Stage analytics (simplified - would need more complex logic for real stage timing)
//     const stageAnalytics = [
//       { stageName: "Registration", averageTime: 0.5, completionRate: 100 },
//       { stageName: "Triage", averageTime: 1.0, completionRate: 95 },
//       { stageName: "Consultation", averageTime: 2.0, completionRate: 90 },
//       { stageName: "Diagnostics", averageTime: 4.0, completionRate: 85 },
//       { stageName: "Treatment Planning", averageTime: 1.5, completionRate: 80 },
//       { stageName: "Active Treatment", averageTime: 8.0, completionRate: 75 },
//       { stageName: "Observation", averageTime: 12.0, completionRate: 70 },
//       { stageName: "Pre-Discharge", averageTime: 2.0, completionRate: 65 },
//       { stageName: "Billing", averageTime: 1.0, completionRate: 60 },
//       { stageName: "Discharge", averageTime: 0.5, completionRate: 55 },
//     ];

//     // Identify bottlenecks (stages with longest wait times)
//     const bottlenecks = stageAnalytics
//       .filter((stage) => stage.averageTime > 3.0)
//       .map((stage) => ({
//         stageName: stage.stageName,
//         averageWaitTime: stage.averageTime,
//         patientCount: Math.floor(totalWorkflows * (stage.completionRate / 100)),
//       }));

//     return {
//       totalWorkflows,
//       activeWorkflows,
//       completedWorkflows,
//       averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
//       stageAnalytics,
//       bottlenecks,
//     };
//   }

//   // Get comprehensive analytics
//   static async getComprehensiveAnalytics(filters: AnalyticsFilters) {
//     const [
//       patientAnalytics,
//       appointmentAnalytics,
//       roomAnalytics,
//       revenueAnalytics,
//       workflowAnalytics,
//     ] = await Promise.all([
//       this.getPatientAnalytics(filters),
//       this.getAppointmentAnalytics(filters),
//       this.getRoomAnalytics(filters),
//       this.getRevenueAnalytics(filters),
//       this.getWorkflowAnalytics(filters),
//     ]);

//     return {
//       patients: patientAnalytics,
//       appointments: appointmentAnalytics,
//       rooms: roomAnalytics,
//       revenue: revenueAnalytics,
//       workflows: workflowAnalytics,
//       period: {
//         startDate: filters.startDate.toISOString().split("T")[0],
//         endDate: filters.endDate.toISOString().split("T")[0],
//         department: filters.department || "All Departments",
//       },
//     };
//   }
// }
