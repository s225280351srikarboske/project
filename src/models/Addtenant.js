// src/models/AddTenant.js
import mongoose from 'mongoose';

const AddTenantSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    email:  {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email']
    },
    phone:  { type: String, required: true, trim: true },
    rent:   { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['paid', 'overdue'], default: 'paid' },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  },
  { timestamps: true }
);

AddTenantSchema.index({ email: 1 });
AddTenantSchema.index({ property: 1 });

export default mongoose.model('AddTenant', AddTenantSchema);
