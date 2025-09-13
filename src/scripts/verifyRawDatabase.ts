import mongoose from "mongoose";
import connectDB from "../config/database";

async function verifyRawDatabase() {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database for raw verification...");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    console.log("Database name:", db.databaseName);

    // Check raw documents in each collection
    console.log("\n=== RAW ADMIN DOCUMENTS ===");
    const rawAdmins = await db.collection("admins").find({}).toArray();
    rawAdmins.forEach((admin, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log(`  Username: ${admin.username}`);
      console.log(`  Password: ${admin.password}`);
      console.log(`  Email: ${admin.email}`);
      console.log(
        `  Is Password Hashed: ${
          admin.password?.startsWith("$2b$") ? "✅ YES" : "❌ NO"
        }`
      );
      console.log(`  Password Length: ${admin.password?.length || 0}`);
      console.log("---");
    });

    console.log("\n=== RAW STAFF DOCUMENTS ===");
    const rawStaff = await db.collection("staffs").find({}).toArray();
    rawStaff.forEach((staff, index) => {
      console.log(`Staff ${index + 1}:`);
      console.log(`  Username: ${staff.username}`);
      console.log(`  Password: ${staff.password}`);
      console.log(`  Email: ${staff.email}`);
      console.log(
        `  Is Password Hashed: ${
          staff.password?.startsWith("$2b$") ? "✅ YES" : "❌ NO"
        }`
      );
      console.log(`  Password Length: ${staff.password?.length || 0}`);
      console.log("---");
    });

    console.log("\n=== RAW ACCOUNTANT DOCUMENTS ===");
    const rawAccountants = await db
      .collection("accountants")
      .find({})
      .toArray();
    rawAccountants.forEach((accountant, index) => {
      console.log(`Accountant ${index + 1}:`);
      console.log(`  Username: ${accountant.username}`);
      console.log(`  Password: ${accountant.password}`);
      console.log(`  Email: ${accountant.email}`);
      console.log(
        `  Is Password Hashed: ${
          accountant.password?.startsWith("$2b$") ? "✅ YES" : "❌ NO"
        }`
      );
      console.log(`  Password Length: ${accountant.password?.length || 0}`);
      console.log("---");
    });

    // Check if there are any validation errors or issues
    console.log("\n=== DATABASE CONNECTION INFO ===");
    console.log(`Connection State: ${mongoose.connection.readyState}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);
    console.log(`Database Name: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("Error verifying raw database:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
    process.exit(0);
  }
}

// Run the verification function
verifyRawDatabase();
