import { z } from 'zod';
import { nonEmptyString, paginationSchema, uuidSchema } from './common';

const categoryEnum = z.enum(['groceries', 'supplies', 'appliances']);

export const createInventoryItemSchema = z.object({
  household_id: uuidSchema,
  name: nonEmptyString,
  category: categoryEnum.optional(),
  quantity: z.coerce.number().int().nonnegative(),
  unit: z.string().trim().min(1).optional(),
  min_quantity: z.coerce.number().int().nonnegative().optional(),
});

export const updateInventoryItemSchema = z.object({
  name: nonEmptyString.optional(),
  category: categoryEnum.optional(),
  quantity: z.coerce.number().int().nonnegative().optional(),
  unit: z.string().trim().min(1).optional(),
  min_quantity: z.coerce.number().int().nonnegative().optional(),
});

export const restockItemSchema = z.object({
  quantity: z.coerce.number().int().refine((n) => n !== 0, 'Quantity must not be zero'),
});

export const inventoryQuerySchema = paginationSchema.extend({
  category: categoryEnum.optional(),
  low_stock: z.enum(['true', 'false']).optional(),
});
