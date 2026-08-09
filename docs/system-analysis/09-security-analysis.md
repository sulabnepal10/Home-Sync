# 09 — Security Analysis

This doc exists because two real, exploitable vulnerabilities were found in
this codebase during a security review and fixed — they're documented here
as a requirement → design decision → implementation story, not as
abstract "best practices."

## Finding 1: JWT algorithm-confusion auth bypass

**Requirement:** NFR-SEC-001 — only tokens signed with an asymmetric
algorithm, verifiable against the Auth server's own published keys, may be
accepted.

**What was wrong:** `requireAuth.ts` verified incoming JWTs with
`jsonwebtoken`, resolving the verification key via `getKey`, which always
fetches an **asymmetric public key** from Supabase's JWKS endpoint
(`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`). But the accepted
algorithms list included `HS256` — a **symmetric** algorithm — alongside
`RS256`/`ES256`. `jsonwebtoken` uses whichever algorithm the token itself
claims in its header, and for HS256 it treats the same key material passed
to `getKey` as an HMAC secret. Since JWKS public keys are, by definition,
public, an attacker could:

1. Fetch the project's own public key from `/auth/v1/.well-known/jwks.json`
   (no auth required — that's the point of a public key).
2. Forge a JWT header claiming `HS256`.
3. Sign it using the public key as an HMAC secret.
4. Present it to any endpoint behind `requireAuth` as any user ID they chose.

This is a full authentication bypass — not a theoretical one, a
well-documented JWT library class of bug.

**Design decision:** never accept an algorithm whose trust model doesn't
match what `getKey` provides. Since `getKey` only ever resolves a public
key, only algorithms that treat a public key as a public key —
`RS256`, `ES256` — may be accepted.

**Implementation:**
```ts
jwt.verify(token, getKey, { algorithms: ['RS256', 'ES256'] }, ...)
```
`backend/src/middleware/requireAuth.ts:94`. The vulnerable `optionalAuth`
variant, which had the same flawed list and no callers, was deleted rather
than fixed-in-place.

## Finding 2: IDOR on the expenses list

**Requirement:** NFR-SEC-002 — the household to scope a request to must
always be derived server-side, never client-supplied.

**What was wrong:** `getExpenses` (`GET /api/expenses`) accepted an optional
`household_id` from the query string and used it directly in the Supabase
query — while the backend runs on the **service-role key**, which bypasses
Postgres RLS entirely. Every other list endpoint in the codebase (loans,
chores, meals, inventory) derived the household from the caller's own
`household_members` row; this one endpoint trusted the request instead. Any
authenticated user could read any household's expenses by guessing or
enumerating a `household_id`.

**Design decision:** the household a request is scoped to is never trust
input — it's always looked up from the caller's verified membership.

**Implementation:**
```ts
const { data: membership } = await supabase
  .from('household_members')
  .select('household_id')
  .eq('user_id', req.user.id)
  .maybeSingle();
// ...always .eq('household_id', membership.household_id) — the query
// param, if present, is never read.
```
`backend/src/controllers/expenseController.ts`.

## Requirement → design → implementation, end to end

| Requirement | Design decision | Implementation |
|---|---|---|
| NFR-SEC-001 | Reject any algorithm mismatched to the key-resolution strategy | `requireAuth.ts` — `algorithms: ['RS256', 'ES256']` |
| NFR-SEC-002 | Household scope is server-derived, never client-supplied, on every endpoint | `expenseController.getExpenses` + equivalent pattern already present in loan/chore/meal/inventory controllers |
| NFR-SEC-003 | RLS as an independent second layer, matching what controllers already enforce | `supabase/migrations/002_defense_in_depth_and_columns.sql` |
| NFR-SEC-004 | Fail closed on missing configuration | `backend/src/config/index.ts` — `process.exit(1)` outside `NODE_ENV=test` |
| NFR-SEC-005 | Throttle the one guessable secret (invite code) harder than general traffic | `joinHouseholdLimiter` — 10 / 15 min, vs. 300 / 15 min globally |
| NFR-SEC-006 | Validate shape before business logic runs | `middleware/validate.ts` + one zod schema file per domain |

## Why RLS exists even though the backend bypasses it (NFR-SEC-003)

The backend authenticates the *user* via JWT, then queries Postgres using
the Supabase **service-role key**, which ignores Row Level Security. That
means RLS policies currently enforce nothing against this backend's own
traffic — all authorization for this API happens in the controllers, as
shown above.

They're still enabled and kept in sync with controller logic (initial
migration + `002_defense_in_depth_and_columns.sql`, which specifically adds
UPDATE/DELETE policies the first migration was missing) for one reason:
**this stack's common alternative pattern is querying Supabase directly
from the client with the anon key**, skipping a custom backend entirely. If
this project — or a fork of it — ever added that access path, default-deny
RLS means it fails closed (no policy = no access) rather than open. Writing
policies now, while they're cheap to verify against still-fresh controller
logic, is treated as insurance against a future architecture change, not
dead weight.

## What's explicitly not covered

- **No automated security test suite** — see
  [12-test-scenarios.md](12-test-scenarios.md). Both findings above were
  caught by manual code review, not a regression test that would catch a
  reintroduction.
- **No dependency-vulnerability scanning configured in CI** — a reasonable
  next addition (`npm audit` or equivalent as a CI step), not currently
  present in `.github/workflows/ci.yml`.
- **Secrets rotation is an operational practice, not a system feature** —
  documented as a manual step in the project's setup process, not something
  the application enforces or reminds about.
