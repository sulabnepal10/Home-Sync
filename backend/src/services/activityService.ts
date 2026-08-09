import { SupabaseClient } from '@supabase/supabase-js';

export interface LogActivityParams {
  householdId: string;
  userId: string;
  actionType: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records a household activity entry. Best-effort: a logging failure must
 * never fail the primary mutation it's attached to, so errors are swallowed
 * (and logged) rather than thrown.
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: LogActivityParams
): Promise<void> {
  const { error } = await supabase.from('activity_log').insert({
    household_id: params.householdId,
    user_id: params.userId,
    action_type: params.actionType,
    description: params.description,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.error('logActivity failed:', error.message);
  }
}
