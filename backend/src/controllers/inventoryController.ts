import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { logActivity } from '../services/activityService';

/**
 * Get all inventory items for the user's household
 * GET /api/inventory
 */
export const getInventory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { category, low_stock, limit, offset } = req.query;
  const supabase = getSupabaseAdmin();

  // Get user's household
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.notFound('User is not in a household');
  }

  let query = supabase
    .from('inventory_items')
    .select('*')
    .eq('household_id', membership.household_id);

  if (category) {
    query = query.eq('category', category);
  }

  query = query
    .order('name', { ascending: true })
    .range(Number(offset) || 0, (Number(limit) || 100) + (Number(offset) || 0) - 1);

  const { data: items, error } = await query;

  if (error) {
    throw ApiError.internal(`Failed to fetch inventory: ${error.message}`);
  }

  // Filter by low_stock if requested
  let filteredItems = items;
  if (low_stock === 'true') {
    filteredItems = items.filter((item) => item.quantity <= item.min_quantity);
  }

  res.json({ success: true, data: filteredItems });
});

/**
 * Get a single inventory item by ID
 * GET /api/inventory/:id
 */
export const getInventoryItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: item, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw ApiError.internal(`Failed to fetch item: ${error.message}`);
  }

  if (!item) {
    throw ApiError.notFound('Item not found');
  }

  // Verify access
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', item.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  res.json({ success: true, data: item });
});

/**
 * Create a new inventory item
 * POST /api/inventory
 */
export const createInventoryItem = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const {
      household_id,
      name,
      category,
      quantity,
      unit,
      min_quantity,
    } = req.body;

    if (!household_id || !name || quantity === undefined) {
      throw ApiError.badRequest('Household ID, name, and quantity are required');
    }

    const supabase = getSupabaseAdmin();

    // Verify user is a member
    const { data: membership } = await supabase
      .from('household_members')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('household_id', household_id)
      .maybeSingle();

    if (!membership) {
      throw ApiError.forbidden('Access denied to this household');
    }

    const { data: item, error } = await supabase
      .from('inventory_items')
      .insert({
        household_id,
        name,
        category: category || 'groceries',
        quantity: Number(quantity),
        unit: unit || 'units',
        min_quantity: Number(min_quantity) || 1,
        last_purchased: new Date().toISOString(),
        purchased_by: req.user.id,
      })
      .select()
      .single();

    if (error) {
      throw ApiError.internal(`Failed to create item: ${error.message}`);
    }

    await logActivity(supabase, {
      householdId: household_id,
      userId: req.user.id,
      actionType: 'inventory_created',
      description: `Added "${name}" to inventory`,
    });

    res.status(201).json({ success: true, data: item });
  }
);

/**
 * Update an inventory item
 * PUT /api/inventory/:id
 */
export const updateInventoryItem = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const { name, category, quantity, unit, min_quantity } = req.body;

    const supabase = getSupabaseAdmin();

    const { data: item } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!item) {
      throw ApiError.notFound('Item not found');
    }

    // Check household membership
    const { data: membership } = await supabase
      .from('household_members')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('household_id', item.household_id)
      .maybeSingle();

    if (!membership) {
      throw ApiError.forbidden('Access denied');
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (unit) updateData.unit = unit;
    if (min_quantity !== undefined) updateData.min_quantity = Number(min_quantity);

    const { data: updated, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw ApiError.internal(`Failed to update item: ${error.message}`);
    }

    await logActivity(supabase, {
      householdId: item.household_id,
      userId: req.user.id,
      actionType: 'inventory_updated',
      description: `Updated "${updated.name}"`,
    });

    res.json({ success: true, data: updated });
  }
);

/**
 * Delete an inventory item
 * DELETE /api/inventory/:id
 */
export const deleteInventoryItem = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data: item } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!item) {
      throw ApiError.notFound('Item not found');
    }

    // Check household membership
    const { data: membership } = await supabase
      .from('household_members')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('household_id', item.household_id)
      .maybeSingle();

    if (!membership) {
      throw ApiError.forbidden('Access denied');
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw ApiError.internal(`Failed to delete item: ${error.message}`);
    }

    await logActivity(supabase, {
      householdId: item.household_id,
      userId: req.user.id,
      actionType: 'inventory_deleted',
      description: `Removed "${item.name}" from inventory`,
    });

    res.json({ success: true, message: 'Item deleted successfully' });
  }
);

/**
 * Restock an item (update quantity and purchase info)
 * POST /api/inventory/:id/restock
 */
export const restockItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined) {
    throw ApiError.badRequest('Quantity is required');
  }

  const supabase = getSupabaseAdmin();

  const { data: item } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!item) {
    throw ApiError.notFound('Item not found');
  }

  // Check household membership
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', item.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  const newQuantity = item.quantity + Number(quantity);

  const { data: updated, error } = await supabase
    .from('inventory_items')
    .update({
      quantity: newQuantity,
      last_purchased: new Date().toISOString(),
      purchased_by: req.user.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to restock item: ${error.message}`);
  }

  const delta = Number(quantity);
  await logActivity(supabase, {
    householdId: item.household_id,
    userId: req.user.id,
    actionType: delta >= 0 ? 'inventory_restocked' : 'inventory_decremented',
    description:
      delta >= 0
        ? `Restocked "${item.name}" (+${delta} ${item.unit})`
        : `Used ${Math.abs(delta)} ${item.unit} of "${item.name}"`,
  });

  res.json({ success: true, data: updated });
});

export default {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockItem,
};
