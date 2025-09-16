// src/controllers/propertyController.js
import Property from '../models/Property.js';

/** GET /api/properties (list with optional filters) */
export const list = async (req, res) => {
  try {
    const { q, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { 'address.city': new RegExp(q, 'i') },
        { 'address.line1': new RegExp(q, 'i') },
      ];
    }
    const properties = await Property.find(filter).sort('-createdAt');
    res.json(properties);
  } catch (e) {
    res.status(500).json({ message: 'Failed to list properties' });
  }
};

/** GET /api/properties/:id */
export const getOne = async (req, res) => {
  try {
    const p = await Property.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (e) {
    res.status(400).json({ message: 'Failed to load property' });
  }
};

/** POST /api/properties */
export const create = async (req, res) => {
  try {
    const b = req.body;
    const p = await Property.create({
      title: b.title,
      address: {
        line1: b.address?.line1 || '',
        city: b.address?.city || '',
        state: b.address?.state || '',
        postcode: b.address?.postcode || '',
      },
      rent: Number(b.rent || 0),
      bedrooms: Number(b.bedrooms || 0),
      bathrooms: Number(b.bathrooms || 0),
      parking: !!b.parking,
      images: Array.isArray(b.images) ? b.images.filter(Boolean) : [],
      status: b.status || 'AVAILABLE',
      description: b.description || '',
    });
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to create property' });
  }
};

/** PUT /api/properties/:id */
export const update = async (req, res) => {
  try {
    const b = req.body;
    const p = await Property.findByIdAndUpdate(
      req.params.id,
      {
        title: b.title,
        address: {
          line1: b.address?.line1 || '',
          city: b.address?.city || '',
          state: b.address?.state || '',
          postcode: b.address?.postcode || '',
        },
        rent: Number(b.rent || 0),
        bedrooms: Number(b.bedrooms || 0),
        bathrooms: Number(b.bathrooms || 0),
        parking: !!b.parking,
        status: b.status || 'AVAILABLE',
        images: Array.isArray(b.images) ? b.images.filter(Boolean) : [],
        description: b.description || '',
      },
      { new: true }
    );
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to update property' });
  }
};

/** DELETE /api/properties/:id */
export const destroy = async (req, res) => {
  try {
    const out = await Property.findByIdAndDelete(req.params.id);
    if (!out) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to delete property' });
  }
};