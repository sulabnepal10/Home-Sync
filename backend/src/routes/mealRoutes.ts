import { Router } from 'express';
import {
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal,
  joinMeal,
  leaveMeal,
} from '../controllers/mealController';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody, validateQuery } from '../middleware/validate';
import { createMealSchema, mealQuerySchema, updateMealSchema } from '../validation/meal.schemas';

const router: Router = Router();

// All meal routes require authentication
router.use(requireAuth);

// GET /api/meals - Get all meals for household
router.get('/', validateQuery(mealQuerySchema), getMeals);

// POST /api/meals - Create a new meal
router.post('/', validateBody(createMealSchema), createMeal);

// GET /api/meals/:id - Get a single meal
router.get('/:id', getMeal);

// PUT /api/meals/:id - Update a meal
router.put('/:id', validateBody(updateMealSchema), updateMeal);

// DELETE /api/meals/:id - Delete a meal
router.delete('/:id', deleteMeal);

// POST /api/meals/:id/join - Join a meal
router.post('/:id/join', joinMeal);

// POST /api/meals/:id/leave - Leave a meal
router.post('/:id/leave', leaveMeal);

export default router;
