// src/controllers/addTenantController.js
import AddTenant from '../models/AddTenant.js';
import Property from '../models/Property.js';

export async function listAddTenants(req, res) {
  try {
    const tenants = await AddTenant.find().populate('property', 'title name address');
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tenants', error: err.message });
  }
}

export async function getAddTenant(req, res) {
  try {
    const tenant = await AddTenant.findById(req.params.id).populate('property', 'title name address');
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ message: 'Invalid tenant id', error: err.message });
  }
}

export async function createAddTenant(req, res) {
  try {
    const { name, email, phone, rent, status = 'paid', propertyId } = req.body;
    if (!name || !email || !phone || !propertyId || rent == null) {
      return res.status(400).json({ message: 'name, email, phone, rent, propertyId are required' });
    }
    const prop = await Property.findById(propertyId);
    if (!prop) return res.status(404).json({ message: 'Property not found' });

    const tenant = await AddTenant.create({ name, email, phone, rent, status, property: propertyId });
    const populated = await tenant.populate('property', 'title name address');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create tenant', error: err.message });
  }
}

export async function updateAddTenant(req, res) {
  try {
    const { name, email, phone, rent, status, propertyId } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (rent !== undefined) update.rent = rent;
    if (status !== undefined) update.status = status;
    if (propertyId !== undefined) {
      const prop = await Property.findById(propertyId);
      if (!prop) return res.status(404).json({ message: 'Property not found' });
      update.property = propertyId;
    }

    const tenant = await AddTenant.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('property', 'title name address');
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update tenant', error: err.message });
  }
}

export async function deleteAddTenant (req, res) {
  try {
    const tenant = await AddTenant.findByIdAndDelete(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete tenant', error: err.message });
  }
}
