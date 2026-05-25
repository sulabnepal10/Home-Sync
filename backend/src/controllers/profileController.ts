import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

/**
 * Get the current authenticated user's profile
 * GET /api/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) {
    throw ApiError.internal(`Failed to fetch profile: ${error.message}`);
  }

  if (!profile) {
    throw ApiError.notFound('Profile not found');
  }

  res.json({ success: true, data: profile });
});

/**
 * Update the current authenticated user's profile
 * PUT /api/profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { full_name, avatar_url } = req.body;

  if (!full_name && !avatar_url) {
    throw ApiError.badRequest('No update fields provided');
  }

  const updateData: { full_name?: string; avatar_url?: string } = {};
  if (full_name) updateData.full_name = full_name;
  if (avatar_url) updateData.avatar_url = avatar_url;

  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(`Failed to update profile: ${error.message}`);
  }

  res.json({ success: true, data: profile });
});

/**
 * Get a user's public profile by ID
 * GET /api/profile/:id
 */
export const getPublicProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    throw ApiError.badRequest('User ID is required');
  }

  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw ApiError.internal(`Failed to fetch profile: ${error.message}`);
  }

  if (!profile) {
    throw ApiError.notFound('Profile not found');
  }

  res.json({ success: true, data: profile });
});

export default {
  getProfile,
  updateProfile,
  getPublicProfile,
};
