import { Router } from 'express';
import { listMessages, postMessage } from '../controllers/chatController.js';
// If you already have auth middleware, you can import and use it here.
// import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:propertyId', listMessages);
router.post('/:propertyId', /* requireAuth, */ postMessage);

export default router;
