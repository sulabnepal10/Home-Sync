import { z } from 'zod';
import { nonEmptyString, paginationSchema, positiveAmount, uuidSchema } from './common';

export const createLoanSchema = z.object({
  household_id: uuidSchema,
  borrower_id: uuidSchema,
  amount: positiveAmount,
  description: nonEmptyString,
});

export const updateLoanSchema = z.object({
  amount: positiveAmount.optional(),
  description: nonEmptyString.optional(),
});

export const loanQuerySchema = paginationSchema.extend({
  status: z.enum(['settled', 'pending']).optional(),
});
