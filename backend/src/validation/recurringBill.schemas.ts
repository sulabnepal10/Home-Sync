import { z } from 'zod';
import { nonEmptyString, positiveAmount, uuidSchema } from './common';

const splitTypeEnum = z.enum(['equal', 'custom', 'percentage']);
const frequencyEnum = z.enum(['weekly', 'monthly']);

export const createRecurringBillSchema = z.object({
  household_id: uuidSchema,
  description: nonEmptyString,
  amount: positiveAmount,
  category: z.string().trim().min(1).optional(),
  split_type: splitTypeEnum.optional(),
  split_config: z.record(uuidSchema, z.coerce.number().nonnegative()).optional(),
  frequency: frequencyEnum.optional(),
  day_of_month: z.coerce.number().int().min(1).max(28).optional(),
  next_due_date: z.string().date(),
});

export const updateRecurringBillSchema = z.object({
  description: nonEmptyString.optional(),
  amount: positiveAmount.optional(),
  category: z.string().trim().min(1).optional(),
  split_type: splitTypeEnum.optional(),
  split_config: z.record(uuidSchema, z.coerce.number().nonnegative()).optional(),
  frequency: frequencyEnum.optional(),
  day_of_month: z.coerce.number().int().min(1).max(28).optional(),
  next_due_date: z.string().date().optional(),
  is_active: z.coerce.boolean().optional(),
});
