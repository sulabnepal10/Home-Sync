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

const router: Router = Router();

// All meal routes require authentication
router.use(requireAuth);

// GET /api/meals - Get all meals for household
router.get('/', getMeals);

// POST /api/meals - Create a new meal
router.post('/', createMeal);

// GET /api/meals/:id - Get a single meal
router.get('/:id', getMeal);

// PUT /api/meals/:id - Update a meal
router.put('/:id', updateMeal);

// DELETE /api/meals/:id - Delete a meal
router.delete('/:id', deleteMeal);

// POST /api/meals/:id/join - Join a meal
router.post('/:id/join', joinMeal);

// POST /api/meals/:id/leave - Leave a meal
router.post('/:id/leave', leaveMeal);

export default router;
