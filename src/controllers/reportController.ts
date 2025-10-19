import { Request, Response } from "express";
import Patient from "../models/Patient";
import Appointment from "../models/Appointment";
import Room from "../models/Room";
import Bill from "../models/Bill";
import Workflow from "../models/Workflow";

// Interface definitions for report data
interface DailyStats {
  date: string;
  totalPatients: number;
  newRegistrations: number;
  appointments: number;
  discharges: number;
  revenue: number;
  roomOccupancy: number;
}

interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalPatients: number;
  newRegistrations: number;
  appointments: number;
  discharges: number;
  revenue: number;
  averageOccupancy: number;
  peakDay: string;
}

interface MonthlyStats {
  month: string;
  year: number;
  totalPatients: number;
  newRegistrations: number;
  appointments: number;
  discharges: number;
  revenue: number;
  averageOccupancy: number;
  departmentBreakdown: any[];
}

interface RevenueBreakdown {
  roomCharges: number;
  consultationFees: number;
  procedureFees: number;
  labCharges: number;
  total: number;
}

// Helper function to get date range
const getDateRange = (period: string, date?: string) => {
  const now = date ? new Date(date) : new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case "week":
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }

  return { startDate, endDate };
};

// Calculate revenue breakdown
// Note: Since Bill model doesn't have department field directly, we filter by
// finding patients who have appointments in the specified department
const calculateRevenueBreakdown = async (
  startDate: Date,
  endDate: Date,
  department?: string
): Promise<RevenueBreakdown> => {
  let bills;

  if (department && department !== "all") {
    // If department is specified, we need to filter bills by patients who have appointments in that department
    bills = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          status: { $in: ["paid", "partially_paid"] },
        },
      },
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "patientId", // Assuming Bill.patientId matches Patient.patientId (UHID)
          as: "patient",
        },
      },
      {
        $unwind: { path: "$patient", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "appointments",
          localField: "patient._id",
          foreignField: "patientId",
          as: "appointments",
        },
      },
      {
        $match: {
          "appointments.department": department,
        },
      },
    ]);
  } else {
    // No department filter, get all bills
    const matchQuery: any = {
      createdAt: { $gte: startDate, $lt: endDate },
      status: { $in: ["paid", "partially_paid"] },
    };
    bills = await Bill.find(matchQuery);
  }

  let roomCharges = 0;
  let consultationFees = 0;
  let procedureFees = 0;
  let labCharges = 0;

  bills.forEach((bill: any) => {
    // Handle both direct Bill documents and aggregation results
    const billItems = bill.items || [];

    billItems.forEach((item: any) => {
      const amount = item.total || item.unitPrice * item.quantity;

      switch (item.category) {
        case "Room":
        case "Room Charges":
          roomCharges += amount;
          break;
        case "Consultation":
          consultationFees += amount;
          break;
        case "Surgery":
        case "Procedure":
          procedureFees += amount;
          break;
        case "Lab Test":
        case "Laboratory":
          labCharges += amount;
          break;
        default:
          consultationFees += amount; // Default to consultation
      }
    });
  });

  return {
    roomCharges,
    consultationFees,
    procedureFees,
    labCharges,
    total: roomCharges + consultationFees + procedureFees + labCharges,
  };
};

