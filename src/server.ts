import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database";
import corsMiddleware from "./middleware/cors";
import { errorHandler, notFound } from "./middleware/errorHandler";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
//When extended is set to true, the middleware uses
//the qs library to support advanced parsing, such as
//handling nested data like user[name]=John&user[address][city]=NewYork,
//which would result in req.body = { user: { name: 'John', address: { city: 'NewYork' } } }.
//In contrast, extended: false limits parsing to flat key-value pairs or arrays using the querystring
//library, so nested structures might not be handled properly and could be treated as strings.
app.use(express.urlencoded({ extended: true }));

// Import routes
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import billingRoutes from "./routes/billing";
import reportsRoutes from "./routes/reports";
import patientRoutes from "./routes/patients";
import appointmentRoutes from "./routes/appointments";
import workflowRoutes from "./routes/workflows";
import roomRoutes from "./routes/rooms";

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/rooms", roomRoutes);

// Future routes will be added here
// app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
