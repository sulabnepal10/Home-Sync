import { Router } from 'express';
import {
  getChores,
  getChore,
  createChore,
  updateChore,
  deleteChore,
  getChoreAssignments,
  createChoreAssignment,
  completeChoreAssignment,
  deleteChoreAssignment,
} from '../controllers/choreController';
import { requireAuth } from '../middleware/requireAuth';

const router: Router = Router();

// All chore routes require authentication
router.use(requireAuth);

// ============ Chores ============

// GET /api/chores - Get all chores
router.get('/', getChores);

// POST /api/chores - Create a new chore
router.post('/', createChore);

// GET /api/chores/:id - Get a single chore
router.get('/:id', getChore);

// PUT /api/chores/:id - Update a chore
router.put('/:id', updateChore);

// DELETE /api/chores/:id - Delete a chore
router.delete('/:id', deleteChore);

// ============ Chore Assignments ============

// GET /api/chores/:choreId/assignments - Get assignments for a chore
router.get('/:choreId/assignments', getChoreAssignments);

// Or use a separate path for assignments
// GET /api/chore-assignments - Get all chore assignments
// router.get('/assignments', getChoreAssignments);

export const choreAssignmentRouter: Router = Router();

choreAssignmentRouter.use(requireAuth);

// GET /api/chore-assignments - Get chore assignments
choreAssignmentRouter.get('/', getChoreAssignments);

// POST /api/chore-assignments - Create a chore assignment
choreAssignmentRouter.post('/', createChoreAssignment);

// POST /api/chore-assignments/:id/complete - Complete a chore assignment
choreAssignmentRouter.post('/:id/complete', completeChoreAssignment);

// DELETE /api/chore-assignments/:id - Delete a chore assignment
choreAssignmentRouter.delete('/:id', deleteChoreAssignment);

export default router;
