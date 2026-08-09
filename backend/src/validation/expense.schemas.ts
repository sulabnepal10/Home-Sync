import { z } from 'zod';
import { nonEmptyString, paginationSchema, uuidSchema } from './common';

const splitSchema = z.object({
  user_id: uuidSchema,
  amount: z.coerce.number().nonnegative('Split amount cannot be negative').finite(),
});

export const createExpenseSchema = z.object({
  household_id: uuidSchema,
  amount: z.coerce.number().positive('Amount must be greater than zero').finite(),
  description: nonEmptyString,
  category: z.string().trim().min(1).optional(),
  split_type: z.enum(['equal', 'custom', 'percentage']).optional(),
  splits: z.array(splitSchema).optional(),
  // Only required/checked for split_type: 'percentage' — maps user_id -> percentage (0-100).
  split_config: z.record(uuidSchema, z.coerce.number().nonnegative()).optional(),
});

export const updateExpenseSchema = z.object({
  amount: z.coerce.number().positive().finite().optional(),
  description: nonEmptyString.optional(),
  category: z.string().trim().min(1).optional(),
});

export const expenseQuerySchema = paginationSchema.extend({
  category: z.string().trim().min(1).optional(),
});
