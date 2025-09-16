import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: String,
    company: String,
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    isDeleted: { type: Boolean, default: false }, 

    dueAmount: { type: Number, default: 0 },
    paid: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
