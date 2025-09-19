// src/routes/propertyRoutes.js
import { Router } from 'express';
import { list, getOne, create, update, destroy, addImages } from '../controllers/propertyController.js';
import { upload } from '../middleware/upload.js';

// If you have real middlewares, import them:
// import { requireAuth, requireAdmin } from '../utils/auth.js';

// Temporary passthroughs to avoid 401/403 during setup. Replace later.
const requireAuth = (req, _res, next) => next();
const requireAdmin = (req, _res, next) => next();

const router = Router();

// JSON endpoints consumed by your static properties.html + properties.js
router.get('/', requireAuth, list);
router.get('/:id', requireAuth, getOne);
router.post('/', requireAuth, requireAdmin, create);
router.put('/:id', requireAuth, requireAdmin, update);
router.delete('/:id', requireAuth, requireAdmin, destroy);

// NEW: upload images to a property
// field name must be "images" in FormData
router.post('/:id/images', requireAuth, requireAdmin, upload.array('images', 10), addImages);

export default router;
