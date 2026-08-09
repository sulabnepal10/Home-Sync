import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

/**
 * Get all expenses for the user's household
 * GET /api/expenses
 */
export const getExpenses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { category, limit, offset } = req.query;

  const supabase = getSupabaseAdmin();

  // Get user's household membership
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.notFound('User is not in a household');
  }

  // Always scope to the caller's own household — never trust a client-supplied
  // household_id, or any authenticated user could read another household's expenses.
  let query = supabase
    .from('expenses')
    .select('*, payer:profiles!payer_id(id, full_name, avatar_url), splits:expense_splits(*, profile:profiles(id, full_name, avatar_url))')
    .eq('household_id', membership.household_id);

  if (category) {
    query = query.eq('category', category);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(Number(offset) || 0, (Number(limit) || 20) + (Number(offset) || 0) - 1);

  const { data: expenses, error } = await query;

  if (error) {
    throw ApiError.internal(`Failed to fetch expenses: ${error.message}`);
  }

  res.json({ success: true, data: expenses });
});

/**
 * Get a single expense by ID
 * GET /api/expenses/:id
 */
export const getExpense = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: expense, error } = await supabase
    .from('expenses')
    .select('*, payer:profiles!payer_id(*), splits:expense_splits(*, profile:profiles(*))')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw ApiError.internal(`Failed to fetch expense: ${error.message}`);
  }

  if (!expense) {
    throw ApiError.notFound('Expense not found');
  }

  // Verify user has access to this expense's household
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', expense.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied to this expense');
  }

  res.json({ success: true, data: expense });
});

/**
 * Create a new expense
 * POST /api/expenses
 */
export const createExpense = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { household_id, amount, description, category, split_type, splits } = req.body;

  if (!household_id || !amount || !description) {
    throw ApiError.badRequest('Household ID, amount, and description are required');
  }

  const supabase = getSupabaseAdmin();

  // Verify user is a member of the household
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied to this household');
  }

  // Create the expense
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      household_id,
      payer_id: req.user.id,
      amount: Number(amount),
      description,
      category: category || 'other',
      split_type: split_type || 'equal',
    })
    .select()
    .single();

  if (expenseError) {
    throw ApiError.internal(`Failed to create expense: ${expenseError.message}`);
  }

  // Create splits if provided
  if (splits && splits.length > 0 && expense) {
    const splitsData = splits.map((split: { user_id: string; amount: number }) => ({
      expense_id: expense.id,
      user_id: split.user_id,
      amount: Number(split.amount),
    }));

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splitsData);

    if (splitsError) {
      throw ApiError.internal(`Failed to create expense splits: ${splitsError.message}`);
    }
  }

  res.status(201).json({ success: true, data: expense });
});

/**
 * Update an expense
 * PUT /api/expenses/:id
 */
export const updateExpense = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const { amount, description, category } = req.body;

  const supabase = getSupabaseAdmin();

  // Get the expense
  const { data: expense } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!expense) {
    throw ApiError.notFound('Expense not found');
  }

  // Only payer can update
  if (expense.payer_id !== req.user.id) {
    throw ApiError.forbidden('Only the payer can update this expense');
  }

  const updateData: Record<string, unknown> = {};
  if (amount) updateData.amount = Number(amount);
  if (description) updateData.description = description;
  if (category) updateData.category = category;

  const { data: updated, error } = await supabase
    .from('expenses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to update expense: ${error.message}`);
  }

  res.json({ success: true, data: updated });
});

/**
 * Delete an expense
 * DELETE /api/expenses/:id
 */
export const deleteExpense = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  // Get the expense
  const { data: expense } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!expense) {
    throw ApiError.notFound('Expense not found');
  }

  // Only payer or admin can delete
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', expense.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  if (expense.payer_id !== req.user.id && membership.role !== 'admin') {
    throw ApiError.forbidden('Only payer or admin can delete this expense');
  }

  const { error } = await supabase.from('expenses').delete().eq('id', id);

  if (error) {
    throw ApiError.internal(`Failed to delete expense: ${error.message}`);
  }

  res.json({ success: true, message: 'Expense deleted successfully' });
});

/**
 * Settle an expense split
 * POST /api/expenses/:expenseId/splits/:splitId/settle
 */
export const settleSplit = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { splitId } = req.params;
  const supabase = getSupabaseAdmin();

  // Get the split
  const { data: split } = await supabase
    .from('expense_splits')
    .select('*, expense:expenses(household_id)')
    .eq('id', splitId)
    .maybeSingle();

  if (!split) {
    throw ApiError.notFound('Split not found');
  }

  // Only the user who owes can settle their split
  if (split.user_id !== req.user.id) {
    throw ApiError.forbidden('Only the debtor can settle this split');
  }

  const { data: updated, error } = await supabase
    .from('expense_splits')
    .update({
      is_settled: true,
      settled_at: new Date().toISOString(),
    })
    .eq('id', splitId)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to settle split: ${error.message}`);
  }

  res.json({ success: true, data: updated });
});

export default {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  settleSplit,
};
