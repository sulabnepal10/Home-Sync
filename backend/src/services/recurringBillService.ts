import { SupabaseClient } from '@supabase/supabase-js';
import { computeSplits, SplitType } from '../utils/splitCalculator';
import { logActivity } from './activityService';

const MAX_CATCHUP_ITERATIONS = 12;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function advanceDueDate(dateStr: string, frequency: 'weekly' | 'monthly'): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (frequency === 'weekly') {
    d.setUTCDate(d.getUTCDate() + 7);
  } else {
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return d.toISOString().slice(0, 10);
}

interface RecurringBillRow {
  id: string;
  household_id: string;
  payer_id: string;
  description: string;
  amount: number;
  category: string;
  split_type: SplitType;
  split_config: Record<string, number> | null;
  frequency: 'weekly' | 'monthly';
  next_due_date: string;
}

/**
 * Expands any recurring bill whose next_due_date has passed into a real
 * expense (+ splits), advancing the schedule as it goes. Called lazily at
 * the top of expense/recurring-bill read endpoints rather than on a cron —
 * consistent with the chore miss-detection approach — so it runs
 * transparently the next time a household looks at its expenses, with no
 * extra background process required.
 */
export async function generateDueRecurringBills(
  supabase: SupabaseClient,
  householdId: string
): Promise<void> {
  const { data: dueBills, error } = await supabase
    .from('recurring_bills')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_active', true)
    .lte('next_due_date', today());

  if (error || !dueBills || dueBills.length === 0) {
    return;
  }

  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', householdId);

  const participantIds = (members || []).map((m) => m.user_id);
  if (participantIds.length === 0) {
    return;
  }

  for (const bill of dueBills as RecurringBillRow[]) {
    let nextDueDate = bill.next_due_date;
    let iterations = 0;

    // Catch up on however many cycles elapsed while nobody looked (capped
    // to avoid a runaway backfill after a very long absence).
    while (nextDueDate <= today() && iterations < MAX_CATCHUP_ITERATIONS) {
      await generateOneExpense(supabase, bill, participantIds);
      nextDueDate = advanceDueDate(nextDueDate, bill.frequency);
      iterations++;
    }

    await supabase.from('recurring_bills').update({ next_due_date: nextDueDate }).eq('id', bill.id);
  }
}

async function generateOneExpense(
  supabase: SupabaseClient,
  bill: RecurringBillRow,
  participantIds: string[]
): Promise<void> {
  const splits = computeSplits(bill.amount, bill.split_type, participantIds, bill.split_config ?? undefined);

  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      household_id: bill.household_id,
      payer_id: bill.payer_id,
      amount: bill.amount,
      description: `${bill.description} (recurring)`,
      category: bill.category,
      split_type: bill.split_type,
    })
    .select()
    .single();

  if (expenseError || !expense) {
    console.error('Failed to auto-generate recurring bill expense:', expenseError?.message);
    return;
  }

  const { error: splitsError } = await supabase.from('expense_splits').insert(
    splits.map((s) => ({ expense_id: expense.id, user_id: s.user_id, amount: s.amount }))
  );

  if (splitsError) {
    console.error('Failed to insert splits for recurring bill expense:', splitsError.message);
  }

  await supabase.from('recurring_bills').update({ last_generated_expense_id: expense.id }).eq('id', bill.id);

  await logActivity(supabase, {
    householdId: bill.household_id,
    userId: bill.payer_id,
    actionType: 'recurring_bill_generated',
    description: `Recurring bill "${bill.description}" auto-generated ($${Number(bill.amount).toFixed(2)})`,
  });
}
