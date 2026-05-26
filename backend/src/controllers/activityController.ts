import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

/**
 * Get recent activity logs for the user's household
 * GET /api/activity
 */
export const getActivities = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw ApiError.unauthorized();
    }

    const { limit = 20 } = req.query;
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

    // Fetch activities joined with profile data
    const { data: activities, error } = await supabase
        .from('activity_log')
        .select('*, profile:profiles(id, full_name, avatar_url)')
        .eq('household_id', membership.household_id)
        .order('created_at', { ascending: false })
        .limit(Number(limit));

    if (error) {
        throw ApiError.internal(`Failed to fetch activities: ${error.message}`);
    }

    res.json({ success: true, data: activities });
});