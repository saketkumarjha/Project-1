import { Request, Response } from "express";
import mongoose from "mongoose";
import Patient from "../models/Patient";

// Create new patient (Emergency or Normal registration)
export const createPatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientData = req.body;

    // Create new patient
    const patient = new Patient(patientData);
    await patient.save();

    res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      data: {
        patient: {
          id: patient._id,
          patientId: patient.patientId,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          phoneNumber: patient.phoneNumber,
          address: patient.address,
          gender: patient.gender,
          email: patient.email,
          registrationType: patient.registrationType,
          patientType: patient.patientType,
          emergencyContact: patient.emergencyContact,
          createdAt: patient.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating patient",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all patients with search and filters
export const getAllPatients = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      search,
      registrationType,
      patientType,
      isActive = true,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query object
    const query: any = { isActive };

    // Search by patient name, phone, or patient ID
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by registration type
    if (registrationType && registrationType !== "all") {
      query.registrationType = registrationType;
    }

    // Filter by patient type
    if (patientType && patientType !== "all") {
      query.patientType = patientType;
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get patients with pagination
    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    // Get total count for pagination
    const totalPatients = await Patient.countDocuments(query);
    const totalPages = Math.ceil(totalPatients / limitNum);

    res.json({
      success: true,
      message: "Patients retrieved successfully",
      data: {
        patients,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalPatients,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patients",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get patient by ID
export const getPatientById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid patient ID format",
      });
      return;
    }

    const patient = await Patient.findById(id).select("-__v");

    if (!patient) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Patient details retrieved successfully",
      data: { patient },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patient details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get patient by patient ID
export const getPatientByPatientId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findOne({ patientId }).select("-__v");

    if (!patient) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Patient details retrieved successfully",
      data: { patient },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patient details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update patient
export const updatePatient = async (
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
        message: "Invalid patient ID format",
      });
      return;
    }

    // Remove fields that shouldn't be updated
    delete updateData.patientId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const patient = await Patient.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!patient) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Patient updated successfully",
      data: { patient },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating patient",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Soft delete patient (deactivate)
export const deletePatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid patient ID format",
      });
      return;
    }

    const patient = await Patient.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select("-__v");

    if (!patient) {
      res.status(404).json({
        success: false,
        message: "Patient not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Patient deactivated successfully",
      data: { patient },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deactivating patient",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get patients by registration type
export const getPatientsByType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type } = req.params;
    const patients = await Patient.find({
      registrationType: type,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json({
      success: true,
      message: `${type} patients retrieved successfully`,
      data: {
        patients,
        count: patients.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patients by type",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Emergency registration (minimal required fields)
export const emergencyRegistration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      phoneNumber,
      address,
      emergencyContact,
      reasonForVisit,
    } = req.body;

    // Validate required emergency fields
    if (
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !phoneNumber ||
      !address ||
      !emergencyContact
    ) {
      res.status(400).json({
        success: false,
        message: "Missing required fields for emergency registration",
      });
      return;
    }

    const patientData = {
      firstName,
      lastName,
      dateOfBirth,
      phoneNumber,
      address,
      emergencyContact,
      reasonForVisit,
      registrationType: "emergency",
      patientType: "emergency",
    };

    const patient = new Patient(patientData);
    await patient.save();

    res.status(201).json({
      success: true,
      message: "Emergency patient registered successfully",
      data: {
        patient: {
          id: patient._id,
          patientId: patient.patientId,
          firstName: patient.firstName,
          lastName: patient.lastName,
          phoneNumber: patient.phoneNumber,
          emergencyContact: patient.emergencyContact,
          reasonForVisit: patient.reasonForVisit,
          createdAt: patient.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error in emergency registration",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
