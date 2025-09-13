import { Request, Response } from "express";
import Staff from "../models/Staff";

// Get staff by ID
export const getStaffById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const staff = await Staff.findById(id).select("-password");
    if (!staff) {
      res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { staff },
    });
  } catch (error) {
    console.error("Get staff by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create new staff member
export const createStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      username,
      password,
      email,
      employeeId,
      name,
      department,
      contact,
      shift,
      profileImage,
      permissions,
    } = req.body;

    // Validation
    if (
      !username ||
      !password ||
      !email ||
      !employeeId ||
      !name ||
      !department ||
      !contact ||
      !shift
    ) {
      res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
      return;
    }

    // Check if staff already exists
    const existingStaff = await Staff.findOne({
      $or: [{ username }, { email }, { employeeId }],
    });

    if (existingStaff) {
      res.status(400).json({
        success: false,
        message:
          "Staff member with this username, email, or employee ID already exists",
      });
      return;
    }

    // Create new staff member
    const newStaff = new Staff({
      username,
      password,
      email,
      employeeId,
      name,
      department,
      contact,
      shift,
      profileImage,
      permissions: permissions || {},
    });

    await newStaff.save();

    res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: {
        staff: {
          id: (newStaff._id as any).toString(),
          username: newStaff.username,
          email: newStaff.email,
          employeeId: newStaff.employeeId,
          name: newStaff.name,
          department: newStaff.department,
          contact: newStaff.contact,
          shift: newStaff.shift,
          profileImage: newStaff.profileImage,
          permissions: newStaff.permissions,
          isActive: newStaff.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Create staff error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update staff member
export const updateStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      employeeId,
      name,
      department,
      contact,
      shift,
      profileImage,
      permissions,
      isActive,
    } = req.body;

    const staff = await Staff.findById(id);
    if (!staff) {
      res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
      return;
    }

    // Check if username, email, or employeeId already exists (excluding current staff)
    if (username || email || employeeId) {
      const existingStaff = await Staff.findOne({
        _id: { $ne: id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
          ...(employeeId ? [{ employeeId }] : []),
        ],
      });

      if (existingStaff) {
        res.status(400).json({
          success: false,
          message:
            "Staff member with this username, email, or employee ID already exists",
        });
        return;
      }
    }

    // Update fields
    if (username) staff.username = username;
    if (email) staff.email = email;
    if (employeeId) staff.employeeId = employeeId;
    if (name) staff.name = name;
    if (department) staff.department = department;
    if (contact) staff.contact = contact;
    if (shift) staff.shift = shift;
    if (profileImage !== undefined) staff.profileImage = profileImage;
    if (permissions)
      staff.permissions = { ...staff.permissions, ...permissions };
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    res.status(200).json({
      success: true,
      message: "Staff member updated successfully",
      data: {
        staff: {
          id: (staff._id as any).toString(),
          username: staff.username,
          email: staff.email,
          employeeId: staff.employeeId,
          name: staff.name,
          department: staff.department,
          contact: staff.contact,
          shift: staff.shift,
          profileImage: staff.profileImage,
          permissions: staff.permissions,
          isActive: staff.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Update staff error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete staff member
export const deleteStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const staff = await Staff.findById(id);
    if (!staff) {
      res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
      return;
    }

    await Staff.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
