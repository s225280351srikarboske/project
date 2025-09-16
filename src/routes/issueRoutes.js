import { Router } from 'express';
import { createIssue, listIssues } from '../controllers/issueController.js';

const router = Router();

router.get('/', /* requireAuth, */ listIssues);
router.post('/', /* requireAuth, */ createIssue);

export default router;
