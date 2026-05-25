import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

/**
 * Get all meals for the user's household
 * GET /api/meals
 */
export const getMeals = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { start_date, end_date, limit, offset } = req.query;
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
    .from('meals')
    .select('*, chef:profiles!chef_id(id, full_name, avatar_url)')
    .eq('household_id', membership.household_id);

  if (start_date) {
    query = query.gte('date', start_date);
  }
  if (end_date) {
    query = query.lte('date', end_date);
  }

  query = query
    .order('date', { ascending: true })
    .range(Number(offset) || 0, (Number(limit) || 50) + (Number(offset) || 0) - 1);

  const { data: meals, error } = await query;

  if (error) {
    throw ApiError.internal(`Failed to fetch meals: ${error.message}`);
  }

  res.json({ success: true, data: meals });
});

/**
 * Get a single meal by ID
 * GET /api/meals/:id
 */
export const getMeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: meal, error } = await supabase
    .from('meals')
    .select('*, chef:profiles!chef_id(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw ApiError.internal(`Failed to fetch meal: ${error.message}`);
  }

  if (!meal) {
    throw ApiError.notFound('Meal not found');
  }

  // Verify access
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', meal.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  res.json({ success: true, data: meal });
});

/**
 * Create a new meal
 * POST /api/meals
 */
export const createMeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { household_id, date, meal_name, notes, attendees } = req.body;

  if (!household_id || !date || !meal_name) {
    throw ApiError.badRequest('Household ID, date, and meal name are required');
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

  const { data: meal, error } = await supabase
    .from('meals')
    .insert({
      household_id,
      date,
      chef_id: req.user.id,
      meal_name,
      notes: notes || '',
      attendees: attendees || [],
    })
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to create meal: ${error.message}`);
  }

  res.status(201).json({ success: true, data: meal });
});

/**
 * Update a meal
 * PUT /api/meals/:id
 */
export const updateMeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const { meal_name, notes, date, attendees } = req.body;

  const supabase = getSupabaseAdmin();

  const { data: meal } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!meal) {
    throw ApiError.notFound('Meal not found');
  }

  // Only chef can update
  if (meal.chef_id !== req.user.id) {
    throw ApiError.forbidden('Only the chef can update this meal');
  }

  const updateData: Record<string, unknown> = {};
  if (meal_name) updateData.meal_name = meal_name;
  if (notes !== undefined) updateData.notes = notes;
  if (date) updateData.date = date;
  if (attendees !== undefined) updateData.attendees = attendees;

  const { data: updated, error } = await supabase
    .from('meals')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to update meal: ${error.message}`);
  }

  res.json({ success: true, data: updated });
});

/**
 * Delete a meal
 * DELETE /api/meals/:id
 */
export const deleteMeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: meal } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!meal) {
    throw ApiError.notFound('Meal not found');
  }

  // Only chef or admin can delete
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', meal.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  if (meal.chef_id !== req.user.id && membership.role !== 'admin') {
    throw ApiError.forbidden('Only chef or admin can delete this meal');
  }

  const { error } = await supabase.from('meals').delete().eq('id', id);

  if (error) {
    throw ApiError.internal(`Failed to delete meal: ${error.message}`);
  }

  res.json({ success: true, message: 'Meal deleted successfully' });
});

/**
 * Join a meal (add yourself to attendees)
 * POST /api/meals/:id/join
 */
export const joinMeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: meal } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!meal) {
    throw ApiError.notFound('Meal not found');
  }

  // Verify access
  const { data: membership } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('household_id', meal.household_id)
    .maybeSingle();

  if (!membership) {
    throw ApiError.forbidden('Access denied');
  }

  // Check if already attending
  if (meal.attendees && meal.attendees.includes(req.user.id)) {
    throw ApiError.badRequest('Already attending this meal');
  }

  const updatedAttendees = [...(meal.attendees || []), req.user.id];

  const { data: updated, error } = await supabase
    .from('meals')
    .update({ attendees: updatedAttendees })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to join meal: ${error.message}`);
  }

  res.json({ success: true, data: updated });
});

/**
 * Leave a meal (remove yourself from attendees)
 * POST /api/meals/:id/leave
 */
export const leaveMeal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { id } = req.params;
  const supabase = getSupabaseAdmin();

  const { data: meal } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!meal) {
    throw ApiError.notFound('Meal not found');
  }

  if (!meal.attendees || !meal.attendees.includes(req.user.id)) {
    throw ApiError.badRequest('Not attending this meal');
  }

  const updatedAttendees = meal.attendees.filter((id: string) => id !== req.user?.id);

  const { data: updated, error } = await supabase
    .from('meals')
    .update({ attendees: updatedAttendees })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to leave meal: ${error.message}`);
  }

  res.json({ success: true, data: updated });
});

export default {
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal,
  joinMeal,
  leaveMeal,
};
