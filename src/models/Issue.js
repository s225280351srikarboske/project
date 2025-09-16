import mongoose from 'mongoose';

const IssueSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }, // optional
  category: { type: String, enum: ['ELECTRIC', 'PLUMBING', 'GAS', 'OTHER'], required: true },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  description: { type: String, required: true, trim: true },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
}, { timestamps: true });

export default mongoose.model('Issue', IssueSchema);
