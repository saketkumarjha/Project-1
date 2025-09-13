import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin";
import Accountant from "../models/Accountant";
import Staff from "../models/Staff";

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Generate JWT token for admin
const generateAdminToken = (adminId: string): string => {
  return jwt.sign({ adminId, userType: "admin" }, JWT_SECRET, {
    expiresIn: "24h",
  });
};

// Generate JWT token for accountant
const generateAccountantToken = (accountantId: string): string => {
  return jwt.sign({ accountantId, userType: "accountant" }, JWT_SECRET, {
    expiresIn: "24h",
  });
};

// Generate JWT token for staff
const generateStaffToken = (staffId: string): string => {
  return jwt.sign({ staffId, userType: "staff" }, JWT_SECRET, {
    expiresIn: "24h",
  });
};

// Admin login
export const adminLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
      return;
    }

    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Check if admin is active
    if (!admin.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateAdminToken((admin._id as any).toString());

    // Return success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        admin: {
          id: (admin._id as any).toString(),
          username: admin.username,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          profileImage: admin.profileImage,
          permissions: admin.permissions,
          lastLogin: admin.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin logout (client-side token removal, but we can track it)
export const adminLogout = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return a success message
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// Accountant login
export const accountantLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
      return;
    }

    // Find accountant by username
    const accountant = await Accountant.findOne({ username });
    if (!accountant) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Check if accountant is active
    if (!accountant.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await accountant.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Update last login
    accountant.lastLogin = new Date();
    await accountant.save();

    // Generate token
    const token = generateAccountantToken((accountant._id as any).toString());

    // Return success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        accountant: {
          id: (accountant._id as any).toString(),
          username: accountant.username,
          email: accountant.email,
          name: accountant.name,
          employeeId: accountant.employeeId,
          contact: accountant.contact,
          profileImage: accountant.profileImage,
          permissions: accountant.permissions,
          lastLogin: accountant.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error("Accountant login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// Staff login
export const staffLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
      return;
    }

    // Find staff by username
    const staff = await Staff.findOne({ username });
    if (!staff) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Check if staff is active
    if (!staff.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await staff.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Update last login
    staff.lastLogin = new Date();
    await staff.save();

    // Generate token
    const token = generateStaffToken((staff._id as any).toString());

    // Return success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        staff: {
          id: (staff._id as any).toString(),
          username: staff.username,
          email: staff.email,
          name: staff.name,
          employeeId: staff.employeeId,
          department: staff.department,
          contact: staff.contact,
          shift: staff.shift,
          profileImage: staff.profileImage,
          permissions: staff.permissions,
          lastLogin: staff.lastLogin,
        },
        userType: "staff",
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
