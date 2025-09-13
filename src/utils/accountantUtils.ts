import Accountant, {
  IAccountant,
  IAccountantPermissions,
} from "../models/Accountant";

// Simplified utility functions for accountant management

export class AccountantUtils {
  /**
   * Check if accountant has specific permission
   */
  static async checkAccountantPermission(
    accountantId: string,
    permission: keyof IAccountantPermissions
  ): Promise<boolean> {
    try {
      const accountant = await Accountant.findById(accountantId);
      if (!accountant || !accountant.isActive) return false;

      return accountant.hasPermission(permission);
    } catch (error) {
      console.error("Error checking accountant permission:", error);
      return false;
    }
  }

  /**
   * Generate accountant employee ID
   */
  static async generateEmployeeId(): Promise<string> {
    try {
      const count = await Accountant.countDocuments();
      const nextId = (count + 1).toString().padStart(4, "0");
      return `ACC${nextId}`;
    } catch (error) {
      const timestamp = Date.now().toString().slice(-4);
      return `ACC${timestamp}`;
    }
  }

  /**
   * Get active accountants
   */
  static async getActiveAccountants(): Promise<IAccountant[]> {
    try {
      return await Accountant.find({ isActive: true }).select("-password");
    } catch (error) {
      throw new Error(`Failed to get active accountants: ${error}`);
    }
  }
}

export default AccountantUtils;
