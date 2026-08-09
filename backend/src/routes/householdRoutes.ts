import { Router } from 'express';
import {
  getHousehold,
  createHousehold,
  joinHousehold,
  updateHousehold,
  leaveHousehold,
  removeMember,
} from '../controllers/householdController';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { joinHouseholdLimiter } from '../middleware/rateLimiter';
import { createHouseholdSchema, joinHouseholdSchema, updateHouseholdSchema } from '../validation/household.schemas';

const router: Router = Router();

// All household routes require authentication
router.use(requireAuth);

// GET /api/household - Get current user's household
router.get('/', getHousehold);

// POST /api/household - Create a new household
router.post('/', validateBody(createHouseholdSchema), createHousehold);

// POST /api/household/join - Join a household with invite code
router.post('/join', joinHouseholdLimiter, validateBody(joinHouseholdSchema), joinHousehold);

// POST /api/household/leave - Leave current household
router.post('/leave', leaveHousehold);

// PUT /api/household/:id - Update household settings
router.put('/:id', validateBody(updateHouseholdSchema), updateHousehold);

// DELETE /api/household/:householdId/members/:memberId - Remove a member
router.delete('/:householdId/members/:memberId', removeMember);

export default router;
