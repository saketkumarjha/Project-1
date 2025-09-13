import { Request, Response } from "express";
import Accountant from "../models/Accountant";

// Get accountant by ID
export const getAccountantById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const accountant = await Accountant.findById(id).select("-password");
    if (!accountant) {
      res.status(404).json({
        success: false,
        message: "Accountant not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { accountant },
    });
  } catch (error) {
    console.error("Get accountant by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create new accountant
export const createAccountant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      username,
      password,
      email,
      employeeId,
      name,
      contact,
      profileImage,
      permissions,
    } = req.body;

    // Validation
    if (!username || !password || !email || !employeeId || !name || !contact) {
      res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
      return;
    }

    // Check if accountant already exists
    const existingAccountant = await Accountant.findOne({
      $or: [{ username }, { email }, { employeeId }],
    });

    if (existingAccountant) {
      res.status(400).json({
        success: false,
        message:
          "Accountant with this username, email, or employee ID already exists",
      });
      return;
    }

    // Create new accountant
    const newAccountant = new Accountant({
      username,
      password,
      email,
      employeeId,
      name,
      contact,
      profileImage,
      permissions: permissions || {},
    });

    await newAccountant.save();

    res.status(201).json({
      success: true,
      message: "Accountant created successfully",
      data: {
        accountant: {
          id: (newAccountant._id as any).toString(),
          username: newAccountant.username,
          email: newAccountant.email,
          employeeId: newAccountant.employeeId,
          name: newAccountant.name,
          contact: newAccountant.contact,
          profileImage: newAccountant.profileImage,
          permissions: newAccountant.permissions,
          isActive: newAccountant.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Create accountant error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update accountant
export const updateAccountant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      employeeId,
      name,
      contact,
      profileImage,
      permissions,
      isActive,
    } = req.body;

    const accountant = await Accountant.findById(id);
    if (!accountant) {
      res.status(404).json({
        success: false,
        message: "Accountant not found",
      });
      return;
    }

    // Check if username, email, or employeeId already exists (excluding current accountant)
    if (username || email || employeeId) {
      const existingAccountant = await Accountant.findOne({
        _id: { $ne: id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
          ...(employeeId ? [{ employeeId }] : []),
        ],
      });

      if (existingAccountant) {
        res.status(400).json({
          success: false,
          message:
            "Accountant with this username, email, or employee ID already exists",
        });
        return;
      }
    }

    // Update fields
    if (username) accountant.username = username;
    if (email) accountant.email = email;
    if (employeeId) accountant.employeeId = employeeId;
    if (name) accountant.name = name;
    if (contact) accountant.contact = contact;
    if (profileImage !== undefined) accountant.profileImage = profileImage;
    if (permissions)
      accountant.permissions = { ...accountant.permissions, ...permissions };
    if (isActive !== undefined) accountant.isActive = isActive;

    await accountant.save();

    res.status(200).json({
      success: true,
      message: "Accountant updated successfully",
      data: {
        accountant: {
          id: (accountant._id as any).toString(),
          username: accountant.username,
          email: accountant.email,
          employeeId: accountant.employeeId,
          name: accountant.name,
          contact: accountant.contact,
          profileImage: accountant.profileImage,
          permissions: accountant.permissions,
          isActive: accountant.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Update accountant error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete accountant
export const deleteAccountant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const accountant = await Accountant.findById(id);
    if (!accountant) {
      res.status(404).json({
        success: false,
        message: "Accountant not found",
      });
      return;
    }

    await Accountant.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Accountant deleted successfully",
    });
  } catch (error) {
    console.error("Delete accountant error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
