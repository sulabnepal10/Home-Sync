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
import { validateBody, validateQuery } from '../middleware/validate';
import {
  choreAssignmentQuerySchema,
  choreQuerySchema,
  completeChoreAssignmentSchema,
  createChoreAssignmentSchema,
  createChoreSchema,
  updateChoreSchema,
} from '../validation/chore.schemas';

const router: Router = Router();

// All chore routes require authentication
router.use(requireAuth);

// ============ Chores ============

// GET /api/chores - Get all chores
router.get('/', validateQuery(choreQuerySchema), getChores);

// POST /api/chores - Create a new chore
router.post('/', validateBody(createChoreSchema), createChore);

// GET /api/chores/:id - Get a single chore
router.get('/:id', getChore);

// PUT /api/chores/:id - Update a chore
router.put('/:id', validateBody(updateChoreSchema), updateChore);

// DELETE /api/chores/:id - Delete a chore
router.delete('/:id', deleteChore);

// ============ Chore Assignments ============

// GET /api/chores/:choreId/assignments - Get assignments for a chore
router.get('/:choreId/assignments', getChoreAssignments);

export const choreAssignmentRouter: Router = Router();

choreAssignmentRouter.use(requireAuth);

// GET /api/chore-assignments - Get chore assignments
choreAssignmentRouter.get('/', validateQuery(choreAssignmentQuerySchema), getChoreAssignments);

// POST /api/chore-assignments - Create a chore assignment
choreAssignmentRouter.post('/', validateBody(createChoreAssignmentSchema), createChoreAssignment);

// POST /api/chore-assignments/:id/complete - Complete a chore assignment
choreAssignmentRouter.post('/:id/complete', validateBody(completeChoreAssignmentSchema), completeChoreAssignment);

// DELETE /api/chore-assignments/:id - Delete a chore assignment
choreAssignmentRouter.delete('/:id', deleteChoreAssignment);

export default router;
