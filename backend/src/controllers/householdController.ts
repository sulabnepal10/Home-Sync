import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

/**
 * Get the current user's household
 * GET /api/household
 */
export const getHousehold = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const supabase = getSupabaseAdmin();

  // Get the household membership
  const { data: membership, error: membershipError } = await supabase
    .from('household_members')
    .select('*, household:households(*)')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (membershipError) {
    throw ApiError.internal(`Failed to fetch household: ${membershipError.message}`);
  }

  if (!membership) {
    res.json({ success: true, data: null, message: 'User is not in a household' });
    return;
  }

  // Get all members of the household
  const { data: members, error: membersError } = await supabase
    .from('household_members')
    .select('*, profile:profiles(id, full_name, avatar_url, created_at)')
    .eq('household_id', membership.household_id);

  if (membersError) {
    throw ApiError.internal(`Failed to fetch members: ${membersError.message}`);
  }

  res.json({
    success: true,
    data: {
      household: membership.household,
      members,
    },
  });
});

/**
 * Create a new household
 * POST /api/household
 */
export const createHousehold = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { name, address } = req.body;

  if (!name) {
    throw ApiError.badRequest('Household name is required');
  }

  const supabase = getSupabaseAdmin();

  // Check if user is already in a household
  const { data: existingMembership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (existingMembership) {
    throw ApiError.conflict('User is already in a household');
  }

  // Create the household
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({
      name,
      address: address || '',
      created_by: req.user.id,
    })
    .select()
    .single();

  if (householdError) {
    throw ApiError.internal(`Failed to create household: ${householdError.message}`);
  }

  // Add the user as admin
  const { error: memberError } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: req.user.id,
    role: 'admin',
  });

  if (memberError) {
    throw ApiError.internal(`Failed to add user to household: ${memberError.message}`);
  }

  res.status(201).json({ success: true, data: household });
});

/**
 * Join a household using an invite code
 * POST /api/household/join
 */
export const joinHousehold = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { invite_code } = req.body;

  if (!invite_code) {
    throw ApiError.badRequest('Invite code is required');
  }

  const supabase = getSupabaseAdmin();

  // Check if user is already in a household
  const { data: existingMembership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (existingMembership) {
    throw ApiError.conflict('User is already in a household');
  }

  // Find the household by invite code
  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('*')
    .eq('invite_code', invite_code.toUpperCase())
    .maybeSingle();

  if (householdError) {
    throw ApiError.internal(`Failed to find household: ${householdError.message}`);
  }

  if (!household) {
    throw ApiError.notFound('Invalid invite code');
  }

  // Check if user is already a member
  const { data: existing } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', household.id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (existing) {
    throw ApiError.conflict('Already a member of this household');
  }

  // Add the user as a member
  const { error: memberError } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: req.user.id,
    role: 'member',
  });

  if (memberError) {
    throw ApiError.internal(`Failed to join household: ${memberError.message}`);
  }

  res.json({ success: true, data: household });
});

/**
 * Update household settings
 * PUT /api/household/:id
 */
export const updateHousehold = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const { name, address } = req.body;

  if (!id) {
    throw ApiError.badRequest('Household ID is required');
  }

  const supabase = getSupabaseAdmin();

  // Check if user is admin of the household
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', id)
    .eq('user_id', req.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Only admins can update household settings');
  }

  const updateData: { name?: string; address?: string } = {};
  if (name) updateData.name = name;
  if (address !== undefined) updateData.address = address;

  if (Object.keys(updateData).length === 0) {
    throw ApiError.badRequest('No update fields provided');
  }

  const { data: household, error } = await supabase
    .from('households')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to update household: ${error.message}`);
  }

  res.json({ success: true, data: household });
});

/**
 * Leave a household
 * POST /api/household/leave
 */
export const leaveHousehold = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const supabase = getSupabaseAdmin();

  // Get the user's membership
  const { data: membership, error: membershipError } = await supabase
    .from('household_members')
    .select('*, household:households(created_by)')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (membershipError) {
    throw ApiError.internal(`Failed to fetch membership: ${membershipError.message}`);
  }

  if (!membership) {
    throw ApiError.notFound('User is not in a household');
  }

  // Delete the membership
  const { error: deleteError } = await supabase
    .from('household_members')
    .delete()
    .eq('id', membership.id);

  if (deleteError) {
    throw ApiError.internal(`Failed to leave household: ${deleteError.message}`);
  }

  res.json({ success: true, message: 'Successfully left the household' });
});

/**
 * Remove a member from household (admin only)
 * DELETE /api/household/:householdId/members/:memberId
 */
export const removeMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { householdId, memberId } = req.params;

  if (!householdId || !memberId) {
    throw ApiError.badRequest('Household ID and Member ID are required');
  }

  const supabase = getSupabaseAdmin();

  // Check if requester is admin
  const { data: adminCheck } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId)
    .eq('user_id', req.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!adminCheck) {
    throw ApiError.forbidden('Only admins can remove members');
  }

  // Remove the member
  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('id', memberId)
    .eq('household_id', householdId);

  if (error) {
    throw ApiError.internal(`Failed to remove member: ${error.message}`);
  }

  res.json({ success: true, message: 'Member removed successfully' });
});

export default {
  getHousehold,
  createHousehold,
  joinHousehold,
  updateHousehold,
  leaveHousehold,
  removeMember,
};
