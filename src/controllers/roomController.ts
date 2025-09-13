import { Request, Response } from "express";
import mongoose from "mongoose";
import Room from "../models/Room";
import Patient from "../models/Patient";

// Create new room
export const createRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      roomNumber,
      roomType,
      department,
      floor,
      maxOccupancy,
      pricePerDay,
      amenities,
      notes,
    } = req.body;

    // Validate required fields
    if (!roomNumber || !roomType || !department || !floor || !pricePerDay) {
      res.status(400).json({
        success: false,
        message:
          "Missing required fields: roomNumber, roomType, department, floor, pricePerDay",
      });
      return;
    }

    // Check if room number already exists
    const existingRoom = await Room.findOne({ roomNumber, isActive: true });
    if (existingRoom) {
      res.status(400).json({
        success: false,
        message: "Room number already exists",
      });
      return;
    }

    const roomData = {
      roomNumber,
      roomType,
      department,
      floor,
      maxOccupancy: maxOccupancy || 2,
      pricePerDay,
      amenities: amenities || [],
      notes,
      patientAssignments: [],
    };

    const room = new Room(roomData);
    await room.save();

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: {
        room,
        createdBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating room",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all rooms with filters
export const getAllRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      status,
      roomType,
      department,
      floor,
      available,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query object
    const query: any = { isActive: true };

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by room type
    if (roomType && roomType !== "all") {
      query.roomType = roomType;
    }

    // Filter by department
    if (department && department !== "all") {
      query.department = department;
    }

    // Filter by floor
    if (floor) {
      query.floor = parseInt(floor as string);
    }

    // Filter available rooms only (including partially occupied)
    if (available === "true") {
      query.status = { $in: ["Available", "Partially-Occupied"] };
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get rooms with patient details
    const rooms = await Room.find(query)
      .populate(
        "patientAssignments.patientId",
        "firstName lastName phoneNumber patientId"
      )
      .sort({ roomNumber: 1 })
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    // Get total count for pagination
    const totalRooms = await Room.countDocuments(query);
    const totalPages = Math.ceil(totalRooms / limitNum);

    res.json({
      success: true,
      message: "Rooms retrieved successfully",
      data: {
        rooms,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalRooms,
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
      message: "Error fetching rooms",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get room by ID
export const getRoomById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid room ID format",
      });
      return;
    }

    const room = await Room.findById(id)
      .populate(
        "patientAssignments.patientId",
        "firstName lastName phoneNumber patientId dateOfBirth address"
      )
      .select("-__v");

    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Room details retrieved successfully",
      data: {
        room,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching room details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update room details
export const updateRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      roomType,
      department,
      floor,
      maxOccupancy,
      pricePerDay,
      amenities,
      notes,
      status,
      lastCleaned,
    } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid room ID format",
      });
      return;
    }

    const room = await Room.findById(id);
    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found",
      });
      return;
    }

    // Update room fields
    if (roomType) room.roomType = roomType;
    if (department) room.department = department;
    if (floor) room.floor = floor;
    if (maxOccupancy) room.maxOccupancy = maxOccupancy;
    if (pricePerDay) room.pricePerDay = pricePerDay;
    if (amenities) room.amenities = amenities;
    if (notes !== undefined) room.notes = notes;
    if (status) room.status = status;
    if (lastCleaned) room.lastCleaned = new Date(lastCleaned);

    await room.save();

    res.json({
      success: true,
      message: "Room updated successfully",
      data: {
        room,
        updatedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating room",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Assign patient to room
export const assignPatientToRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { patientId, bedNumber, expectedDischargeDate } = req.body;

    // Validate ObjectId formats
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(patientId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid room ID or patient ID format",
      });
      return;
    }

    // Validate required fields
    if (!patientId || !bedNumber) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: patientId, bedNumber",
      });
      return;
    }

    const room = await Room.findById(id);
    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found",
      });
      return;
    }

    // Get patient details
    const patient = await Patient.findById(patientId);
    if (!patient) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    // Check if room has capacity
    if (room.currentOccupancy >= room.maxOccupancy) {
      res.status(400).json({
        success: false,
        message: "Room is at maximum capacity",
      });
      return;
    }

    // Check if bed is already occupied
    const existingAssignment = room.patientAssignments.find(
      (assignment) =>
        assignment.bedNumber === bedNumber && assignment.status === "Active"
    );

    if (existingAssignment) {
      res.status(400).json({
        success: false,
        message: `Bed ${bedNumber} is already occupied`,
      });
      return;
    }

    // Add patient assignment
    room.patientAssignments.push({
      bedNumber,
      patientId: new mongoose.Types.ObjectId(patientId),
      patientName: `${patient.firstName} ${patient.lastName}`,
      uhid: patient.patientId,
      admittedDate: new Date(),
      expectedDischargeDate: expectedDischargeDate
        ? new Date(expectedDischargeDate)
        : undefined,
      status: "Active",
    });

    await room.save();

    res.json({
      success: true,
      message: "Patient assigned to room successfully",
      data: {
        room,
        assignedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error assigning patient to room",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Discharge patient from room
export const dischargePatientFromRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { patientId } = req.body;

    // Validate ObjectId formats
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(patientId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid room ID or patient ID format",
      });
      return;
    }

    const room = await Room.findById(id);
    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found",
      });
      return;
    }

    // Find and discharge patient
    const assignment = room.patientAssignments.find(
      (assignment) =>
        assignment.patientId.toString() === patientId.toString() &&
        assignment.status === "Active"
    );

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: "Patient not found in this room",
      });
      return;
    }

    assignment.status = "Discharge";
    await room.save();

    res.json({
      success: true,
      message: "Patient discharged from room successfully",
      data: {
        room,
        dischargedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error discharging patient from room",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Transfer patient from room
export const transferPatientFromRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { patientId } = req.body;

    // Validate ObjectId formats
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(patientId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid room ID or patient ID format",
      });
      return;
    }

    const room = await Room.findById(id);
    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found",
      });
      return;
    }

    // Find and transfer patient
    const assignment = room.patientAssignments.find(
      (assignment) =>
        assignment.patientId.toString() === patientId.toString() &&
        assignment.status === "Active"
    );

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: "Patient not found in this room",
      });
      return;
    }

    assignment.status = "Transferred";
    await room.save();

    res.json({
      success: true,
      message: "Patient transferred from room successfully",
      data: {
        room,
        transferredBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error transferring patient from room",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete room (soft delete)
export const deleteRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid room ID format",
      });
      return;
    }

    const room = await Room.findById(id);
    if (!room) {
      res.status(404).json({
        success: false,
        message: "Room not found",
      });
      return;
    }

    // Check if room has active patients
    const activePatients = room.patientAssignments.filter(
      (assignment) => assignment.status === "Active"
    );

    if (activePatients.length > 0) {
      res.status(400).json({
        success: false,
        message: "Cannot delete room with active patient assignments",
        data: {
          activePatients: activePatients.length,
        },
      });
      return;
    }

    // Soft delete
    room.isActive = false;
    await room.save();

    res.json({
      success: true,
      message: "Room deleted successfully",
      data: {
        room,
        deletedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting room",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get available rooms (including partially occupied)
export const getAvailableRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { roomType, department, floor, includePartial = "true" } = req.query;

    const query: any = {
      isActive: true,
    };

    // Include available and partially occupied rooms by default
    if (includePartial === "true") {
      query.status = { $in: ["Available", "Partially-Occupied"] };
    } else {
      query.status = "Available";
    }

    if (roomType && roomType !== "all") {
      query.roomType = roomType;
    }

    if (department && department !== "all") {
      query.department = department;
    }

    if (floor) {
      query.floor = parseInt(floor as string);
    }

    const rooms = await Room.find(query).sort({ roomNumber: 1 }).select("-__v");

    res.json({
      success: true,
      message: "Available rooms retrieved successfully",
      data: {
        rooms,
        count: rooms.length,
        includePartiallyOccupied: includePartial === "true",
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching available rooms",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get rooms by department
export const getRoomsByDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { department } = req.params;

    const rooms = await Room.find({
      department,
      isActive: true,
    })
      .populate(
        "patientAssignments.patientId",
        "firstName lastName phoneNumber patientId"
      )
      .sort({ roomNumber: 1 })
      .select("-__v");

    res.json({
      success: true,
      message: `Rooms in ${department} department retrieved successfully`,
      data: {
        rooms,
        department,
        count: rooms.length,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching rooms by department",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get rooms by floor
export const getRoomsByFloor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { floor } = req.params;

    const rooms = await Room.find({
      floor: parseInt(floor),
      isActive: true,
    })
      .populate(
        "patientAssignments.patientId",
        "firstName lastName phoneNumber patientId"
      )
      .sort({ roomNumber: 1 })
      .select("-__v");

    res.json({
      success: true,
      message: `Rooms on floor ${floor} retrieved successfully`,
      data: {
        rooms,
        floor: parseInt(floor),
        count: rooms.length,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching rooms by floor",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get rooms with available beds
export const getRoomsWithAvailableBeds = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { roomType, department, floor } = req.query;

    const query: any = {
      $expr: { $lt: ["$currentOccupancy", "$maxOccupancy"] },
      status: { $nin: ["Maintenance", "Reserved"] },
      isActive: true,
    };

    if (roomType && roomType !== "all") {
      query.roomType = roomType;
    }

    if (department && department !== "all") {
      query.department = department;
    }

    if (floor) {
      query.floor = parseInt(floor as string);
    }

    const rooms = await Room.find(query)
      .populate(
        "patientAssignments.patientId",
        "firstName lastName phoneNumber patientId"
      )
      .sort({ roomNumber: 1 })
      .select("-__v");

    // Add available beds count to each room
    const roomsWithAvailableBeds = rooms.map((room) => ({
      ...room.toObject(),
      availableBeds: room.maxOccupancy - room.currentOccupancy,
    }));

    res.json({
      success: true,
      message: "Rooms with available beds retrieved successfully",
      data: {
        rooms: roomsWithAvailableBeds,
        count: rooms.length,
        accessedBy: {
          userType: req.userType,
          name: req.userType === "admin" ? req.admin?.name : req.staff?.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching rooms with available beds",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
