import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Admin, { IAdmin } from "../models/Admin";
import Accountant, { IAccountant } from "../models/Accountant";
import Staff, { IStaff } from "../models/Staff";

// Extend Request interface to include admin, accountant, and staff
declare global {
  namespace Express {
    interface Request {
      admin?: IAdmin;
      accountant?: IAccountant;
      staff?: IStaff;
      userType?: "admin" | "accountant" | "staff";
    }
  }
}

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token and authenticate admin
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string }; //This is a TypeScript type assertion that tells TypeScript "treat the decoded result as an object with an adminId property of type string".

    // Find admin in database
    const admin = await Admin.findById(decoded.adminId).select("-password");

    if (!admin) {
      res.status(401).json({
        success: false,
        message: "Invalid token. Admin not found.",
      });
      return;
    }

    if (!admin.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is deactivated.",
      });
      return;
    }

    // Add admin to request object
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

// Middleware to check specific admin permissions
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!req.admin.hasPermission(permission as any)) {
      res.status(403).json({
        success: false,
        message: `Access denied. ${permission} permission required.`,
      });
      return;
    }

    next();
  };
};

// Middleware to check if admin is super admin
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.admin) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (req.admin.role !== "super_admin") {
    res.status(403).json({
      success: false,
      message: "Access denied. Super admin privileges required.",
    });
    return;
  }

  next();
};

// Middleware to verify JWT token and authenticate accountant
export const authenticateAccountant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      accountantId: string;
      userType: string;
    };

    if (decoded.userType !== "accountant") {
      res.status(401).json({
        success: false,
        message: "Invalid token type.",
      });
      return;
    }

    // Find accountant in database
    const accountant = await Accountant.findById(decoded.accountantId).select(
      "-password"
    );

    if (!accountant) {
      res.status(401).json({
        success: false,
        message: "Invalid token. Accountant not found.",
      });
      return;
    }

    if (!accountant.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is deactivated.",
      });
      return;
    }

    // Add accountant to request object
    req.accountant = accountant;
    req.userType = "accountant";
    next();
  } catch (error) {
    console.error("Accountant authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

// Middleware to authenticate staff
export const authenticateStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      staffId: string;
      userType: string;
    };

    if (decoded.userType !== "staff") {
      res.status(401).json({
        success: false,
        message: "Invalid token type.",
      });
      return;
    }

    // Find staff in database
    const staff = await Staff.findById(decoded.staffId).select("-password");

    if (!staff) {
      res.status(401).json({
        success: false,
        message: "Invalid token. Staff not found.",
      });
      return;
    }

    if (!staff.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is deactivated.",
      });
      return;
    }

    // Add staff to request object
    req.staff = staff;
    req.userType = "staff";
    next();
  } catch (error) {
    console.error("Staff authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

// Middleware to authenticate admin, accountant, or staff
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.userType === "admin" && decoded.adminId) {
      // Admin authentication
      const admin = await Admin.findById(decoded.adminId).select("-password");

      if (!admin || !admin.isActive) {
        res.status(401).json({
          success: false,
          message: "Invalid admin token.",
        });
        return;
      }

      req.admin = admin;
      req.userType = "admin";
    } else if (decoded.userType === "accountant" && decoded.accountantId) {
      // Accountant authentication
      const accountant = await Accountant.findById(decoded.accountantId).select(
        "-password"
      );

      if (!accountant || !accountant.isActive) {
        res.status(401).json({
          success: false,
          message: "Invalid accountant token.",
        });
        return;
      }

      req.accountant = accountant;
      req.userType = "accountant";
    } else if (decoded.userType === "staff" && decoded.staffId) {
      // Staff authentication
      const staff = await Staff.findById(decoded.staffId).select("-password");

      if (!staff || !staff.isActive) {
        res.status(401).json({
          success: false,
          message: "Invalid staff token. Bsdk yhi se error aarha h",
        });
        return;
      }

      req.staff = staff;
      req.userType = "staff";
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid token format.",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("User authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

// Middleware to check billing access (for both admin and accountant)
export const requireBillingAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.userType === "admin" && req.admin) {
    // Check admin billing permission
    if (!req.admin.hasPermission("billingAccess")) {
      res.status(403).json({
        success: false,
        message: "Access denied. Billing access permission required.",
      });
      return;
    }
  } else if (req.userType === "accountant" && req.accountant) {
    // Check accountant billing permission
    if (!req.accountant.hasPermission("billingAccess")) {
      res.status(403).json({
        success: false,
        message: "Access denied. Billing access permission required.",
      });
      return;
    }
  } else {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  next();
};

// Middleware to check report access (for both admin and accountant)
export const requireReportAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.userType === "admin" && req.admin) {
    // Check admin report permission
    if (!req.admin.hasPermission("reportAccess")) {
      res.status(403).json({
        success: false,
        message: "Access denied. Report access permission required.",
      });
      return;
    }
  } else if (req.userType === "accountant" && req.accountant) {
    // Check accountant report permission
    if (!req.accountant.hasPermission("reportAccess")) {
      res.status(403).json({
        success: false,
        message: "Access denied. Report access permission required.",
      });
      return;
    }
  } else {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  next();
};

