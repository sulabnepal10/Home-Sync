import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getPublicProfile,
} from '../controllers/profileController';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema } from '../validation/profile.schemas';

const router: Router = Router();

// All profile routes require authentication
router.use(requireAuth);

// GET /api/profile - Get current user's profile
router.get('/', getProfile);

// PUT /api/profile - Update current user's profile
router.put('/', validateBody(updateProfileSchema), updateProfile);

// GET /api/profile/:id - Get a user's public profile
router.get('/:id', getPublicProfile);

export default router;
