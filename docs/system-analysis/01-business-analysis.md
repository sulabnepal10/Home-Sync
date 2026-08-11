# 01 — Business Analysis

## Problem statement

People sharing a household — flatmates, roommates, a family splitting chores —
routinely manage four things badly: **who paid for what**, **who owes whom**,
**whose turn it is to do a task**, and **what's left in the pantry**. In
practice these get tracked (if at all) across group chats, memory, and ad-hoc
spreadsheets. That produces predictable failure modes:

- Expenses get remembered inconsistently, so debts are disputed or forgotten.
- A owes B, B owes C, and nobody simplifies the chain, so more money changes
  hands than necessary.
- Chore rotations drift because there's no record of who did what last, so
  the same person ends up doing a task twice in a row.
- Shared items (detergent, gas, filters) run out without anyone noticing
  until it's urgent.

None of these are hard problems individually. They're annoying because they're
**social** problems with no shared source of truth — every household reinvents
an informal, inconsistently-enforced process for the same four workflows.

## Objective

Home Sync is a centralized household management system. It gives a household
a single shared record for:

1. **Expenses and debt** — record shared costs, split them by an explicit
   rule (equal / percentage / custom), and collapse the resulting web of
   IOUs into the smallest number of payments that settle it.
2. **Chores** — assign recurring tasks to members on a schedule, track
   completion and streaks, and automatically penalize (re-assign) a missed
   chore instead of silently letting it drop.
3. **Meals** — record who's cooking, who's attending (so a per-person meal
   split, or grocery estimate, has real numbers behind it), and let the
   household vote between candidate meals for a slot.
4. **Inventory** — track shared consumables with a minimum-quantity
   threshold, so low stock is visible before it becomes urgent.

The unifying idea in all four is **removing the need for someone to
remember**: the system is the record, not a person's memory of a group chat.

## Target users

Home Sync has two roles today, defined by `household_members.role` in the
schema:

| Role | Description |
|---|---|
| **Household Admin** | The member who created the household (`households.created_by`), or anyone later granted `role = 'admin'`. Can update household settings and remove members. |
| **Household Member** | Anyone who joined via invite code. Can record expenses/loans, complete chores, propose/vote on meals, and manage inventory on equal footing with an admin — day-to-day household activity isn't gated by role. |

A **guest / view-only** role is a natural future extension (e.g. a landlord
checking on maintenance-related inventory) but does not exist in the current
schema or API — see [03-scope.md](03-scope.md) for why it's deliberately
out of scope for now rather than assumed.

## Success looks like

- A household can answer "who owes whom, and how much" in one screen, with
  the fewest possible number of payments to settle it — not a raw list of
  every expense split and loan ever created.
- A missed chore is never silent: it's flagged and re-assigned automatically,
  without an admin having to notice and manually intervene.
- Nobody's out of pocket for a shared bill because they forgot the manual
  step: recurring bills generate themselves.
