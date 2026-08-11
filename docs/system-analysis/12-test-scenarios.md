# 12 — Test Scenarios

**Status: designed, manually executed during development; not yet
automated.** There is no test runner configured in either package
(`backend/package.json` and `frontend/package.json` have no `test` script,
and `.github/workflows/ci.yml` runs typecheck + lint, not tests). This is
recorded here honestly rather than implied otherwise — see
[03-scope.md](03-scope.md) and
[15-future-improvements.md](15-future-improvements.md).

What follows is the actual scenario design used to verify the security
fixes and business logic in this repository — the split calculator and
debt simplifier were verified by hand-running the real functions against
these inputs (not guessed at), and the auth/IDOR fixes were verified against
a running server with real tokens. Writing these down as scenarios first,
independent of whether a test runner executes them yet, is the point: the
scenario is the deliverable, automation is a delivery mechanism for it.

Each scenario ID maps 1:1 to an acceptance criterion in
[11-acceptance-criteria.md](11-acceptance-criteria.md) — see
[13-traceability-matrix.md](13-traceability-matrix.md) for the full chain.

## Split calculation — TC-EXP

| ID | Scenario | Expected result | Verified how |
|---|---|---|---|
| TC-EXP-001 | Equal split, $10.01 across 3 participants | Two get $3.34, one gets $3.33; sum = $10.01 exactly | Ran `computeSplits(10.01, 'equal', [3 uuids])` directly via `tsx`, inspected output |
| TC-EXP-002 | Percentage split summing to exactly 100 | Splits computed proportionally, remainder cents assigned deterministically | Same, with `customValues` percentages |
| TC-EXP-003 | Percentage split summing to 97 (outside ±0.5 tolerance) | Throws before any DB write | Same, asserted thrown error |
| TC-EXP-004 | Custom split summing $1 short of the expense total | Throws (`validateSplitsSum`) | Same |
| TC-EXP-005 | `POST /api/expenses` with a manipulated split that doesn't match server recomputation | 400, no row written | Manual `curl` against a running backend with a valid token |

## Debt simplification — TC-LOAN

| ID | Scenario | Expected result | Verified how |
|---|---|---|---|
| TC-LOAN-001 | Chain: A→B $500, B→C $500 | Settlement = [A pays C $500]; B absent from output | Hand-traced `computeHouseholdBalances` + `simplifyDebts` against seeded rows, confirmed against the worked example in [06-business-rules.md](06-business-rules.md) |
| TC-LOAN-002 | Chain with remainder: A→B $500, B→C $300 | Settlements = [A pays C $300, A pays B $200] | Same |
| TC-LOAN-003 | Closed loop: A→B $100, B→C $100, C→A $100 | Settlements = [] (all nets are 0) | Same |
| TC-LOAN-004 | One loan + one expense-split between the same two people, opposite directions, equal amount | Merged net balance = $0 for both; no settlement generated | Same, seeded one row in each source table |

## Authentication & authorization — TC-SEC

| ID | Scenario | Expected result | Verified how |
|---|---|---|---|
| TC-SEC-001 | Request with no `Authorization` header | 401 | `curl` against running backend |
| TC-SEC-002 | Request with a well-formed but expired token | 401, "Token has expired" | `curl` with a manually expired token |
| TC-SEC-003 | Request with an HS256-signed token using the project's own public JWKS key as the HMAC secret | 401 — algorithm rejected before signature is even checked | `curl` against running backend post-fix; confirmed the pre-fix code path would have accepted it by inspection |
| TC-SEC-004 | `GET /api/expenses?household_id=<another household's id>` as an authenticated member of a different household | Only the caller's own household's expenses are returned, `household_id` query param has no effect | `curl` with two seeded households and a real token for one of them |
| TC-SEC-005 | Malformed body (`amount: -5`) to `POST /api/expenses` | 400 before reaching the controller | `curl` |
| TC-SEC-006 | 11 rapid `POST /api/household/join` calls from the same caller | 11th call returns 429 | `curl` loop |

## Chores — TC-CHORE

| ID | Scenario | Expected result | Verified how |
|---|---|---|---|
| TC-CHORE-001 | Complete an assignment with no prior assignment | `streak_count` = 1 | Traced `computeStreakOnCompletion` against a seeded user with no history |
| TC-CHORE-002 | Complete on time; prior assignment also on time with streak 4 | `streak_count` = 5 | Same, seeded prior row |
| TC-CHORE-003 | Complete on time; prior assignment was late | `streak_count` = 1 | Same |
| TC-CHORE-004 | An assignment's date passes with no completion | On next chores read: `missed_penalty_applied` = true, streak reset to 0, new `is_penalty` assignment created for tomorrow | Traced `checkMissedChoreAssignments` against a seeded overdue row |
| TC-CHORE-005 | Re-read chores after TC-CHORE-004 | No duplicate penalty is created for the same original miss | Same, called twice |
| TC-CHORE-006 | `GET /api/chores/:choreId/assignments` with a specific `choreId` | Returns only that chore's assignments (regression check for the path-param bug fixed in this codebase) | `curl` |

## Recurring bills — TC-RB

| ID | Scenario | Expected result | Verified how |
|---|---|---|---|
| TC-RB-001 | A recurring bill's `next_due_date` is today | On next expenses/recurring-bills read, one expense + splits generated, `next_due_date` advanced by frequency | Traced `generateDueRecurringBills` against a seeded due bill |
| TC-RB-002 | A recurring bill's `next_due_date` is 20 weeks in the past (weekly frequency) | Exactly 12 expenses generated in one call (the catch-up cap), `next_due_date` left in the past for the next call to continue | Traced against `MAX_CATCHUP_ITERATIONS` |

## Meals — TC-MEAL

| ID | Scenario | Expected result | Verified how |
|---|---|---|---|
| TC-MEAL-001 | Two candidates proposed, votes 2-1 | The 2-vote candidate is the computed leader | Traced vote counting logic against seeded `meal_votes` rows |
| TC-MEAL-002 | A user votes, then calls vote again on the same candidate | Their vote is removed (toggle behavior) | `curl` sequence |

## Inventory — TC-INV

| ID | Scenario | Expected result | Verified how |
|---|---|---|---|
| TC-INV-001 | `quantity` at or below `min_quantity` | Item flagged low-stock in the response | Manual inspection of `getInventory` response shape |
| TC-INV-002 | Restock brings `quantity` above `min_quantity` | Item no longer flagged | Same |

## What automating this would take

- **Backend:** Vitest or Jest + Supertest, with a seeded local Postgres
  (the same throwaway-container approach used to verify migrations during
  development would extend naturally into a CI fixture). Pure-function
  scenarios (TC-EXP, TC-LOAN streak math) need no database at all and are
  the cheapest to automate first.
- **Frontend:** Vitest for `lib/splitCalculator.ts` (mirrors backend
  scenarios exactly, catching drift between the two copies — see
  NFR-MAINT-001); Playwright for the golden-path flows in
  [05-use-cases.md](05-use-cases.md) if end-to-end coverage is added later.
- **CI:** a `test` job in `.github/workflows/ci.yml` alongside the existing
  `quality-control` job, gating `deploy` the same way lint/typecheck already
  do.
