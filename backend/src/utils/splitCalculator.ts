export type SplitType = 'equal' | 'custom' | 'percentage';

export interface Split {
  user_id: string;
  amount: number;
}

/**
 * Computes how an expense amount is divided among participants. All
 * arithmetic happens in integer cents to avoid floating-point drift, and any
 * leftover cent from division is deterministically assigned to the
 * lexicographically-first participant ids first — the same rule the
 * frontend's live preview uses, so client and server math agree by
 * construction.
 *
 * - 'equal': amount split evenly across participantIds.
 * - 'percentage': customValues maps user_id -> percentage (must sum to ~100).
 * - 'custom': customValues maps user_id -> dollar amount (must sum to ~amount).
 */
export function computeSplits(
  amount: number,
  splitType: SplitType,
  participantIds: string[],
  customValues?: Record<string, number>
): Split[] {
  if (participantIds.length === 0) {
    throw new Error('At least one participant is required to split an expense');
  }

  const totalCents = Math.round(amount * 100);

  if (splitType === 'equal') {
    return distributeCents(totalCents, [...participantIds].sort());
  }

  if (splitType === 'percentage') {
    if (!customValues) {
      throw new Error('Percentages are required for a percentage split');
    }
    const sortedIds = [...participantIds].sort();
    const sumPct = sortedIds.reduce((sum, id) => sum + (customValues[id] ?? 0), 0);
    if (Math.abs(sumPct - 100) > 0.5) {
      throw new Error(`Percentages must sum to 100 (got ${sumPct})`);
    }

    // Convert each percentage to cents, then run the same deterministic
    // remainder-distribution used for 'equal' on any left-over cent.
    const rawCents = sortedIds.map((id) => Math.floor((totalCents * (customValues[id] ?? 0)) / 100));
    const assigned = rawCents.reduce((a, b) => a + b, 0);
    const remainder = totalCents - assigned;

    return sortedIds.map((id, i) => ({
      user_id: id,
      amount: (rawCents[i] + (i < remainder ? 1 : 0)) / 100,
    }));
  }

  // 'custom'
  if (!customValues) {
    throw new Error('Split amounts are required for a custom split');
  }
  const sortedIds = [...participantIds].sort();
  const sumCents = sortedIds.reduce((sum, id) => sum + Math.round((customValues[id] ?? 0) * 100), 0);
  if (Math.abs(sumCents - totalCents) > 1) {
    throw new Error(
      `Split amounts must sum to the expense total (expected $${(totalCents / 100).toFixed(2)}, got $${(sumCents / 100).toFixed(2)})`
    );
  }

  return sortedIds.map((id) => ({
    user_id: id,
    amount: Math.round((customValues[id] ?? 0) * 100) / 100,
  }));
}

function distributeCents(totalCents: number, sortedIds: string[]): Split[] {
  const base = Math.floor(totalCents / sortedIds.length);
  const remainder = totalCents - base * sortedIds.length;
  return sortedIds.map((id, i) => ({
    user_id: id,
    amount: (base + (i < remainder ? 1 : 0)) / 100,
  }));
}

/** Validates that a set of splits sums to the expense total within 1 cent. */
export function validateSplitsSum(splits: Split[], amount: number): void {
  const sumCents = splits.reduce((sum, s) => sum + Math.round(s.amount * 100), 0);
  const totalCents = Math.round(amount * 100);
  if (Math.abs(sumCents - totalCents) > 1) {
    throw new Error(
      `Split amounts must sum to the expense total (expected $${(totalCents / 100).toFixed(2)}, got $${(sumCents / 100).toFixed(2)})`
    );
  }
}
