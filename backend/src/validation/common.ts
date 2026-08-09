import { z } from 'zod';

export const uuidSchema = z.string().uuid('Must be a valid UUID');

export const nonEmptyString = z.string().trim().min(1, 'Must not be empty');

export const positiveAmount = z.coerce
  .number({ error: 'Amount must be a number' })
  .positive('Amount must be greater than zero')
  .finite('Amount must be finite');

// Query-string pagination: values arrive as strings and are optional, so we
// coerce and clamp rather than reject a missing/blank value outright.
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
