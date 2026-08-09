export type SplitType = 'equal' | 'custom' | 'percentage';

export interface Split {
  user_id: string;
  amount: number;
}

/**
 * Mirrors backend/src/utils/splitCalculator.ts exactly (same rounding rule:
 * work in integer cents, assign any leftover cent to sorted-first user ids
 * first) so the live preview shown here always matches what the server
 * accepts — the server re-validates on submit and is the actual authority.
 */
export function computeSplits(
  amount: number,
  splitType: SplitType,
  participantIds: string[],
  customValues?: Record<string, number>
): Split[] {
  if (participantIds.length === 0) return [];

  const totalCents = Math.round(amount * 100);

  if (splitType === 'equal') {
    return distributeCents(totalCents, [...participantIds].sort());
  }

  if (splitType === 'percentage') {
    if (!customValues) return [];
    const sortedIds = [...participantIds].sort();
    const rawCents = sortedIds.map((id) => Math.floor((totalCents * (customValues[id] ?? 0)) / 100));
    const assigned = rawCents.reduce((a, b) => a + b, 0);
    const remainder = totalCents - assigned;
    return sortedIds.map((id, i) => ({
      user_id: id,
      amount: (rawCents[i] + (i < remainder ? 1 : 0)) / 100,
    }));
  }

  // 'custom' — pass amounts straight through, already dollar values
  const sortedIds = [...participantIds].sort();
  return sortedIds.map((id) => ({
    user_id: id,
    amount: Math.round((customValues?.[id] ?? 0) * 100) / 100,
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
