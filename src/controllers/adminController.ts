import { Request, Response } from "express";
import Admin from "../models/Admin";
import Staff from "../models/Staff";
import Accountant from "../models/Accountant";

// Get all admins (super admin only)
export const getAllAdmins = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const admins = await Admin.find().select("-password");

    res.status(200).json({
      success: true,
      data: {
        admins,
        count: admins.length,
      },
    });
  } catch (error) {
    console.error("Get all admins error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get admin by ID
export const getAdminById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id).select("-password");
    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { admin },
    });
  } catch (error) {
    console.error("Get admin by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create new admin (super admin only)
export const createAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, password, email, name, role, profileImage, isActive} = req.body;

    // Validation
    if (!username || !password || !email || !name) {
      res.status(400).json({
        success: false,
        message: "Username, password, email, and name are required",
      });
      return;
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }],
    });

    if (existingAdmin) {
      res.status(400).json({
        success: false,
        message: "Admin with this username or email already exists",
      });
      return;
    }

    // Create new admin
    const newAdmin = new Admin({
      username,
      password,
      email,
      name,
      role: role || "admin",
      profileImage,
      isActive
    });

    await newAdmin.save();

    // Return the complete admin object matching the schema structure
    const createdAdmin = await Admin.findById(newAdmin._id).select("-password");

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        admin: createdAdmin,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update admin
export const updateAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, email, name, role, profileImage, isActive, permissions } =
      req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      });
      return;
    }

    // Check if username or email already exists (excluding current admin)
    if (username || email) {
      const existingAdmin = await Admin.findOne({
        _id: { $ne: id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
        ],
      });

      if (existingAdmin) {
        res.status(400).json({
          success: false,
          message: "Admin with this username or email already exists",
        });
        return;
      }
    }

    // Update fields
    if (username) admin.username = username;
    if (email) admin.email = email;
    if (name) admin.name = name;
    if (role) admin.role = role;
    if (profileImage !== undefined) admin.profileImage = profileImage;
    if (isActive !== undefined) admin.isActive = isActive;
    if (permissions)
      admin.permissions = { ...admin.permissions, ...permissions };

    await admin.save();

    // Return the complete updated admin object matching the schema structure
    const updatedAdmin = await Admin.findById(admin._id).select("-password");

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: {
        admin: updatedAdmin,
      },
    });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete admin (super admin only)
export const deleteAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if ((req.admin?._id as any)?.toString() === id) {
      res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
      return;
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      });
      return;
    }

    await Admin.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all staff
export const getAllStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const staff = await Staff.find().select("-password");

    res.status(200).json({
      success: true,
      data: {
        staff,
        count: staff.length,
      },
    });
  } catch (error) {
    console.error("Get all staff error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all accountants
export const getAllAccountants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const accountants = await Accountant.find().select("-password");

    res.status(200).json({
      success: true,
      data: {
        accountants,
        count: accountants.length,
      },
    });
  } catch (error) {
    console.error("Get all accountants error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
