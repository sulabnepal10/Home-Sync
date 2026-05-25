import { Router } from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  settleSplit,
} from '../controllers/expenseController';
import { requireAuth } from '../middleware/requireAuth';

const router: Router = Router();

// All expense routes require authentication
router.use(requireAuth);

// GET /api/expenses - Get all expenses for household
router.get('/', getExpenses);

// POST /api/expenses - Create a new expense
router.post('/', createExpense);

// GET /api/expenses/:id - Get a single expense
router.get('/:id', getExpense);

// PUT /api/expenses/:id - Update an expense
router.put('/:id', updateExpense);

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', deleteExpense);

// POST /api/expenses/:expenseId/splits/:splitId/settle - Settle a split
router.post('/:expenseId/splits/:splitId/settle', settleSplit);

export default router;
