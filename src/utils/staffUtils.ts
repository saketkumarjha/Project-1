import Staff, { IStaff, IStaffPermissions } from "../models/Staff";

// Simple utility functions for staff management - MVP version
export class StaffUtils {
  /**
   * Check if staff has specific permission
   */
  static async checkStaffPermission(
    staffId: string,
    permission: keyof IStaffPermissions
  ): Promise<boolean> {
    try {
      const staff = await Staff.findById(staffId);
      if (!staff || !staff.isActive) return false;

      return staff.hasPermission(permission);
    } catch (error) {
      console.error("Error checking staff permission:", error);
      return false;
    }
  }

  /**
   * Get staff by department
   */
  static async getStaffByDepartment(department: string): Promise<IStaff[]> {
    try {
      return await Staff.find({
        department,
        isActive: true,
      }).select("-password");
    } catch (error) {
      throw new Error(`Failed to get staff by department: ${error}`);
    }
  }

  /**
   * Validate profile image upload
   */
  static validateProfileImage(imagePath: string): boolean {
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const extension = imagePath
      .toLowerCase()
      .substring(imagePath.lastIndexOf("."));

    if (!validExtensions.includes(extension)) {
      return false;
    }

    return /^(https?:\/\/.+\.(jpg|jpeg|png|gif|webp)|\/[\w\/-]+\.(jpg|jpeg|png|gif|webp))$/i.test(
      imagePath
    );
  }

  /**
   * Get default avatar path
   */
  static getDefaultAvatarPath(): string {
    return "/images/default-avatar.png";
  }

  /**
   * Generate simple employee ID
   */
  static async generateEmployeeId(): Promise<string> {
    try {
      const count = await Staff.countDocuments();
      const nextId = (count + 1).toString().padStart(4, "0");
      return `EMP${nextId}`;
    } catch (error) {
      const timestamp = Date.now().toString().slice(-4);
      return `EMP${timestamp}`;
    }
  }
}

export default StaffUtils;
