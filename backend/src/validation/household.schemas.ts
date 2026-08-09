import { z } from 'zod';
import { nonEmptyString } from './common';

export const createHouseholdSchema = z.object({
  name: nonEmptyString,
  address: z.string().optional(),
});

export const joinHouseholdSchema = z.object({
  invite_code: nonEmptyString,
});

export const updateHouseholdSchema = z.object({
  name: nonEmptyString.optional(),
  address: z.string().optional(),
});
