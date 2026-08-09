# 14 — Future Requirement Analysis: AI Household Summary

This is a worked example of analyzing a feature **before** building it — the
README lists an "AI Roommate Assistant" under future direction, and rather
than implement something speculative, this document does the requirements
work that should precede implementation. Nothing here is built.

## Business objective

Give each household member a periodic, plain-language summary of their
contribution relative to the household, so fairness is visible without
someone manually cross-referencing four different pages.

## Why this is a real requirement, not a novelty feature

Every number this feature would summarize already exists and is already
computed by the system — `balanceService` (money), `chore_assignments.
streak_count` (chores), `meal_votes`/attendance (meals), `inventory_items.
purchased_by` (purchases). The feature is a presentation layer over
existing computation, not a new source of truth. That's precisely why it's
tractable to analyze concretely instead of leaving it as a vague "AI
feature" bullet point.

## Functional requirements (proposed)

| ID | Requirement |
|---|---|
| FR-AI-001 | The system shall generate a per-member monthly summary containing: total expenses paid, net balance, chore completion rate, and current streak. |
| FR-AI-002 | The summary shall be generated from existing tables only — no new data collection specific to this feature. |
| FR-AI-003 | The summary shall render the same underlying numbers a member could already see on the Dashboard/Expenses/Chores pages — it summarizes, it does not introduce a second, divergent calculation. |
| FR-AI-004 | A member shall be able to view their own summary on demand, not only on a fixed schedule. |

## Data requirements

All inputs are already-modeled entities — no schema changes required for a
v1:

- `expenses` + `expense_splits` scoped to the member and month, for amount
  paid and amount owed.
- `chore_assignments` scoped to the member and month, for completion rate
  (`completed_at IS NOT NULL` ÷ total assigned) and current `streak_count`.
- `meals` where the member appears in `attendees`, for participation.
- `inventory_items` where `purchased_by` = the member, for restock
  contribution.

## Where "AI" actually belongs — and where it doesn't

The arithmetic above (sums, ratios, streaks) is deterministic and already
implemented elsewhere in the codebase. Using a language model to compute
"contribution score: 87%" would be strictly worse than computing it
directly — non-deterministic, unauditable, and slower. The legitimate use
of an LLM here is narrow: **turning already-correct numbers into a
readable sentence** ("You completed 92% of chores and covered $12,500 in
shared expenses this month — the most of anyone in the household"), not
producing the numbers themselves.

This distinction is the actual design decision worth stating: **AI
generates the narration; the existing deterministic services generate the
facts.** Getting this backwards is the most common failure mode for
"AI feature" additions to systems that already have real business logic.

## Privacy and failure considerations

- **Privacy:** a summary that ranks members ("the most of anyone") exposes
  one member's relative standing to others by construction — this needs an
  explicit product decision (household-wide leaderboard vs. private,
  per-member-only summary), not an implementation default.
- **Failure mode — no data:** a member with zero activity in the period
  should get an explicit "no activity to summarize" response, not a
  fabricated or hallucinated-sounding empty narration.
- **Failure mode — LLM unavailable:** the raw numbers (already computed
  deterministically) should still be displayable without the narrated
  sentence — the feature should degrade to "just show the numbers," not
  fail outright, since the numbers are the actual value.

## Acceptance criteria (proposed, unbuilt)

```
Given a member paid $12,500 in expenses and completed 92% of chores in a month
When they request their monthly summary
Then the returned figures match what balanceService and the chore
  completion query would independently compute for that member and month
```

```
Given a member had zero expenses, chores, or meals in a month
When they request their monthly summary
Then the system returns an explicit empty-period response,
  not a fabricated summary
```

## Why this belongs in the portfolio as-is (unbuilt)

Analyzing a feature to this level — objective, functional requirements,
data requirements, an explicit design decision about where AI should and
shouldn't be used, privacy/failure cases, and acceptance criteria — is the
deliverable. Building it would demonstrate implementation skill this
project already demonstrates elsewhere; leaving it as analysis demonstrates
the ability to scope and reason about a feature *before* committing
engineering time to it, which is a distinct and equally real skill.
