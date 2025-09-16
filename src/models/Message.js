import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  fromRole: { type: String, enum: ['Tenant', 'Admin'], required: true },
  text: { type: String, required: true, trim: true },
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);
