import Issue from '../models/Issue.js';
import mongoose from 'mongoose';

// POST /api/issues
export const createIssue = async (req, res) => {
  try {
    const { property, category, severity, description } = req.body;
    if (!category || !description) {
      return res.status(400).json({ message: 'category and description are required' });
    }
    const payload = {
      category: String(category).toUpperCase(),
      description: String(description).trim(),
      severity: severity ? String(severity).toUpperCase() : 'LOW',
    };
    if (property && mongoose.isValidObjectId(property)) payload.property = property;

    const doc = await Issue.create(payload);
    res.status(201).json({ ok: true, data: doc });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to create issue' });
  }
};

// GET /api/issues?property=:id&status=OPEN
export const listIssues = async (req, res) => {
  try {
    const { property, status } = req.query;
    const filter = {};
    if (property && mongoose.isValidObjectId(property)) filter.property = property;
    if (status) filter.status = String(status).toUpperCase();
    const items = await Issue.find(filter).sort('-createdAt').lean();
    res.json({ ok: true, data: items });
  } catch (e) {
    res.status(500).json({ message: 'Failed to list issues' });
  }
};
export const updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = String(req.body.status || '').toUpperCase().trim();
    const map = { 'PENDING':'OPEN', 'IN PROCESS':'IN_PROGRESS', 'COMPLETED':'RESOLVED' };
    const status = map[raw] || raw;
    if (!['OPEN','IN_PROGRESS','RESOLVED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const doc = await Issue.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Issue not found' });
    res.json({ ok: true, data: doc });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to update status' });
  }
};
