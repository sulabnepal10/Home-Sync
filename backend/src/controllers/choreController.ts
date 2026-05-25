import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

/**
 * Get all chores for the user's household
 * GET /api/chores
 */
export const getChores = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { is_active, limit, offset } = req.query;
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
    .from('chores')
    .select('*')
    .eq('household_id', membership.household_id);

  if (is_active === 'true') {
    query = query.eq('is_active', true);
  } else if (is_active === 'false') {
    query = query.eq('is_active', false);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(Number(offset) || 0, (Number(limit) || 50) + (Number(offset) || 0) - 1);

  const { data: chores, error } = await query;

  if (error) {
    throw ApiError.internal(`Failed to fetch chores: ${error.message}`);
  }

  res.json({ success: true, data: chores });
});

/**
 * Get a single chore by ID
 * GET /api/chores/:id
 */
export const getChore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: chore, error } = await supabase
    .from('chores')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw ApiError.internal(`Failed to fetch chore: ${error.message}`);
  }

  if (!chore) {
    throw ApiError.notFound('Chore not found');
  }

  // Verify access
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', chore.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  res.json({ success: true, data: chore });
});

/**
 * Create a new chore
 * POST /api/chores
 */
export const createChore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { household_id, name, description, frequency, points } = req.body;

  if (!household_id || !name) {
    throw ApiError.badRequest('Household ID and name are required');
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

  const { data: chore, error } = await supabase
    .from('chores')
    .insert({
      household_id,
      name,
      description: description || '',
      frequency: frequency || 'weekly',
      points: points || 10,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to create chore: ${error.message}`);
  }

  res.status(201).json({ success: true, data: chore });
});

/**
 * Update a chore
 * PUT /api/chores/:id
 */
export const updateChore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const { name, description, frequency, points, is_active } = req.body;

  const supabase = getSupabaseAdmin();

  const { data: chore } = await supabase
    .from('chores')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!chore) {
    throw ApiError.notFound('Chore not found');
  }

  // Check household membership
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', chore.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (frequency) updateData.frequency = frequency;
  if (points !== undefined) updateData.points = points;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data: updated, error } = await supabase
    .from('chores')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to update chore: ${error.message}`);
  }

  res.json({ success: true, data: updated });
});

/**
 * Delete a chore
 * DELETE /api/chores/:id
 */
export const deleteChore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: chore } = await supabase
    .from('chores')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!chore) {
    throw ApiError.notFound('Chore not found');
  }

  // Check household membership
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', chore.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  const { error } = await supabase.from('chores').delete().eq('id', id);

  if (error) {
    throw ApiError.internal(`Failed to delete chore: ${error.message}`);
  }

  res.json({ success: true, message: 'Chore deleted successfully' });
});

// ============ Chore Assignments ============

/**
 * Get chore assignments
 * GET /api/chore-assignments
 */
export const getChoreAssignments = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { start_date, end_date, chore_id } = req.query;
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
      .from('chore_assignments')
      .select(
        '*, chore:chores(*), profile:profiles(id, full_name, avatar_url)'
      )
      .eq('chore.household_id', membership.household_id);

    if (start_date) {
      query = query.gte('assigned_date', start_date);
    }
    if (end_date) {
      query = query.lte('assigned_date', end_date);
    }
    if (chore_id) {
      query = query.eq('chore_id', chore_id);
    }

    query = query.order('assigned_date', { ascending: true });

    const { data: assignments, error } = await query;

    if (error) {
      throw ApiError.internal(
        `Failed to fetch chore assignments: ${error.message}`
      );
    }

    res.json({ success: true, data: assignments });
  }
);

/**
 * Create a chore assignment
 * POST /api/chore-assignments
 */
export const createChoreAssignment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { chore_id, user_id, assigned_date } = req.body;

    if (!chore_id || !user_id || !assigned_date) {
      throw ApiError.badRequest(
        'Chore ID, user ID, and assigned date are required'
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify chore exists and user has access
    const { data: chore } = await supabase
      .from('chores')
      .select('*')
      .eq('id', chore_id)
      .maybeSingle();

    if (!chore) {
      throw ApiError.notFound('Chore not found');
    }

    const { data: membership } = await supabase
      .from('household_members')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('household_id', chore.household_id)
      .maybeSingle();

    if (!membership) {
      throw ApiError.forbidden('Access denied');
    }

    const { data: assignment, error } = await supabase
      .from('chore_assignments')
      .insert({
        chore_id,
        user_id,
        assigned_date,
        streak_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw ApiError.internal(
        `Failed to create chore assignment: ${error.message}`
      );
    }

    res.status(201).json({ success: true, data: assignment });
  }
);

/**
 * Complete a chore assignment
 * POST /api/chore-assignments/:id/complete
 */
export const completeChoreAssignment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const { notes } = req.body;
    const supabase = getSupabaseAdmin();

    const { data: assignment } = await supabase
      .from('chore_assignments')
      .select('*, chore:chores(*)')
      .eq('id', id)
      .maybeSingle();

    if (!assignment) {
      throw ApiError.notFound('Chore assignment not found');
    }

    // Only assigned user can complete
    if (assignment.user_id !== req.user.id) {
      throw ApiError.forbidden('Only the assigned user can complete this chore');
    }

    if (assignment.completed_at) {
      throw ApiError.badRequest('Chore already completed');
    }

    const { data: updated, error } = await supabase
      .from('chore_assignments')
      .update({
        completed_at: new Date().toISOString(),
        notes: notes || '',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw ApiError.internal(
        `Failed to complete chore assignment: ${error.message}`
      );
    }

    res.json({ success: true, data: updated });
  }
);

/**
 * Delete a chore assignment
 * DELETE /api/chore-assignments/:id
 */
export const deleteChoreAssignment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    const { data: assignment } = await supabase
      .from('chore_assignments')
      .select('*, chore:chores(household_id)')
      .eq('id', id)
      .maybeSingle();

    if (!assignment) {
      throw ApiError.notFound('Chore assignment not found');
    }

    // Check household access
    const { data: membership } = await supabase
      .from('household_members')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('household_id', (assignment.chore as { household_id: string }).household_id)
      .maybeSingle();

    if (!membership) {
      throw ApiError.forbidden('Access denied');
    }

    const { error } = await supabase
      .from('chore_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      throw ApiError.internal(
        `Failed to delete chore assignment: ${error.message}`
      );
    }

    res.json({ success: true, message: 'Chore assignment deleted' });
  }
);

export default {
  getChores,
  getChore,
  createChore,
  updateChore,
  deleteChore,
  getChoreAssignments,
  createChoreAssignment,
  completeChoreAssignment,
  deleteChoreAssignment,
};
