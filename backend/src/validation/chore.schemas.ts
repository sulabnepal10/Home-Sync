import { z } from 'zod';
import { nonEmptyString, paginationSchema, uuidSchema } from './common';

const frequencyEnum = z.enum(['daily', 'weekly', 'monthly']);

export const createChoreSchema = z.object({
  household_id: uuidSchema,
  name: nonEmptyString,
  description: z.string().optional(),
  frequency: frequencyEnum.optional(),
  points: z.coerce.number().int().nonnegative().optional(),
});

export const updateChoreSchema = z.object({
  name: nonEmptyString.optional(),
  description: z.string().optional(),
  frequency: frequencyEnum.optional(),
  points: z.coerce.number().int().nonnegative().optional(),
  is_active: z.coerce.boolean().optional(),
});

export const choreQuerySchema = paginationSchema.extend({
  is_active: z.enum(['true', 'false']).optional(),
});

export const choreAssignmentQuerySchema = z.object({
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  chore_id: uuidSchema.optional(),
});

export const createChoreAssignmentSchema = z.object({
  chore_id: uuidSchema,
  user_id: uuidSchema,
  assigned_date: z.string().date(),
});

export const completeChoreAssignmentSchema = z.object({
  notes: z.string().optional(),
});
