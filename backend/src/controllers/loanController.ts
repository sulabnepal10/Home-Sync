import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

/**
 * Get all loans for the user's household
 * GET /api/loans
 */
export const getLoans = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { status, limit, offset } = req.query;
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

  // Build query
  let query = supabase
    .from('loans')
    .select('*, lender:profiles!lender_id(id, full_name, avatar_url), borrower:profiles!borrower_id(id, full_name, avatar_url)')
    .eq('household_id', membership.household_id);

  if (status === 'settled') {
    query = query.eq('is_settled', true);
  } else if (status === 'pending') {
    query = query.eq('is_settled', false);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(Number(offset) || 0, (Number(limit) || 50) + (Number(offset) || 0) - 1);

  const { data: loans, error } = await query;

  if (error) {
    throw ApiError.internal(`Failed to fetch loans: ${error.message}`);
  }

  res.json({ success: true, data: loans });
});

/**
 * Get a single loan by ID
 * GET /api/loans/:id
 */
export const getLoan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: loan, error } = await supabase
    .from('loans')
    .select('*, lender:profiles!lender_id(*), borrower:profiles!borrower_id(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw ApiError.internal(`Failed to fetch loan: ${error.message}`);
  }

  if (!loan) {
    throw ApiError.notFound('Loan not found');
  }

  // Verify access
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', loan.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  res.json({ success: true, data: loan });
});

/**
 * Create a new loan
 * POST /api/loans
 */
export const createLoan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { household_id, borrower_id, amount, description } = req.body;

  if (!household_id || !borrower_id || !amount || !description) {
    throw ApiError.badRequest('Household ID, borrower ID, amount, and description are required');
  }

  if (req.user.id === borrower_id) {
    throw ApiError.badRequest('Lender and borrower cannot be the same');
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

  // Verify borrower is also a member
  const { data: borrowerMembership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', borrower_id)
    .eq('household_id', household_id)
    .maybeSingle();

  if (!borrowerMembership) {
    throw ApiError.badRequest('Borrower is not a member of this household');
  }

  const { data: loan, error } = await supabase
    .from('loans')
    .insert({
      household_id,
      lender_id: req.user.id,
      borrower_id,
      amount: Number(amount),
      description,
      is_settled: false,
    })
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to create loan: ${error.message}`);
  }

  res.status(201).json({ success: true, data: loan });
});

/**
 * Update a loan
 * PUT /api/loans/:id
 */
export const updateLoan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const { amount, description } = req.body;

  const supabase = getSupabaseAdmin();

  const { data: loan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!loan) {
    throw ApiError.notFound('Loan not found');
  }

  // Only lender can update
  if (loan.lender_id !== req.user.id) {
    throw ApiError.forbidden('Only the lender can update this loan');
  }

  if (loan.is_settled) {
    throw ApiError.badRequest('Cannot update a settled loan');
  }

  const updateData: Record<string, unknown> = {};
  if (amount) updateData.amount = Number(amount);
  if (description) updateData.description = description;

  const { data: updated, error } = await supabase
    .from('loans')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to update loan: ${error.message}`);
  }

  res.json({ success: true, data: updated });
});

/**
 * Settle a loan
 * POST /api/loans/:id/settle
 */
export const settleLoan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: loan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!loan) {
    throw ApiError.notFound('Loan not found');
  }

  // Only lender can mark as settled
  if (loan.lender_id !== req.user.id) {
    throw ApiError.forbidden('Only the lender can settle this loan');
  }

  const { data: updated, error } = await supabase
    .from('loans')
    .update({
      is_settled: true,
      settled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to settle loan: ${error.message}`);
  }

  res.json({ success: true, data: updated });
});

/**
 * Delete a loan
 * DELETE /api/loans/:id
 */
export const deleteLoan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: loan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!loan) {
    throw ApiError.notFound('Loan not found');
  }

  // Only lender can delete
  if (loan.lender_id !== req.user.id) {
    throw ApiError.forbidden('Only the lender can delete this loan');
  }

  const { error } = await supabase.from('loans').delete().eq('id', id);

  if (error) {
    throw ApiError.internal(`Failed to delete loan: ${error.message}`);
  }

  res.json({ success: true, message: 'Loan deleted successfully' });
});

/**
 * Get loan balances for the household
 * GET /api/loans/balances
 */
export const getLoanBalances = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

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

  // Get all unresolved loans
  const { data: loans, error } = await supabase
    .from('loans')
    .select('*')
    .eq('household_id', membership.household_id)
    .eq('is_settled', false);

  if (error) {
    throw ApiError.internal(`Failed to fetch loans: ${error.message}`);
  }

  // Calculate balances
  const balances: Record<
    string,
    { owed: number; lent: number; net: number }
  > = {};

  (loans || []).forEach((loan) => {
    if (!balances[loan.borrower_id]) {
      balances[loan.borrower_id] = { owed: 0, lent: 0, net: 0 };
    }
    if (!balances[loan.lender_id]) {
      balances[loan.lender_id] = { owed: 0, lent: 0, net: 0 };
    }

    balances[loan.borrower_id].owed += Number(loan.amount);
    balances[loan.lender_id].lent += Number(loan.amount);
  });

  Object.keys(balances).forEach((userId) => {
    balances[userId].net = balances[userId].lent - balances[userId].owed;
  });

  res.json({ success: true, data: balances });
});

export default {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  settleLoan,
  deleteLoan,
  getLoanBalances,
};
