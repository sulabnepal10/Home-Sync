# 15 — Future Improvements

Concrete, scoped next steps — each phrased as a requirement so it can move
directly into [04-requirements.md](04-requirements.md) if picked up, rather
than as a vague roadmap bullet.

## Near-term (extends existing, working systems)

- **Automate the scenarios in [12-test-scenarios.md](12-test-scenarios.md).**
  The pure-function ones (split calculator, debt simplifier, streak logic)
  need no database and are the cheapest entry point; a `test` job in
  `.github/workflows/ci.yml` would gate `deploy` the same way
  `quality-control` already does.
- **`npm audit` (or equivalent) in CI.** Not currently run anywhere in the
  pipeline — a reasonable low-effort addition given the project already has
  a security-conscious CI gate for lint/typecheck.
- **Notification delivery.** `profiles.notification_preferences` already
  stores per-category and push/email toggles; nothing currently reads that
  column to send anything. The gap is specifically the delivery mechanism,
  not the preference model.
- **One-vote-per-poll enforcement for meal voting.** Currently
  `meal_votes` is unique per `(meal_id, user_id)`, not per
  `(poll_group_id, user_id)` — a member can vote for more than one
  candidate in the same poll. Worth an explicit product decision (is that
  actually desired, e.g. "approval voting"?) before treating it as a bug.

## Medium-term (new, but well-bounded)

- **Guest / view-only household role.** Analyzed in
  [03-scope.md](03-scope.md) as deliberately out of scope; would need a
  schema change (`household_members.role` CHECK constraint), new RLS
  policies, and read-only route handling.
- **Fairness dashboard.** Recharts is already a frontend dependency; the
  data it would need (contribution ratios across expenses/chores/meals) is
  the same data [14-future-ai-assistant.md](14-future-ai-assistant.md)
  analyzes for the summary feature — the two could share a data-aggregation
  layer.
- **AI-generated monthly summaries.** Fully analyzed in
  [14-future-ai-assistant.md](14-future-ai-assistant.md); not started.

## Longer-term / architectural

- **Optimal (not greedy) debt simplification.** BR-EXP-006 documents the
  current algorithm as an intentional simplicity trade-off. A true
  minimum-transaction solver exists as a graph problem in the literature;
  worth revisiting if households large enough to see the greedy algorithm's
  suboptimality in practice actually materialize — premature otherwise.
- **Scheduled (not lazy) background processing.** Recurring bills and
  missed-chore detection currently only run when a relevant page is
  fetched. This is correct and bounded (see BR-EXP-008) but means a
  household that never opens the app doesn't get bills generated in real
  time. A scheduled job would close that gap at the cost of needing
  separate worker infrastructure — a deliberate trade-off, not an oversight,
  documented in [10-architecture.md](10-architecture.md).
