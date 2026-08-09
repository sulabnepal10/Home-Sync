import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { generateDueRecurringBills } from '../services/recurringBillService';
import { logActivity } from '../services/activityService';

/**
 * Get all recurring bills for the user's household. Expands any bills that
 * came due first, so the list (and the expenses it generates) always
 * reflects "now" without a separate background job.
 * GET /api/recurring-bills
 */
export const getRecurringBills = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const supabase = getSupabaseAdmin();

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.notFound('User is not in a household');
  }

  await generateDueRecurringBills(supabase, membership.household_id);

  const { data: bills, error } = await supabase
    .from('recurring_bills')
    .select('*, payer:profiles!payer_id(id, full_name, avatar_url)')
    .eq('household_id', membership.household_id)
    .order('next_due_date', { ascending: true });

  if (error) {
    throw ApiError.internal(`Failed to fetch recurring bills: ${error.message}`);
  }

  res.json({ success: true, data: bills });
});

/**
 * Create a recurring bill.
 * POST /api/recurring-bills
 */
export const createRecurringBill = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { household_id, description, amount, category, split_type, split_config, frequency, day_of_month, next_due_date } =
    req.body;

  const supabase = getSupabaseAdmin();

  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied to this household');
  }

  const { data: bill, error } = await supabase
    .from('recurring_bills')
    .insert({
      household_id,
      payer_id: req.user.id,
      description,
      amount,
      category: category || 'other',
      split_type: split_type || 'equal',
      split_config: split_config || null,
      frequency: frequency || 'monthly',
      day_of_month: day_of_month || null,
      next_due_date,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to create recurring bill: ${error.message}`);
  }

  await logActivity(supabase, {
    householdId: household_id,
    userId: req.user.id,
    actionType: 'recurring_bill_created',
    description: `Set up recurring bill "${description}" ($${Number(amount).toFixed(2)}/${frequency || 'monthly'})`,
  });

  res.status(201).json({ success: true, data: bill });
});

/**
 * Update a recurring bill (payer or household admin only). Also used to
 * pause/resume via is_active.
 * PUT /api/recurring-bills/:id
 */
export const updateRecurringBill = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: bill } = await supabase.from('recurring_bills').select('*').eq('id', id).maybeSingle();

  if (!bill) {
    throw ApiError.notFound('Recurring bill not found');
  }

  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', bill.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  if (bill.payer_id !== req.user.id && membership.role !== 'admin') {
    throw ApiError.forbidden('Only the payer or an admin can update this recurring bill');
  }

  const {
    description,
    amount,
    category,
    split_type,
    split_config,
    frequency,
    day_of_month,
    next_due_date,
    is_active,
  } = req.body;

  const updateData: Record<string, unknown> = {};
  if (description !== undefined) updateData.description = description;
  if (amount !== undefined) updateData.amount = amount;
  if (category !== undefined) updateData.category = category;
  if (split_type !== undefined) updateData.split_type = split_type;
  if (split_config !== undefined) updateData.split_config = split_config;
  if (frequency !== undefined) updateData.frequency = frequency;
  if (day_of_month !== undefined) updateData.day_of_month = day_of_month;
  if (next_due_date !== undefined) updateData.next_due_date = next_due_date;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data: updated, error } = await supabase
    .from('recurring_bills')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to update recurring bill: ${error.message}`);
  }

  await logActivity(supabase, {
    householdId: bill.household_id,
    userId: req.user.id,
    actionType: 'recurring_bill_updated',
    description:
      is_active === false
        ? `Paused recurring bill "${bill.description}"`
        : is_active === true
          ? `Resumed recurring bill "${bill.description}"`
          : `Updated recurring bill "${updated.description}"`,
  });

  res.json({ success: true, data: updated });
});

/**
 * Delete a recurring bill (payer or household admin only).
 * DELETE /api/recurring-bills/:id
 */
export const deleteRecurringBill = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: bill } = await supabase.from('recurring_bills').select('*').eq('id', id).maybeSingle();

  if (!bill) {
    throw ApiError.notFound('Recurring bill not found');
  }

  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', bill.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  if (bill.payer_id !== req.user.id && membership.role !== 'admin') {
    throw ApiError.forbidden('Only the payer or an admin can delete this recurring bill');
  }

  const { error } = await supabase.from('recurring_bills').delete().eq('id', id);

  if (error) {
    throw ApiError.internal(`Failed to delete recurring bill: ${error.message}`);
  }

  await logActivity(supabase, {
    householdId: bill.household_id,
    userId: req.user.id,
    actionType: 'recurring_bill_deleted',
    description: `Removed recurring bill "${bill.description}"`,
  });

  res.json({ success: true, message: 'Recurring bill deleted successfully' });
});

export default {
  getRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
};
