import mongoose from "mongoose";
import { MongoConfig } from "../src/types/dashboard";

export const mongoConfig: MongoConfig = {
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017/hospital_management",
  options: {
    // Simplified options for MVP
    retryWrites: true,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  },
};

export const connectToMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log("✅ MongoDB connected successfully");

    mongoose.connection.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("🔌 MongoDB disconnected");
    });

    // Basic process termination handler
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Simple health check
export const checkMongoHealth = async (): Promise<boolean> => {
  return mongoose.connection.readyState === 1;
};

// MVP monitored collections
export const MONITORED_COLLECTIONS = [
  "patients",
  "appointments",
  "rooms",
] as const;

export type MonitoredCollection = (typeof MONITORED_COLLECTIONS)[number];

// Simplified change stream options
export const CHANGE_STREAM_OPTIONS = {
  fullDocument: "updateLookup" as const,
};

// Basic change stream pipeline
export const getChangeStreamPipeline = (collection: MonitoredCollection) => {
  return [
    {
      $match: {
        operationType: { $in: ["insert", "update", "delete"] },
      },
    },
  ];
};