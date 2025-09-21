import { Router } from 'express';
import { createIssue, listIssues, updateIssueStatus } from '../controllers/issueController.js';

const router = Router();

router.get('/', /* requireAuth, */ listIssues);
router.post('/', /* requireAuth, */ createIssue);
router.put('/:id/status', /* requireAuth, */ updateIssueStatus); // <-- this line must exist

export default router;
