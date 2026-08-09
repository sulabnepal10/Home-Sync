import { SupabaseClient } from '@supabase/supabase-js';

export interface UserBalance {
  owed: number;
  lent: number;
  net: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function ensure(balances: Record<string, UserBalance>, userId: string): UserBalance {
  if (!balances[userId]) {
    balances[userId] = { owed: 0, lent: 0, net: 0 };
  }
  return balances[userId];
}

/**
 * Computes each household member's net balance by merging two sources of
 * debt that the app tracks separately: manual `loans` and `expense_splits`
 * (money the payer of an expense is owed by everyone else who had a share).
 * Without this merge, a debt chain that spans both — e.g. an expense split
 * plus a separate loan between the same two people — never nets out, even
 * though it should.
 */
export async function computeHouseholdBalances(
  supabase: SupabaseClient,
  householdId: string
): Promise<Record<string, UserBalance>> {
  const balances: Record<string, UserBalance> = {};

  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('lender_id, borrower_id, amount')
    .eq('household_id', householdId)
    .eq('is_settled', false);

  if (loansError) {
    throw new Error(`Failed to fetch loans: ${loansError.message}`);
  }

  (loans || []).forEach((loan) => {
    ensure(balances, loan.borrower_id).owed += Number(loan.amount);
    ensure(balances, loan.lender_id).lent += Number(loan.amount);
  });

  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('payer_id, expense_splits(user_id, amount, is_settled)')
    .eq('household_id', householdId);

  if (expensesError) {
    throw new Error(`Failed to fetch expenses: ${expensesError.message}`);
  }

  (expenses || []).forEach((expense) => {
    const splits = (expense.expense_splits ?? []) as {
      user_id: string;
      amount: number;
      is_settled: boolean;
    }[];

    splits.forEach((split) => {
      if (split.is_settled || split.user_id === expense.payer_id) {
        return;
      }
      ensure(balances, split.user_id).owed += Number(split.amount);
      ensure(balances, expense.payer_id).lent += Number(split.amount);
    });
  });

  Object.keys(balances).forEach((userId) => {
    balances[userId].net = round2(balances[userId].lent - balances[userId].owed);
    balances[userId].owed = round2(balances[userId].owed);
    balances[userId].lent = round2(balances[userId].lent);
  });

  return balances;
}

/**
 * Greedy min-transaction debt simplification: repeatedly matches the
 * largest debtor against the largest creditor until all balances are
 * settled. Not guaranteed to produce the mathematically minimal number of
 * transactions in every case, but is simple, deterministic, and matches
 * the algorithm already used client-side (frontend/src/pages/Loans.tsx).
 */
export function simplifyDebts(balances: Record<string, UserBalance>): Settlement[] {
  const EPSILON = 0.01;

  const debtors = Object.entries(balances)
    .filter(([, b]) => b.net < -EPSILON)
    .map(([id, b]) => ({ id, remaining: -b.net }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = Object.entries(balances)
    .filter(([, b]) => b.net > EPSILON)
    .map(([id, b]) => ({ id, remaining: b.net }))
    .sort((a, b) => b.remaining - a.remaining);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = round2(Math.min(debtor.remaining, creditor.remaining));

    if (amount > 0) {
      settlements.push({ from: debtor.id, to: creditor.id, amount });
    }

    debtor.remaining = round2(debtor.remaining - amount);
    creditor.remaining = round2(creditor.remaining - amount);

    if (debtor.remaining <= EPSILON) i++;
    if (creditor.remaining <= EPSILON) j++;
  }

  return settlements;
}
