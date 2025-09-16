import Message from '../models/Message.js';
import mongoose from 'mongoose';

// GET /api/chat/:propertyId?since=ISO
export const listMessages = async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({ message: 'Invalid property id' });
    }
    const since = req.query.since ? new Date(req.query.since) : null;
    const filter = { property: propertyId };
    if (since && !isNaN(since.getTime())) filter.createdAt = { $gt: since };

    const items = await Message.find(filter).sort('createdAt').lean();
    res.json({ ok: true, data: items });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load chat' });
  }
};

// POST /api/chat/:propertyId  { text }
// role resolution: prefer req.user?.role (if you already set auth middleware), else default 'Tenant'
export const postMessage = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'Text is required' });
    }
    const fromRole = (req.user && req.user.role) || 'Tenant';
    const msg = await Message.create({
      property: propertyId,
      fromRole,
      text: String(text).trim()
    });
    res.status(201).json({ ok: true, data: msg });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to send message' });
  }
};
