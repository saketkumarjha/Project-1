import Admin, { IAdmin } from "../models/Admin";

/**
 * Utility functions for Admin management - simplified for MVP
 */

/**
 * Create a default admin user if none exists
 */
export async function ensureDefaultAdmin(): Promise<IAdmin> {
  try {
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (existingAdmin) {
      return existingAdmin;
    }

    const defaultAdmin = new Admin({
      username: "admin",
      password: "admin123",
      email: "admin@hospital.com",
      name: "System Administrator",
      role: "super_admin",
    });

    const savedAdmin = await defaultAdmin.save();
    console.log("Default admin created successfully");
    return savedAdmin;
  } catch (error) {
    console.error("Error creating default admin:", error);
    throw error;
  }
}

/**
 * Validate profile image URL
 */
export function validateProfileImageUrl(url: string): {
  isValid: boolean;
  error?: string;
} {
  if (!url) return { isValid: true }; // Optional field

  // Check if it's a valid image URL
  const imageUrlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
  if (!imageUrlPattern.test(url)) {
    return {
      isValid: false,
      error:
        "Profile image must be a valid image URL (jpg, jpeg, png, gif, or webp)",
    };
  }

  return { isValid: true };
}

/**
 * Sanitize admin data for API responses (remove sensitive fields)
 */
export function sanitizeAdminData(admin: IAdmin): Omit<IAdmin, "password"> {
  const { password, ...sanitizedAdmin } = admin.toObject
    ? admin.toObject()
    : admin;
  return sanitizedAdmin;
}