// Get daily statistics
export const getDailyStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date, department } = req.query;
    const { startDate, endDate } = getDateRange("today", date as string);

    // Build department filter
    const departmentFilter =
      department && department !== "all" ? { department } : {};

    // Get patient statistics
    const totalPatients = await Patient.countDocuments({
      createdAt: { $lt: endDate },
      ...departmentFilter,
    });

    const newRegistrations = await Patient.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    // Get appointment statistics
    const appointments = await Appointment.countDocuments({
      appointmentDate: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    // Get discharge statistics (from workflows)
    const discharges = await Workflow.countDocuments({
      currentStage: "Discharge",
      status: "completed",
      updatedAt: { $gte: startDate, $lt: endDate },
    });

    // Get revenue
    const revenueBreakdown = await calculateRevenueBreakdown(
      startDate,
      endDate,
      department as string
    );

    // Get room occupancy
    const totalRooms = await Room.countDocuments({
      isActive: true,
      ...departmentFilter,
    });

    const occupiedRooms = await Room.countDocuments({
      status: { $in: ["Occupied", "Partially-Occupied"] },
      isActive: true,
      ...departmentFilter,
    });

    const roomOccupancy =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    const dailyStats: DailyStats = {
      date: startDate.toISOString().split("T")[0],
      totalPatients,
      newRegistrations,
      appointments,
      discharges,
      revenue: revenueBreakdown.total,
      roomOccupancy: Math.round(roomOccupancy * 100) / 100,
    };

    res.json({
      success: true,
      message: "Daily statistics retrieved successfully",
      data: {
        stats: dailyStats,
        revenueBreakdown,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching daily statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get weekly statistics
export const getWeeklyStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { weekStart, department } = req.query;
    const { startDate, endDate } = getDateRange("week", weekStart as string);

    const departmentFilter =
      department && department !== "all" ? { department } : {};

    // Get weekly aggregated data
    const totalPatients = await Patient.countDocuments({
      createdAt: { $lt: endDate },
      ...departmentFilter,
    });

    const newRegistrations = await Patient.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    const appointments = await Appointment.countDocuments({
      appointmentDate: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    const discharges = await Workflow.countDocuments({
      currentStage: "Discharge",
      status: "completed",
      updatedAt: { $gte: startDate, $lt: endDate },
    });

    const revenueBreakdown = await calculateRevenueBreakdown(
      startDate,
      endDate,
      department as string
    );

    // Calculate average occupancy for the week
    const totalRooms = await Room.countDocuments({
      isActive: true,
      ...departmentFilter,
    });

    const occupiedRooms = await Room.countDocuments({
      status: { $in: ["Occupied", "Partially-Occupied"] },
      isActive: true,
      ...departmentFilter,
    });

    const averageOccupancy =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Find peak day (day with most appointments)
    const dailyAppointments = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: startDate, $lt: endDate },
          ...departmentFilter,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const peakDay =
      dailyAppointments.length > 0 ? dailyAppointments[0]._id : "N/A";

    const weeklyStats: WeeklyStats = {
      weekStart: startDate.toISOString().split("T")[0],
      weekEnd: new Date(endDate.getTime() - 1).toISOString().split("T")[0],
      totalPatients,
      newRegistrations,
      appointments,
      discharges,
      revenue: revenueBreakdown.total,
      averageOccupancy: Math.round(averageOccupancy * 100) / 100,
      peakDay,
    };

    res.json({
      success: true,
      message: "Weekly statistics retrieved successfully",
      data: {
        stats: weeklyStats,
        revenueBreakdown,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching weekly statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
// Get monthly statistics
export const getMonthlyStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { month, year, department } = req.query;
    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);

    const departmentFilter =
      department && department !== "all" ? { department } : {};

    // Get monthly aggregated data
    const totalPatients = await Patient.countDocuments({
      createdAt: { $lt: endDate },
      ...departmentFilter,
    });

    const newRegistrations = await Patient.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    const appointments = await Appointment.countDocuments({
      appointmentDate: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    const discharges = await Workflow.countDocuments({
      currentStage: "Discharge",
      status: "completed",
      updatedAt: { $gte: startDate, $lt: endDate },
    });

    const revenueBreakdown = await calculateRevenueBreakdown(
      startDate,
      endDate,
      department as string
    );

    // Calculate average occupancy for the month
    const totalRooms = await Room.countDocuments({
      isActive: true,
      ...departmentFilter,
    });

    const occupiedRooms = await Room.countDocuments({
      status: { $in: ["Occupied", "Partially-Occupied"] },
      isActive: true,
      ...departmentFilter,
    });

    const averageOccupancy =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Get department breakdown
    const departmentBreakdown = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "patientId",
          as: "appointments",
        },
      },
      {
        $unwind: { path: "$appointments", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$appointments.department",
          patientCount: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: { $ne: null },
        },
      },
    ]);

    const monthlyStats: MonthlyStats = {
      month: startDate.toLocaleDateString("en-US", { month: "long" }),
      year: yearNum,
      totalPatients,
      newRegistrations,
      appointments,
      discharges,
      revenue: revenueBreakdown.total,
      averageOccupancy: Math.round(averageOccupancy * 100) / 100,
      departmentBreakdown,
    };

    res.json({
      success: true,
      message: "Monthly statistics retrieved successfully",
      data: {
        stats: monthlyStats,
        revenueBreakdown,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching monthly statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get yearly statistics
export const getYearlyStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { year, department } = req.query;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum + 1, 0, 1);

    const departmentFilter =
      department && department !== "all" ? { department } : {};

    // Get yearly aggregated data
    const totalPatients = await Patient.countDocuments({
      createdAt: { $lt: endDate },
      ...departmentFilter,
    });

    const newRegistrations = await Patient.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    const appointments = await Appointment.countDocuments({
      appointmentDate: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    const discharges = await Workflow.countDocuments({
      currentStage: "Discharge",
      status: "completed",
      updatedAt: { $gte: startDate, $lt: endDate },
    });

    const revenueBreakdown = await calculateRevenueBreakdown(
      startDate,
      endDate,
      department as string
    );

    // Get monthly trends for the year
    const monthlyTrends = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          ...departmentFilter,
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          newRegistrations: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.month": 1 },
      },
    ]);

    // Calculate growth rate (compared to previous year)
    const previousYearStart = new Date(yearNum - 1, 0, 1);
    const previousYearEnd = new Date(yearNum, 0, 1);

    const previousYearRegistrations = await Patient.countDocuments({
      createdAt: { $gte: previousYearStart, $lt: previousYearEnd },
      ...departmentFilter,
    });

    const growthRate =
      previousYearRegistrations > 0
        ? ((newRegistrations - previousYearRegistrations) /
            previousYearRegistrations) *
          100
        : 0;

    const yearlyStats = {
      year: yearNum,
      totalPatients,
      newRegistrations,
      appointments,
      discharges,
      revenue: revenueBreakdown.total,
      monthlyTrends,
      growthRate: Math.round(growthRate * 100) / 100,
    };

    res.json({
      success: true,
      message: "Yearly statistics retrieved successfully",
      data: {
        stats: yearlyStats,
        revenueBreakdown,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching yearly statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get custom report with date range
export const getCustomReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      startDate: start,
      endDate: end,
      department,
      reportType,
    } = req.query;

    if (!start || !end) {
      res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
      return;
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    if (startDate >= endDate) {
      res.status(400).json({
        success: false,
        message: "Start date must be before end date",
      });
      return;
    }

    const departmentFilter =
      department && department !== "all" ? { department } : {};

    // Get custom period data
    const totalPatients = await Patient.countDocuments({
      createdAt: { $lt: endDate },
      ...departmentFilter,
    });

    const newRegistrations = await Patient.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    const appointments = await Appointment.countDocuments({
      appointmentDate: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    const discharges = await Workflow.countDocuments({
      currentStage: "Discharge",
      status: "completed",
      updatedAt: { $gte: startDate, $lt: endDate },
    });

    const revenueBreakdown = await calculateRevenueBreakdown(
      startDate,
      endDate,
      department as string
    );

    // Additional analytics based on report type
    let additionalData: any = {};

    if (reportType === "revenue") {
      // Revenue-focused report
      const revenueByCategory = await Bill.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate },
            status: { $in: ["paid", "partially_paid"] },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.category",
            totalRevenue: { $sum: "$items.total" },
            count: { $sum: 1 },
          },
        },
      ]);

      additionalData.revenueByCategory = revenueByCategory;
    }

    if (reportType === "occupancy") {
      // Room occupancy report
      const roomUtilization = await Room.aggregate([
        {
          $match: {
            isActive: true,
            ...departmentFilter,
          },
        },
        {
          $group: {
            _id: "$department",
            totalRooms: { $sum: 1 },
            occupiedRooms: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["Occupied", "Partially-Occupied"]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $addFields: {
            occupancyRate: {
              $multiply: [{ $divide: ["$occupiedRooms", "$totalRooms"] }, 100],
            },
          },
        },
      ]);

      additionalData.roomUtilization = roomUtilization;
    }

    const customReport = {
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        days: Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
      totalPatients,
      newRegistrations,
      appointments,
      discharges,
      revenue: revenueBreakdown.total,
      ...additionalData,
    };

    res.json({
      success: true,
      message: "Custom report generated successfully",
      data: {
        report: customReport,
        revenueBreakdown,
        reportType: reportType || "general",
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating custom report",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get dashboard overview statistics
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { period = "today", department } = req.query;
    const { startDate, endDate } = getDateRange(period as string);

    const departmentFilter =
      department && department !== "all" ? { department } : {};

    // Get current statistics
    const totalPatients = await Patient.countDocuments({
      ...departmentFilter,
    });

    const activePatients = await Patient.countDocuments({
      status: "Active",
      ...departmentFilter,
    });

    const newRegistrations = await Patient.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: startDate, $lt: endDate },
      ...departmentFilter,
    });

    const discharges = await Workflow.countDocuments({
      currentStage: "Discharge",
      status: "completed",
      updatedAt: { $gte: startDate, $lt: endDate },
    });

    // Get revenue for the period
    const revenueBreakdown = await calculateRevenueBreakdown(
      startDate,
      endDate,
      department as string
    );

    // Get room statistics
    const totalRooms = await Room.countDocuments({
      isActive: true,
      ...departmentFilter,
    });

    const availableRooms = await Room.countDocuments({
      status: "Available",
      isActive: true,
      ...departmentFilter,
    });

    const occupiedRooms = await Room.countDocuments({
      status: { $in: ["Occupied", "Partially-Occupied"] },
      isActive: true,
      ...departmentFilter,
    });

    // Get department statistics
    const departmentStats = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: "$department",
          appointmentCount: { $sum: 1 },
        },
      },
      { $sort: { appointmentCount: -1 } },
    ]);

    const dashboardStats = {
      overview: {
        totalPatients,
        activePatients,
        newRegistrations,
        appointments: todayAppointments,
        discharges,
      },
      revenue: {
        total: revenueBreakdown.total,
        breakdown: revenueBreakdown,
      },
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        occupancyRate:
          totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      },
      departments: departmentStats,
      period: {
        type: period,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
    };

    res.json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: {
        stats: dashboardStats,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
