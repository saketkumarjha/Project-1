import { Request, Response } from "express";
import mongoose from "mongoose";
import Appointment from "../models/Appointment";
import Patient from "../models/Patient";

// Create new appointment
export const createAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      patientId,
      patientType,
      doctorName,
      department,
      appointmentDate,
      appointmentTime,
    } = req.body;

    // Validate required fields
    if (
      !patientId ||
      !patientType ||
      !doctorName ||
      !department ||
      !appointmentDate ||
      !appointmentTime
    ) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
      return;
    }

    // Validate ObjectId format for patientId
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      res.status(400).json({
        success: false,
        message: "Invalid patient ID format",
      });
      return;
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    // Create appointment data
    const appointmentData = {
      patientId,
      patientType,
      doctorName,
      department,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: "scheduled",
      createdBy: {
        userId: req.userType === "admin" ? req.admin?._id : req.staff?._id,
        userType: req.userType,
        name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
      },
    };

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: {
        appointment,
        createdBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all appointments with filters
export const getAllAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      department,
      doctorName,
      status,
      appointmentDate,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query object
    const query: any = { isActive: true };

    // Filter by department
    if (department && department !== "all") {
      query.department = department;
    }

    // Filter by doctor name
    if (doctorName) {
      query.doctorName = { $regex: doctorName, $options: "i" };
    }

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by specific date
    if (appointmentDate) {
      const date = new Date(appointmentDate as string);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      query.appointmentDate = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    // Filter by date range
    if (fromDate || toDate) {
      query.appointmentDate = {};
      if (fromDate) {
        query.appointmentDate.$gte = new Date(fromDate as string);
      }
      if (toDate) {
        const endDate = new Date(toDate as string);
        endDate.setHours(23, 59, 59, 999);
        query.appointmentDate.$lte = endDate;
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get appointments with patient details
    const appointments = await Appointment.find(query)
      .populate("patientId", "firstName lastName phoneNumber patientId")
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    // Get total count for pagination
    const totalAppointments = await Appointment.countDocuments(query);
    const totalPages = Math.ceil(totalAppointments / limitNum);

    res.json({
      success: true,
      message: "Appointments retrieved successfully",
      data: {
        appointments,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalAppointments,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get appointment by ID
export const getAppointmentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid appointment ID format",
      });
      return;
    }

    const appointment = await Appointment.findById(id)
      .populate(
        "patientId",
        "firstName lastName phoneNumber patientId dateOfBirth address"
      )
      .select("-__v");

    if (!appointment) {
      res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Appointment details retrieved successfully",
      data: {
        appointment,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointment details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update appointment
export const updateAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid appointment ID format",
      });
      return;
    }

    // Remove fields that shouldn't be updated
    delete updateData.appointmentId;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // If updating appointmentDate, ensure it's a valid date
    if (updateData.appointmentDate) {
      updateData.appointmentDate = new Date(updateData.appointmentDate);
    }

    const appointment = await Appointment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("patientId", "firstName lastName phoneNumber patientId")
      .select("-__v");

    if (!appointment) {
      res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Appointment updated successfully",
      data: {
        appointment,
        updatedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete appointment (soft delete)
export const deleteAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid appointment ID format",
      });
      return;
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    )
      .populate("patientId", "firstName lastName phoneNumber patientId")
      .select("-__v");

    if (!appointment) {
      res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: {
        appointment,
        cancelledBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get appointments by department
export const getAppointmentsByDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { department } = req.params;

    const appointments = await Appointment.find({
      department,
      isActive: true,
    })
      .populate("patientId", "firstName lastName phoneNumber patientId")
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .select("-__v");

    res.json({
      success: true,
      message: `${department} appointments retrieved successfully`,
      data: {
        appointments,
        department,
        count: appointments.length,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointments by department",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get today's appointments
export const getTodaysAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      isActive: true,
    })
      .populate("patientId", "firstName lastName phoneNumber patientId")
      .sort({ appointmentTime: 1 })
      .select("-__v");

    res.json({
      success: true,
      message: "Today's appointments retrieved successfully",
      data: {
        appointments,
        date: today.toDateString(),
        count: appointments.length,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching today's appointments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid appointment ID format",
      });
      return;
    }

    // Validate status
    const validStatuses = ["scheduled", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
      return;
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("patientId", "firstName lastName phoneNumber patientId")
      .select("-__v");

    if (!appointment) {
      res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
      return;
    }

    res.json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: {
        appointment,
        updatedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating appointment status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
