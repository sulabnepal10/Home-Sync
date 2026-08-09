import { Router } from 'express';
import {
  getRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
} from '../controllers/recurringBillController';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { createRecurringBillSchema, updateRecurringBillSchema } from '../validation/recurringBill.schemas';

const router: Router = Router();

router.use(requireAuth);

// GET /api/recurring-bills - List (and lazily generate any due) recurring bills
router.get('/', getRecurringBills);

// POST /api/recurring-bills - Create a recurring bill
router.post('/', validateBody(createRecurringBillSchema), createRecurringBill);

// PUT /api/recurring-bills/:id - Update (or pause/resume via is_active)
router.put('/:id', validateBody(updateRecurringBillSchema), updateRecurringBill);

// DELETE /api/recurring-bills/:id - Delete a recurring bill
router.delete('/:id', deleteRecurringBill);

export default router;
