import express from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import Customer from '../models/Customer.js';

const router = express.Router();

// All customer routes require login
router.use(authRequired);

// Admin endpoints
// Create customer
router.post('/', requireRole('Admin'), async (req, res) => {
  try {
    const c = await Customer.create(req.body);
    res.status(201).json(c);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Email already exists' });
    res.status(400).json({ message: e.message });
  }
});

// Read all customers (hide deleted by default)
router.get('/', requireRole('Admin'), async (req, res) => {
  const includeDeleted = req.query.includeDeleted === 'true';
  const filter = includeDeleted ? {} : { isDeleted: false };
  const list = await Customer.find(filter).sort('-createdAt');
  res.json(list);
});

// Read one
router.get('/:id', requireRole('Admin'), async (req, res) => {
  const c = await Customer.findById(req.params.id);
  if (!c || c.isDeleted) return res.status(404).json({ message: 'Not found' });
  res.json(c);
});

// Update customer (details or dueAmount/paid)
router.put('/:id', requireRole('Admin'), async (req, res) => {
  try {
    const c = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ message: 'Not found' });
    res.json(c);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Soft delete
router.delete('/:id', requireRole('Admin'), async (req, res) => {
  const c = await Customer.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
  if (!c) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted', id: c._id });
});

// Set/Reset due (helper: sets amount and marks paid=false)
router.post('/:id/set-due', requireRole('Admin'), async (req, res) => {
  const { amount } = req.body;
  const c = await Customer.findByIdAndUpdate(
    req.params.id,
    { dueAmount: Number(amount) || 0, paid: false },
    { new: true }
  );
  if (!c) return res.status(404).json({ message: 'Not found' });
  res.json(c);
});

// Customer (Tenant) endpoints 

// Get customer record by email match
router.get('/me/record', requireRole('Tenant'), async (req, res) => {
  const c = await Customer.findOne({ email: req.user.email, isDeleted: false });
  if (!c) return res.status(404).json({ message: 'Record not found' });
  res.json(c);
});

// Mark rent as PAID (toggle to true)
router.post('/me/mark-paid', requireRole('Tenant'), async (req, res) => {
  const c = await Customer.findOneAndUpdate(
    { email: req.user.email, isDeleted: false },
    { paid: true },
    { new: true }
  );
  if (!c) return res.status(404).json({ message: 'Record not found' });
  res.json(c);
});

export default router;
