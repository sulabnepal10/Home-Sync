import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(1).optional(),
  avatar_url: z.string().trim().min(1).optional(),
  notification_preferences: z
    .object({
      expenses: z.boolean().optional(),
      chores: z.boolean().optional(),
      meals: z.boolean().optional(),
      inventory: z.boolean().optional(),
      push: z.boolean().optional(),
      email: z.boolean().optional(),
    })
    .optional(),
});
