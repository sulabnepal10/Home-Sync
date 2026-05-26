import { Router } from 'express';
import { getActivities } from '../controllers/activityController';
import { requireAuth } from '../middleware/requireAuth';

const router: Router = Router();

router.use(requireAuth);

router.get('/', getActivities);

export default router;