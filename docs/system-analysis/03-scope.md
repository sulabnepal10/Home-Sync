# 03 — Scope

Scope is defined against what's actually implemented and running today
(traceable to real routes/tables — see
[13-traceability-matrix.md](13-traceability-matrix.md)), not against the
full ambition of the product. Splitting "in scope" from "future requirement"
this explicitly is itself an analysis decision: it stops a features list
from quietly implying more than the system does.

## In scope (implemented)

| Domain | Capability |
|---|---|
| Identity & household | Email/password and Google OAuth sign-in; password reset; one household per user; join by 8-character invite code; admin can remove a member; a member can leave |
| Expenses | Create/read/update/delete an expense; equal, percentage, or custom splits; settle an individual split; recurring bills that auto-generate a real expense when due |
| Debts | Manual lender/borrower loans; a unified balance view that merges loan debt and expense-split debt per member; debt-graph simplification into minimum settlements |
| Chores | Create/read/update/delete a chore and its recurring assignments; mark complete; on-time completion streaks; automatic miss-detection with a penalty re-assignment |
| Meals | Schedule a meal with a chef, time slot, and notes; join/leave as an attendee; propose 2–3 candidates for a slot and vote; see the leading candidate |
| Inventory | Track shared items with quantity, unit, and a minimum-quantity threshold; restock; low-stock indicator |
| Activity | A per-household audit trail of the above, written automatically as a side effect of each mutation |
| Security | JWKS-verified asymmetric-only JWT auth; server-side authorization scoped to the caller's own household on every read/write; Postgres RLS as a second, defense-in-depth layer; per-endpoint request validation; rate limiting |

## Explicitly out of scope (not built — future requirements, not gaps)

These appear in the product's public description as future direction. They
are documented here as **candidate future requirements** rather than
silently-missing features, and one is analyzed in depth as a worked example
in [14-future-ai-assistant.md](14-future-ai-assistant.md):

- **Guest / view-only role.** Only `admin` and `member` exist in
  `household_members.role` today. A read-only third role (e.g. for a
  landlord) is a plausible extension but was never modeled — no schema
  column, no policy, no UI.
- **Fairness dashboard.** Recharts is already a frontend dependency and the
  Dashboard page shows some aggregate figures, but a dedicated
  contribution/fairness scoring view does not exist.
- **AI-generated monthly summaries.** No AI integration exists anywhere in
  the codebase. See [14-future-ai-assistant.md](14-future-ai-assistant.md)
  for a full requirements analysis of what this would need.
- **Push/email notifications.** `profiles.notification_preferences` stores a
  user's toggle choices (`push`, `email`, per-category flags), but nothing
  currently reads that column to actually send a notification — it's
  preference storage waiting on a delivery mechanism.
- **Automated test suite.** See
  [12-test-scenarios.md](12-test-scenarios.md) — scenarios are designed and
  documented, but not yet wired into CI as executable tests.

## Boundary decisions worth stating explicitly

- **Chore/expense/meal/inventory management is member-level, not
  admin-gated.** This was a deliberate reading of the product's fairness
  goal (see [02-stakeholder-analysis.md](02-stakeholder-analysis.md)), not
  an oversight — only membership *management* (remove member, edit household)
  is admin-only.
- **One household per user.** `createHousehold` and `joinHousehold` both
  reject the request if the caller already has a `household_members` row.
  Multi-household membership (e.g. a person splitting time between two
  households) is out of scope.
- **Debt simplification is greedy, not globally minimal.** It is documented
  as such in code and in [06-business-rules.md](06-business-rules.md) — an
  explicit, acknowledged trade-off of simplicity over optimality, not an
  unnoticed limitation.
