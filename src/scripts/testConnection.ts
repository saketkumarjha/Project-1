import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    console.log("Testing MongoDB Atlas connection...");
    console.log(
      "Connection string:",
      process.env.MONGODB_URI?.replace(/:[^:@]*@/, ":****@")
    );

    // Set connection timeout
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      connectTimeoutMS: 10000,
    };

    await mongoose.connect(process.env.MONGODB_URI!, options);

    console.log("✅ Successfully connected to MongoDB Atlas!");
    console.log("Database name:", mongoose.connection.name);
    console.log("Connection state:", mongoose.connection.readyState);
    console.log("Host:", mongoose.connection.host);

    // Test basic operation
    const collections = await mongoose.connection
      .db!.listCollections()
      .toArray();
    console.log(
      "Available collections:",
      collections.map((c) => c.name)
    );
  } catch (error) {
    console.error("❌ Connection failed:");
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);
    }

    // Specific error handling
    if (error instanceof mongoose.Error) {
      console.error("Mongoose error details:", error);
    }
  } finally {
    await mongoose.connection.close();
    console.log("Connection closed");
    process.exit(0);
  }
}

testConnection();
