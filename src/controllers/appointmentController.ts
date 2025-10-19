import { Request, Response } from "express";
import mongoose from "mongoose";
import Appointment from "../models/Appointment";
import Patient from "../models/Patient";
import { httpCacheService } from "../services/cacheService";

/**
 * CREATE NEW APPOINTMENT
 * Creates a new appointment and invalidates relevant cache entries
 * Cache Strategy: Invalidate related caches after successful creation including
 * department-specific, date-specific, and patient-specific appointment caches
 */
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

    // Comprehensive cache invalidation after appointment creation
    // Invalidate all appointments cache to ensure data consistency
    await httpCacheService.invalidateCache('appointments');
    
    // Invalidate patient-specific appointment cache
    if (appointment.patientId) {
      await httpCacheService.invalidateCache('appointments', `*patient:${appointment.patientId}*`);
    }
    
    // Invalidate department-specific cache
    if (appointment.department) {
      await httpCacheService.invalidateCache('appointments', `*department:${appointment.department}*`);
    }
    
    // Invalidate doctor-specific cache
    if (appointment.doctorName) {
      await httpCacheService.invalidateCache('appointments', `*doctor:${appointment.doctorName}*`);
    }
    
    // Invalidate date-specific cache (today's appointments, specific date filters)
    const appointmentDateStr = appointment.appointmentDate.toISOString().split('T')[0];
    await httpCacheService.invalidateCache('appointments', `*date:${appointmentDateStr}*`);
    await httpCacheService.invalidateCache('appointments', `*today*`);
    
    // Invalidate status-specific cache
    await httpCacheService.invalidateCache('appointments', `*status:${appointment.status}*`);

    console.log(`[APPOINTMENTS] New appointment created: ${appointment._id} for patient: ${appointment.patientId} in department: ${appointment.department}`);

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
      cache: {
        invalidated: true,
        patterns: [
          'appointments:*',
          `appointments:*patient:${appointment.patientId}*`,
          `appointments:*department:${appointment.department}*`,
          `appointments:*doctor:${appointment.doctorName}*`,
          `appointments:*date:${appointmentDateStr}*`,
          `appointments:*today*`,
          `appointments:*status:${appointment.status}*`
        ]
      }
    });
  } catch (error) {
    console.error('[APPOINTMENTS] Error creating appointment:', error);
    res.status(400).json({
      success: false,
      message: "Error creating appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET ALL APPOINTMENTS WITH FILTERS
 * Retrieves appointments with department, doctor, status, and date filters
 * Cache Strategy: Cache results based on query parameters with 5-minute TTL
 * Cache key includes all filter parameters for precise cache matching
 */
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

    console.log(`[APPOINTMENTS] Fetching appointments with filters:`, {
      department, doctorName, status, appointmentDate, fromDate, toDate, page, limit
    });

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

    const response = {
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
      cache: {
        served_from: 'database', // Will be overridden if served from cache
        query_signature: `dept:${department || 'all'}_doctor:${doctorName || 'none'}_status:${status || 'all'}_date:${appointmentDate || 'none'}_range:${fromDate || 'none'}-${toDate || 'none'}_page:${pageNum}_limit:${limitNum}`
      }
    };

    console.log(`[APPOINTMENTS] Appointments retrieved: ${appointments.length} items, page ${pageNum}/${totalPages}`);

    res.json(response);
  } catch (error) {
    console.error('[APPOINTMENTS] Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET APPOINTMENT BY ID
 * Retrieves a specific appointment by its ID with patient details
 * Cache Strategy: Cache individual appointments with 10-minute TTL
 */
export const getAppointmentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    console.log(`[APPOINTMENTS] Fetching appointment by ID: ${id}`);

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
      cache: {
        served_from: 'database', // Will be overridden if served from cache
        appointment_id: id
      }
    });
  } catch (error) {
    console.error('[APPOINTMENTS] Error fetching appointment details:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointment details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * UPDATE APPOINTMENT
 * Updates an existing appointment and invalidates relevant cache entries
 * Cache Strategy: Invalidate specific appointment cache and related patterns
 * Handles changes in department, doctor, date, and status with targeted invalidation
 */
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

    // Get existing appointment for cache invalidation comparison
    const existingAppointment = await Appointment.findById(id);
    if (!existingAppointment) {
      res.status(404).json({
        success: false,
        message: "Appointment not found",
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

    // Comprehensive cache invalidation for appointment updates
    // Invalidate specific appointment cache
    await httpCacheService.invalidateCache('appointments', `*${id}*`);
    
    // Invalidate all appointments list cache
    await httpCacheService.invalidateCache('appointments', '*getAllAppointments*');
    
    // Invalidate patient-specific cache (both old and new if patient changed)
    if (existingAppointment.patientId) {
      await httpCacheService.invalidateCache('appointments', `*patient:${existingAppointment.patientId}*`);
    }
    if (appointment.patientId && appointment.patientId.toString() !== existingAppointment.patientId.toString()) {
      await httpCacheService.invalidateCache('appointments', `*patient:${appointment.patientId}*`);
    }
    
    // Invalidate department-specific cache (both old and new if department changed)
    if (existingAppointment.department) {
      await httpCacheService.invalidateCache('appointments', `*department:${existingAppointment.department}*`);
    }
    if (appointment.department && appointment.department !== existingAppointment.department) {
      await httpCacheService.invalidateCache('appointments', `*department:${appointment.department}*`);
    }
    
    // Invalidate doctor-specific cache (both old and new if doctor changed)
    if (existingAppointment.doctorName) {
      await httpCacheService.invalidateCache('appointments', `*doctor:${existingAppointment.doctorName}*`);
    }
    if (appointment.doctorName && appointment.doctorName !== existingAppointment.doctorName) {
      await httpCacheService.invalidateCache('appointments', `*doctor:${appointment.doctorName}*`);
    }
    
    // Invalidate date-specific cache (both old and new if date changed)
    const existingDateStr = existingAppointment.appointmentDate.toISOString().split('T')[0];
    await httpCacheService.invalidateCache('appointments', `*date:${existingDateStr}*`);
    
    if (appointment.appointmentDate) {
      const newDateStr = appointment.appointmentDate.toISOString().split('T')[0];
      if (newDateStr !== existingDateStr) {
        await httpCacheService.invalidateCache('appointments', `*date:${newDateStr}*`);
      }
    }
    
    // Invalidate today's appointments cache
    await httpCacheService.invalidateCache('appointments', `*today*`);
    
    // Invalidate status-specific cache (both old and new if status changed)
    if (existingAppointment.status) {
      await httpCacheService.invalidateCache('appointments', `*status:${existingAppointment.status}*`);
    }
    if (appointment.status && appointment.status !== existingAppointment.status) {
      await httpCacheService.invalidateCache('appointments', `*status:${appointment.status}*`);
    }

    console.log(`[APPOINTMENTS] Appointment updated: ${appointment._id}`);

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
      cache: {
        invalidated: true,
        patterns: [
          `appointments:*${id}*`,
          `appointments:*patient:${appointment.patientId}*`,
          `appointments:*department:${appointment.department}*`,
          `appointments:*doctor:${appointment.doctorName}*`,
          'appointments:*today*'
        ]
      }
    });
  } catch (error) {
    console.error('[APPOINTMENTS] Error updating appointment:', error);
    res.status(400).json({
      success: false,
      message: "Error updating appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * DELETE APPOINTMENT (SOFT DELETE)
 * Soft delete by setting isActive to false and invalidating relevant cache entries
 * Cache Strategy: Invalidate related cache entries after soft delete
 */
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

    // Comprehensive cache invalidation for appointment deletion
    // Invalidate specific appointment cache
    await httpCacheService.invalidateCache('appointments', `*${id}*`);
    
    // Invalidate all appointments list cache (since count changes)
    await httpCacheService.invalidateCache('appointments');
    
    // Invalidate patient-specific cache
    if (appointment.patientId) {
      await httpCacheService.invalidateCache('appointments', `*patient:${appointment.patientId}*`);
    }
    
    // Invalidate department-specific cache
    if (appointment.department) {
      await httpCacheService.invalidateCache('appointments', `*department:${appointment.department}*`);
    }
    
    // Invalidate doctor-specific cache
    if (appointment.doctorName) {
      await httpCacheService.invalidateCache('appointments', `*doctor:${appointment.doctorName}*`);
    }
    
    // Invalidate date-specific cache
    const appointmentDateStr = appointment.appointmentDate.toISOString().split('T')[0];
    await httpCacheService.invalidateCache('appointments', `*date:${appointmentDateStr}*`);
    await httpCacheService.invalidateCache('appointments', `*today*`);
    
    // Invalidate status-specific cache
    await httpCacheService.invalidateCache('appointments', `*status:${appointment.status}*`);

    console.log(`[APPOINTMENTS] Appointment cancelled: ${appointment._id}`);

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
      cache: {
        invalidated: true,
        patterns: [
          `appointments:*${id}*`,
          `appointments:*patient:${appointment.patientId}*`,
          `appointments:*department:${appointment.department}*`,
          `appointments:*today*`
        ]
      }
    });
  } catch (error) {
    console.error('[APPOINTMENTS] Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: "Error cancelling appointment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET APPOINTMENTS BY DEPARTMENT
 * Retrieves appointments filtered by department
 * Cache Strategy: Cache department-specific queries with 5-minute TTL
 */
export const getAppointmentsByDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { department } = req.params;

    console.log(`[APPOINTMENTS] Fetching appointments for department: ${department}`);

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
      cache: {
        served_from: 'database', // Will be overridden if served from cache
        department_filter: department
      }
    });
  } catch (error) {
    console.error('[APPOINTMENTS] Error fetching appointments by department:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments by department",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * GET TODAY'S APPOINTMENTS
 * Retrieves all appointments scheduled for today
 * Cache Strategy: Cache today's appointments with 2-minute TTL (frequently changing data)
 * This is critical for dashboard real-time updates
 */
export const getTodaysAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log(`[APPOINTMENTS] Fetching today's appointments`);

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
      cache: {
        served_from: 'database', // Will be overridden if served from cache
        query_type: 'todays_appointments',
        date: today.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('[APPOINTMENTS] Error fetching today\'s appointments:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching today's appointments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * UPDATE APPOINTMENT STATUS
 * Updates only the status of an appointment and invalidates relevant cache entries
 * Cache Strategy: Invalidate status-specific and appointment-specific caches
 */
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

    // Get existing appointment for cache invalidation
    const existingAppointment = await Appointment.findById(id);
    if (!existingAppointment) {
      res.status(404).json({
        success: false,
        message: "Appointment not found",
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

    // Cache invalidation for status update
    // Invalidate specific appointment cache
    await httpCacheService.invalidateCache('appointments', `*${id}*`);
    
    // Invalidate all appointments list cache
    await httpCacheService.invalidateCache('appointments', '*getAllAppointments*');
    
    // Invalidate old status cache
    if (existingAppointment.status) {
      await httpCacheService.invalidateCache('appointments', `*status:${existingAppointment.status}*`);
    }
    
    // Invalidate new status cache
    await httpCacheService.invalidateCache('appointments', `*status:${status}*`);
    
    // Invalidate department and today's cache as status affects these views
    await httpCacheService.invalidateCache('appointments', `*department:${appointment.department}*`);
    await httpCacheService.invalidateCache('appointments', `*today*`);

    console.log(`[APPOINTMENTS] Appointment status updated: ${appointment._id} from ${existingAppointment.status} to ${status}`);

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
      cache: {
        invalidated: true,
        status_change: {
          from: existingAppointment.status,
          to: status
        },
        patterns: [
          `appointments:*${id}*`,
          `appointments:*status:${existingAppointment.status}*`,
          `appointments:*status:${status}*`,
          `appointments:*department:${appointment.department}*`,
          'appointments:*today*'
        ]
      }
    });
  } catch (error) {
    console.error('[APPOINTMENTS] Error updating appointment status:', error);
    res.status(400).json({
      success: false,
      message: "Error updating appointment status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};