import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Register (Admin or Tenant)
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!['Admin', 'Tenant'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ name, email, passwordHash, role });
    res.status(201).json({ id: user._id, email: user.email, role: user.role, name: user.name });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Email exists' });
    res.status(400).json({ message: e.message });
  }
});

// Login -> JWT
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email });
  if (!u) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await u.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ sub: u._id.toString(), role: u.role, email: u.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, user: { id: u._id, email: u.email, role: u.role, name: u.name } });
});

export default router;
