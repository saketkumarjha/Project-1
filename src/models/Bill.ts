import mongoose, { Document, Schema } from "mongoose";

// Bill item interface
export interface IBillItem {
  description: string;
  category:
    | "Consultation"
    | "Medicine"
    | "Surgery"
    | "Lab Test"
    | "Room Charges"
    | "Equipment"
    | "Other";
  quantity: number;
  unitPrice: number;
  total: number;
}

// Bill interface
export interface IBill extends Document {
  patientId: string;
  patientName: string;
  items: IBillItem[];
  subtotal: number;
  tax: number; // Tax amount (18% GST)
  discount: number;
  totalAmount: number;
  status: "pending" | "paid" | "partially_paid" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bill item schema
const BillItemSchema = new Schema({
  description: {
    type: String,
    required: [true, "Item description is required"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: [
      "Consultation",
      "Medicine",
      "Surgery",
      "Lab Test",
      "Room Charges",
      "Equipment",
      "Other",
    ],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [0, "Unit price cannot be negative"],
  },
  total: {
    type: Number,
    min: [0, "Total cannot be negative"],
    default: 0,
  },
});

// Bill schema
const BillSchema = new Schema(
  {
    patientId: {
      type: String,
      required: [true, "Patient ID is required"],
      trim: true,
    },
    patientName: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
    },
    items: {
      type: [BillItemSchema],
      required: [true, "At least one bill item is required"],
      validate: {
        validator: function (items: IBillItem[]) {
          return items && items.length > 0;
        },
        message: "Bill must have at least one item",
      },
    },
    subtotal: {
      type: Number,
      min: [0, "Subtotal cannot be negative"],
      default: 0,
    },
    tax: {
      type: Number,
      min: [0, "Tax amount cannot be negative"],
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    totalAmount: {
      type: Number,
      min: [0, "Total amount cannot be negative"],
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "partially_paid", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate totals
BillSchema.pre("save", function (next) {
  // Calculate item totals
  this.items.forEach((item: any) => {
    item.total = item.quantity * item.unitPrice;
  });

  // Calculate subtotal
  this.subtotal = this.items.reduce(
    (sum: number, item: any) => sum + item.total,
    0
  );

  // Calculate tax amount (18% GST)
  this.tax = (this.subtotal * 18) / 100;

  // Calculate total amount
  this.totalAmount = this.subtotal + this.tax - this.discount;

  next();
});

// Indexes for performance
BillSchema.index({ patientId: 1 });
BillSchema.index({ createdAt: -1 });

export default mongoose.model<IBill>("Bill", BillSchema);
