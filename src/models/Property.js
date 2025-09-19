// src/models/Property.js
import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema(
  {
    line1: String,
    city: String,
    state: String,
    postcode: String,
  },
  { _id: false }
);

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    address: AddressSchema,
    rent: { type: Number, required: true },
    images: [String],
    status: { type: String, enum: ['AVAILABLE', 'OCCUPIED'], default: 'AVAILABLE' },
    description: String,
  },
  { timestamps: true }
);

const Property = mongoose.model('Property', PropertySchema);
export default Property;