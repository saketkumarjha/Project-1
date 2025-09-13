import mongoose from "mongoose";
import Admin from "../models/Admin";
import Staff from "../models/Staff";
import Accountant from "../models/Accountant";
import connectDB from "../config/database";

async function verifyDatabase() {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database for verification...");

    // Count documents in each collection
    const adminCount = await Admin.countDocuments();
    const staffCount = await Staff.countDocuments();
    const accountantCount = await Accountant.countDocuments();

    console.log("\n=== DATABASE VERIFICATION ===");
    console.log(`Total Admins: ${adminCount}`);
    console.log(`Total Staff: ${staffCount}`);
    console.log(`Total Accountants: ${accountantCount}`);

    // Show sample records from each collection
    if (adminCount > 0) {
      console.log("\n=== SAMPLE ADMIN RECORDS ===");
      const admins = await Admin.find()
        .select("username email name role isActive")
        .limit(3);
      admins.forEach((admin, index) => {
        console.log(
          `${index + 1}. ${admin.name} (${admin.username}) - Role: ${
            admin.role
          }, Active: ${admin.isActive}`
        );
      });
    }

    if (staffCount > 0) {
      console.log("\n=== SAMPLE STAFF RECORDS ===");
      const staff = await Staff.find()
        .select("username email name department shift employeeId isActive")
        .limit(3);
      staff.forEach((member, index) => {
        console.log(
          `${index + 1}. ${member.name} (${member.employeeId}) - Dept: ${
            member.department
          }, Shift: ${member.shift}, Active: ${member.isActive}`
        );
      });
    }

    if (accountantCount > 0) {
      console.log("\n=== SAMPLE ACCOUNTANT RECORDS ===");
      const accountants = await Accountant.find()
        .select("username email name employeeId permissions isActive")
        .limit(3);
      accountants.forEach((accountant, index) => {
        console.log(
          `${index + 1}. ${accountant.name} (${
            accountant.employeeId
          }) - Billing: ${accountant.permissions.billingAccess}, Reports: ${
            accountant.permissions.reportAccess
          }, Active: ${accountant.isActive}`
        );
      });
    }

    if (adminCount === 0 && staffCount === 0 && accountantCount === 0) {
      console.log(
        "\nNo data found in database. Run 'npm run seed' to populate with sample data."
      );
    }
  } catch (error) {
    console.error("Error verifying database:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
    process.exit(0);
  }
}

// Run the verification function
verifyDatabase();
