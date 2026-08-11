# 06 — Business Rules

These are the rules that actually govern the money-math and scheduling
logic — extracted from `backend/src/utils/splitCalculator.ts`,
`backend/src/services/balanceService.ts`, and
`backend/src/services/choreService.ts`, with worked numeric examples
verified by hand-tracing the real algorithm (not a hypothetical
description of intended behavior).

## Expense splitting

### BR-EXP-001 — Split amounts must reconcile to the cent

All split math is done in integer cents, and the system's tolerance for
disagreement is small and explicit:

- **Equal split:** the total is divided by participant count; any leftover
  cent(s) from integer division go to the first N participants in sorted
  user-id order (not the payer, not first-added — a fixed, arbitrary, but
  *deterministic* rule, so the same input always produces the same split).
  Example: $10.01 across 3 people → 1001¢ ÷ 3 = 333¢ remainder 2¢ → the
  first two participants (by sorted id) get 334¢, the third gets 333¢.
- **Percentage split:** percentages must sum to 100 within ±0.5; the same
  remainder-to-first-N-ids rule resolves rounding.
- **Custom split:** amounts must sum to the expense total within ±1¢.

A split that fails its tolerance is rejected with a 400 before any row is
written — there is no partial expense.

### BR-EXP-002 — The server is the sole authority on splits

The frontend computes the same split algorithm for a live preview
(`frontend/src/lib/splitCalculator.ts`), but the backend independently
recomputes and validates every submitted split
(`validateSplitsSum` in `expenseController.createExpense`). A client that
sent a manipulated split is corrected or rejected, not trusted.

### BR-EXP-003 — Settlement is binary, not partial

An `expense_splits` row is either `is_settled = false` or `true` — there is
no partial-payment amount tracked against a split. Fully repaying part of a
debt currently means recording a new loan/expense for the difference, not
adjusting an existing one. Same for `loans.is_settled`.

## Debt simplification

### BR-EXP-004 — Loans and expense splits merge into one balance graph

Before simplification, `computeHouseholdBalances` combines two independent
sources into a single per-member `{owed, lent, net}`:
unsettled `loans` (direct lender/borrower entries) and unsettled
`expense_splits` (every non-payer's share of an expense they didn't pay).
Without this merge, a $500 expense-split debt and a $500 direct loan between
the same two people in opposite directions would never visibly cancel out.

### BR-EXP-005 — Debt simplification worked examples

`simplifyDebts` sorts debtors and creditors by amount (largest first) and
greedily matches them. Traced by hand against the actual implementation:

**Chain that fully passes through:** A owes B $500; B owes C $500.
Net balances: A = −500, B = 0, C = +500.
→ **A pays C $500.** B is never involved in the output — it nets to zero.

**Chain with a remainder:** A owes B $500; B owes C $300.
Net balances: A = −500, B = +200, C = +300.
→ **A pays C $300, then A pays B $200.** The greedy match always resolves
the largest creditor first, so C (the larger creditor) is settled before B.

**A closed loop of debts fully cancels:** A owes B $100; B owes C $100;
C owes A $100. Every member's net balance is exactly 0.
→ **Zero settlements.** No money needs to change hands even though three
debt relationships were recorded — this is the entire point of computing
net balances before simplifying, not simplifying the raw list of debts.

### BR-EXP-006 — Simplification is greedy, not globally minimal

The algorithm is explicitly documented in code as *not* guaranteed to
produce the mathematically minimal transaction count in every possible
balance configuration — it's simple, deterministic, and matches what was
already implemented client-side before the merge. This is a stated,
intentional trade-off (implementation simplicity over an optimal
min-cash-flow solver), not an unrecognized limitation. See
[03-scope.md](03-scope.md).

### BR-EXP-007 — Deleting an expense retroactively erases its debt

`expense_splits` cascades on `expenses` deletion (`ON DELETE CASCADE`), and
balances are recomputed from live data on every request rather than
cached. Deleting an expense therefore removes its debt from the next
balance calculation with no separate reconciliation step — there is no
"refund" concept distinct from delete.

## Chores

### BR-CHORE-001 — Streak continuity

A completion is "on time" if it happens on or before `assigned_date`.
When completing an assignment, the system looks at the user's most recent
*prior* assignment (by date):

- Prior didn't exist, or wasn't completed on time → new streak = **1**
  (or **0** if this completion is itself late).
- Prior was completed on time → new streak = prior's streak **+ 1**.

The streak is per-user, not per-chore — it reflects overall chore
reliability, not consistency on one specific task.

### BR-CHORE-002 — A miss always produces exactly one penalty

An assignment becomes eligible for miss-detection once its date has passed
with no `completed_at`. The moment it's detected (on the next chores read
for that household, not on a schedule): `missed_penalty_applied` is set
true — a one-way flag ensuring the same miss is never penalized twice —
the user's streak resets to 0, and a new assignment for the same chore is
inserted for the following day, flagged `is_penalty = true`.

## Recurring bills

### BR-EXP-008 — Catch-up is bounded

If nobody looks at a household's expenses for a long time, a recurring
bill's `next_due_date` could be far in the past. Generation runs in a loop,
advancing the due date and creating one expense per elapsed cycle, capped
at **12 iterations** per bill per request — a year of missed weekly bills
does not get silently backfilled in one shot; it catches up incrementally
across subsequent reads instead.

## Household membership

### BR-HH-001 — One household per user

Both `createHousehold` and `joinHousehold` check for an existing
`household_members` row for the caller and reject with a conflict if one
exists. A user cannot belong to two households simultaneously, and cannot
create a second household without first leaving their current one.

### BR-HH-002 — Invite codes are case-insensitive by construction

Codes are generated uppercase (`upper(substr(gen_random_uuid()::text, 1, 8))`
at the database level) and the join lookup uppercases whatever the user
typed before comparing — "shouting" or lowercase codes both work.

## Authorization

### BR-SEC-001 — Household scope is never client-supplied

Every household-scoped read/write derives `household_id` from the caller's
own `household_members` row, looked up server-side from their verified
identity — never accepted as a request parameter. See
[09-security-analysis.md](09-security-analysis.md) for the specific bug
this rule was written to close.

### BR-SEC-002 — Most actions are member-level; a narrow set is admin-only

Only removing a member and updating household settings require
`role = 'admin'`. Every other mutation (expenses, loans, chores, meals,
inventory) is available to any household member — a deliberate design
choice tied to the product's fairness goal, not an oversight (see
[02-stakeholder-analysis.md](02-stakeholder-analysis.md)).
