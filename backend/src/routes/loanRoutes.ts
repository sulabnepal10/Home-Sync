import { Router } from 'express';
import {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  settleLoan,
  deleteLoan,
  getLoanBalances,
} from '../controllers/loanController';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody, validateQuery } from '../middleware/validate';
import { createLoanSchema, loanQuerySchema, updateLoanSchema } from '../validation/loan.schemas';

const router: Router = Router();

// All loan routes require authentication
router.use(requireAuth);

// GET /api/loans/balances - Get loan balances for household
router.get('/balances', getLoanBalances);

// GET /api/loans - Get all loans for household
router.get('/', validateQuery(loanQuerySchema), getLoans);

// POST /api/loans - Create a new loan
router.post('/', validateBody(createLoanSchema), createLoan);

// GET /api/loans/:id - Get a single loan
router.get('/:id', getLoan);

// PUT /api/loans/:id - Update a loan
router.put('/:id', validateBody(updateLoanSchema), updateLoan);

// POST /api/loans/:id/settle - Settle a loan
router.post('/:id/settle', settleLoan);

// DELETE /api/loans/:id - Delete a loan
router.delete('/:id', deleteLoan);

export default router;