// Middleware to check staff permissions
export const requireStaffPermission = (
  permission: keyof IStaff["permissions"]
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.staff) {
      res.status(401).json({
        success: false,
        message: "Staff authentication required.",
      });
      return;
    }

    if (!req.staff.hasPermission(permission)) {
      res.status(403).json({
        success: false,
        message: `Access denied. ${permission} permission required.`,
      });
      return;
    }

    next();
  };
};

// Middleware to check patient management access (for admin and staff)
export const requirePatientAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.userType === "admin" && req.admin) {
    // Check admin patient management permission
    if (!req.admin.hasPermission("patientManagement")) {
      res.status(403).json({
        success: false,
        message: "Access denied. Patient management permission required.",
      });
      return;
    }
  } else if (req.userType === "staff" && req.staff) {
    // Check staff patient access permission
    if (!req.staff.hasPermission("patientAccess")) {
      res.status(403).json({
        success: false,
        message: "Access denied. Patient access permission required.",
      });
      return;
    }
  } else {
    res.status(401).json({
      success: false,
      message:
        "Authentication required. Only admin and staff can access patient management.",
    });
    return;
  }

  next();
};

// Middleware to check appointment booking access (for admin and staff)
export const requireAppointmentAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.userType === "admin" && req.admin) {
    // Check admin patient management permission (admins use patientManagement for appointments)
    if (!req.admin.hasPermission("patientManagement")) {
      res.status(403).json({
        success: false,
        message:
          "Access denied. Patient management permission required for appointment access.",
      });
      return;
    }
  } else if (req.userType === "staff" && req.staff) {
    // Check staff book appointment access permission
    if (!req.staff.hasPermission("bookAppointmentAccess")) {
      res.status(403).json({
        success: false,
        message: "Access denied. Book appointment access permission required.",
      });
      return;
    }
  } else {
    res.status(401).json({
      success: false,
      message:
        "Authentication required. Only admin and staff can access appointment management.",
    });
    return;
  }

  next();
};

// Middleware to check workflow access (for admin and staff)
export const requireWorkflowAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.userType === "admin" && req.admin) {
    // Check admin patient management permission (admins use patientManagement for workflows)
    if (!req.admin.hasPermission("patientManagement")) {
      res.status(403).json({
        success: false,
        message:
          "Access denied. Patient management permission required for workflow access.",
      });
      return;
    }
  } else if (req.userType === "staff" && req.staff) {
    // Check staff workflow access permission
    if (!req.staff.hasPermission("workflowAccess")) {
      res.status(403).json({
        success: false,
        message: "Access denied. Workflow access permission required.",
      });
      return;
    }
  } else {
    res.status(401).json({
      success: false,
      message:
        "Authentication required. Only admin and staff can access workflow management.",
    });
    return;
  }

  next();
};

// Middleware to check room management access (for admin and staff)
export const requireRoomAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.userType === "admin" && req.admin) {
    // Check admin patient management permission (admins use patientManagement for rooms)
    if (!req.admin.hasPermission("patientManagement")) {
      res.status(403).json({
        success: false,
        message:
          "Access denied. Patient management permission required for room access.",
      });
      return;
    }
  } else if (req.userType === "staff" && req.staff) {
    // Check staff room management access permission
    if (!req.staff.hasPermission("roomManagementAccess")) {
      res.status(403).json({
        success: false,
        message: "Access denied. Room management access permission required.",
      });
      return;
    }
  } else {
    res.status(401).json({
      success: false,
      message:
        "Authentication required. Only admin and staff can access room management.",
    });
    return;
  }

  next();
};
