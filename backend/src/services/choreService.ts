import { SupabaseClient } from '@supabase/supabase-js';
import { logActivity } from './activityService';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Computes the streak value for an assignment being completed right now.
 * "On time" means completed on or before its assigned_date. The streak
 * continues only if the user's most recent prior assignment (by date) was
 * also completed on time; otherwise it restarts at 1 (or 0 if this
 * completion itself is late).
 */
export async function computeStreakOnCompletion(
  supabase: SupabaseClient,
  userId: string,
  assignedDate: string
): Promise<number> {
  const onTime = today() <= assignedDate;
  if (!onTime) {
    return 0;
  }

  const { data: prior } = await supabase
    .from('chore_assignments')
    .select('assigned_date, completed_at')
    .eq('user_id', userId)
    .lt('assigned_date', assignedDate)
    .order('assigned_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const priorOnTime =
    !!prior && !!prior.completed_at && prior.completed_at.slice(0, 10) <= prior.assigned_date;

  if (!prior || !priorOnTime) {
    return 1;
  }

  const { data: priorAssignment } = await supabase
    .from('chore_assignments')
    .select('streak_count')
    .eq('user_id', userId)
    .eq('assigned_date', prior.assigned_date)
    .maybeSingle();

  return (priorAssignment?.streak_count ?? 0) + 1;
}

/**
 * Lazily detects assignments that passed their due date without being
 * completed: marks each as penalized (so it's only ever processed once),
 * resets that user's streak, and inserts a replacement assignment for
 * tomorrow as the "extra assignment" penalty the README describes. Called
 * at the top of read endpoints rather than on a schedule/cron, so it runs
 * transparently whenever a household next looks at its chores.
 */
export async function checkMissedChoreAssignments(
  supabase: SupabaseClient,
  householdId: string
): Promise<void> {
  const { data: missed, error } = await supabase
    .from('chore_assignments')
    .select('id, chore_id, user_id, assigned_date, chore:chores!inner(household_id)')
    .eq('chore.household_id', householdId)
    .lt('assigned_date', today())
    .is('completed_at', null)
    .eq('missed_penalty_applied', false);

  if (error || !missed || missed.length === 0) {
    return;
  }

  for (const assignment of missed) {
    await supabase
      .from('chore_assignments')
      .update({ missed_penalty_applied: true, streak_count: 0 })
      .eq('id', assignment.id);

    const { error: insertError } = await supabase.from('chore_assignments').insert({
      chore_id: assignment.chore_id,
      user_id: assignment.user_id,
      assigned_date: addDays(today(), 1),
      streak_count: 0,
      is_penalty: true,
    });

    // A duplicate (unique chore_id + assigned_date) or other insert failure
    // here shouldn't block the read this is attached to.
    if (insertError) {
      console.error('Failed to insert missed-chore penalty assignment:', insertError.message);
      continue;
    }

    await logActivity(supabase, {
      householdId,
      userId: assignment.user_id,
      actionType: 'chore_missed',
      description: 'Missed a chore — an extra assignment was added as a penalty',
    });
  }
}
