import express from "express";
import { authenticateUser, requireBillingAccess } from "../middleware/auth";
import Bill from "../models/Bill";

const router = express.Router();

// All billing routes require authentication and billing access
router.use(authenticateUser);
router.use(requireBillingAccess);

// Billing routes
// router.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "Billing dashboard access granted",
//     data: {
//       userType: req.userType,
//       user:
//         req.userType === "admin"
//           ? req.admin?.username
//           : req.accountant?.username,
//       permissions:
//         req.userType === "admin"
//           ? req.admin?.permissions
//           : req.accountant?.permissions,
//     },
//   });
// });

// router.get("/invoices", async (req, res) => {
//   try {
//     const bills = await Bill.find().sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       message: "Invoice access granted",
//       data: {
//         invoices: bills.map((bill) => ({
//           id: bill._id,
//           patientId: bill.patientId,
//           patientName: bill.patientName,
//           totalAmount: bill.totalAmount,
//           subtotal: bill.subtotal,
//           tax: bill.tax,
//           discount: bill.discount,
//           status: bill.status,
//           items: bill.items,
//           notes: bill.notes,
//           createdAt: bill.createdAt,
//         })),
//         count: bills.length,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching invoices",
//       error: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// });

// router.get("/payments", async (req, res) => {
//   try {
//     const bills = await Bill.find().sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       message: "Payment access granted",
//       data: {
//         payments: bills.map((bill) => ({
//           id: bill._id,
//           patientName: bill.patientName,
//           totalAmount: bill.totalAmount,
//           status: bill.status,
//           createdAt: bill.createdAt,
//         })),
//         count: bills.length,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching payments",
//       error: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// });

// Get bill by ID
// router.get("/invoices/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const bill = await Bill.findById(id);

//     if (!bill) {
//       res.status(404).json({
//         success: false,
//         message: "Bill not found",
//       });
//       return;
//     }

//     res.json({
//       success: true,
//       message: "Bill details retrieved successfully",
//       data: { bill },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching bill details",
//       error: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// });

// Create new bill
// router.post("/invoices", async (req, res) => {
//   try {
//     const billData = req.body;
//     const bill = new Bill(billData);
//     await bill.save();

//     res.status(201).json({
//       success: true,
//       message: "Bill created successfully",
//       data: { bill },
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: "Error creating bill",
//       error: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// });

// 1. Create Bill
router.post("/createBill", async (req, res) => {
  try {
    const billData = req.body;
    const bill = new Bill(billData);
    await bill.save();

    res.status(201).json({
      success: true,
      message: "Bill created successfully",
      data: { bill },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating bill",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 2. Update Bill
router.put("/updateBill/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const bill = await Bill.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!bill) {
      res.status(404).json({
        success: false,
        message: "Bill not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Bill updated successfully",
      data: { bill },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating bill",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 3. Get All Bills with search and filters
router.get("/getAllBill", async (req, res) => {
  try {
    const {
      search,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query object
    const query: any = {};

    // Search by patient name or patient ID
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by date range
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate as string);
      }
      if (toDate) {
        const endDate = new Date(toDate as string);
        endDate.setHours(23, 59, 59, 999); // End of day
        query.createdAt.$lte = endDate;
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get bills with pagination
    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalBills = await Bill.countDocuments(query);
    const totalPages = Math.ceil(totalBills / limitNum);

    res.json({
      success: true,
      message: "Bills retrieved successfully",
      data: {
        bills,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalBills,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bills",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get bill by ID
router.get("/getBill/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id);

    if (!bill) {
      res.status(404).json({
        success: false,
        message: "Bill not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Bill details retrieved successfully",
      data: { bill },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bill details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Delete bill (soft delete by updating status to cancelled)
router.delete("/deleteBill/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    if (!bill) {
      res.status(404).json({
        success: false,
        message: "Bill not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Bill cancelled successfully",
      data: { bill },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling bill",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get bills by status
router.get("/getByStatus/:status", async (req, res) => {
  try {
    const { status } = req.params;
    const bills = await Bill.find({ status }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: `Bills with status '${status}' retrieved successfully`,
      data: {
        bills,
        count: bills.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bills by status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get bills by patient ID
router.get("/getByPatient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const bills = await Bill.find({ patientId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Patient bills retrieved successfully",
      data: {
        bills,
        count: bills.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patient bills",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
