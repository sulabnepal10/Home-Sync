import { z } from 'zod';
import { nonEmptyString, paginationSchema, uuidSchema } from './common';

export const createMealSchema = z.object({
  household_id: uuidSchema,
  date: z.string().date(),
  meal_name: nonEmptyString,
  notes: z.string().optional(),
  attendees: z.array(uuidSchema).optional(),
});

export const updateMealSchema = z.object({
  meal_name: nonEmptyString.optional(),
  notes: z.string().optional(),
  date: z.string().date().optional(),
  attendees: z.array(uuidSchema).optional(),
});

export const mealQuerySchema = paginationSchema.extend({
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
});
