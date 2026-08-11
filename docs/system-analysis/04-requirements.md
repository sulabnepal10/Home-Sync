# 04 — Requirements

Every requirement below is traceable to a real route/controller/table —
cross-referenced in full in
[13-traceability-matrix.md](13-traceability-matrix.md). None of these
describe aspirational behavior; the "shall" statements match what the code
in this repository actually does today.

## Functional requirements

### Authentication & profile (FR-AUTH)

| ID | Requirement |
|---|---|
| FR-AUTH-001 | The system shall allow a user to sign up and sign in with email and password, via Supabase Auth. |
| FR-AUTH-002 | The system shall allow a user to sign in with Google OAuth. |
| FR-AUTH-003 | The system shall allow a user to request a password-reset email and set a new password. |
| FR-AUTH-004 | The system shall reject any API request without a valid, non-expired JWT signed by the project's own Supabase Auth instance. |
| FR-AUTH-005 | The system shall let a user view and update their own profile (`full_name`, `avatar_url`, `notification_preferences`). |

### Household (FR-HH)

| ID | Requirement |
|---|---|
| FR-HH-001 | The system shall allow an authenticated user with no existing household membership to create a household, becoming its admin. |
| FR-HH-002 | The system shall generate a unique invite code for every created household. |
| FR-HH-003 | The system shall allow a user with no existing household membership to join a household by invite code. |
| FR-HH-004 | The system shall prevent a user from belonging to more than one household at a time. |
| FR-HH-005 | The system shall allow a household admin to update household settings (name, address). |
| FR-HH-006 | The system shall allow a household admin to remove a member from the household. |
| FR-HH-007 | The system shall allow a member to leave their household voluntarily. |

### Expenses & debt (FR-EXP)

| ID | Requirement |
|---|---|
| FR-EXP-001 | The system shall allow a household member to record a shared expense (amount, description, category, payer). |
| FR-EXP-002 | The system shall support equal, percentage-based, and custom (fixed-amount) expense splitting. |
| FR-EXP-003 | The system shall reject an expense whose submitted split amounts do not sum to the expense total (within 1 cent). |
| FR-EXP-004 | The system shall reject a percentage split whose percentages do not sum to 100 (within 0.5). |
| FR-EXP-005 | The system shall allow the debtor on an expense split to mark their own share settled. |
| FR-EXP-006 | The system shall allow the original payer to update or delete their own expense. |
| FR-EXP-007 | The system shall allow a household member to define a recurring bill (amount, split rule, weekly/monthly frequency, due-date schedule). |
| FR-EXP-008 | The system shall automatically generate a real expense (with splits) from a recurring bill once its due date has passed, without requiring a scheduled job. |
| FR-EXP-009 | The system shall allow a household member to record a direct loan between two members (lender, borrower, amount). |
| FR-EXP-010 | The system shall allow the lender on a loan to update, settle, or delete it. |
| FR-EXP-011 | The system shall compute each household member's net balance by merging unsettled loans and unsettled expense splits into one figure per member. |
| FR-EXP-012 | The system shall simplify a household's aggregate debt into the minimum set of member-to-member settlements that resolve it. |

### Chores (FR-CHORE)

| ID | Requirement |
|---|---|
| FR-CHORE-001 | The system shall allow a household member to define a chore (name, frequency, point value). |
| FR-CHORE-002 | The system shall allow a household member to create, view, and delete chore assignments for a given date. |
| FR-CHORE-003 | The system shall allow the assignee to mark their own chore assignment complete. |
| FR-CHORE-004 | The system shall track a per-user on-time completion streak that continues only if the user's immediately-prior assignment was also completed on time. |
| FR-CHORE-005 | The system shall detect an assignment whose due date has passed with no completion, and shall not re-evaluate the same assignment for a miss more than once. |
| FR-CHORE-006 | Upon detecting a missed assignment, the system shall reset that user's streak to zero and create a new, flagged "penalty" assignment for the following day. |

### Meals (FR-MEAL)

| ID | Requirement |
|---|---|
| FR-MEAL-001 | The system shall allow a household member to schedule a meal with a date, time slot (breakfast/lunch/dinner/snack), chef, and notes. |
| FR-MEAL-002 | The system shall allow a member to join or leave a meal's attendee list. |
| FR-MEAL-003 | The system shall allow a member to propose 2–3 candidate meals for the same slot as a poll. |
| FR-MEAL-004 | The system shall allow each household member one vote per candidate meal, changeable by re-toggling. |
| FR-MEAL-005 | The system shall allow the chef or an admin to delete a meal. |

### Inventory (FR-INV)

| ID | Requirement |
|---|---|
| FR-INV-001 | The system shall allow a household member to add a shared inventory item with quantity, unit, and a minimum-quantity threshold. |
| FR-INV-002 | The system shall allow a member to restock an item, recording who purchased it and when. |
| FR-INV-003 | The system shall flag an item as low stock when its quantity is at or below its configured minimum. |

### Activity (FR-ACT)

| ID | Requirement |
|---|---|
| FR-ACT-001 | The system shall record a household-visible activity entry for every expense, loan, chore, meal, and inventory mutation, without requiring the acting user to do anything extra. |
| FR-ACT-002 | A failure to write an activity entry shall never block or roll back the action it was describing. |

## Non-functional requirements

### Security (NFR-SEC)

| ID | Requirement |
|---|---|
| NFR-SEC-001 | The system shall only accept JWTs signed with an asymmetric algorithm verifiable against the issuing Auth server's published JWKS keys — a token claiming a symmetric (HMAC) algorithm shall be rejected outright. |
| NFR-SEC-002 | A user shall only be able to read or write data belonging to their own household; the household to scope a request to shall always be derived server-side from the caller's verified membership, never from a client-supplied parameter. |
| NFR-SEC-003 | Row Level Security shall be enabled on every table as a defense-in-depth layer independent of application-level authorization, so a future direct-from-client query path fails closed by default rather than open. |
| NFR-SEC-004 | The system shall not start if a required secret (Supabase URL, anon key, or service-role key) is missing, rather than run in a partially-configured state. |
| NFR-SEC-005 | The system shall rate-limit invite-code join attempts separately and more strictly than general API traffic, to blunt brute-forcing of the household invite code. |
| NFR-SEC-006 | Every mutating request body shall be validated against an explicit schema before reaching business logic; a request that fails validation shall be rejected with a 400 and shall not reach the database. |

### Performance (NFR-PERF)

| ID | Requirement |
|---|---|
| NFR-PERF-001 | Household-scoped list queries (expenses, loans, chores, meals, inventory) shall be served by an indexed lookup on `household_id`, not a full-table scan. |
| NFR-PERF-002 | Lazily-triggered background work (recurring-bill generation, missed-chore detection) shall be bounded — capped at 12 catch-up cycles per recurring bill per request — so a long-neglected household cannot turn a single page load into an unbounded write storm. |

### Usability (NFR-USE)

| ID | Requirement |
|---|---|
| NFR-USE-001 | A user shall be able to record a shared expense in a single form: amount, description, split method, and participants, with no intermediate confirmation step. |
| NFR-USE-002 | Every primary data view (expenses, loans, chores, meals, inventory) shall present an explicit loading state and an explicit error state — a failed fetch shall never silently render as "no data." |
| NFR-USE-003 | Text and interactive elements shall meet a minimum 4.5:1 contrast ratio against their background in both light and dark themes. |

### Maintainability (NFR-MAINT)

| ID | Requirement |
|---|---|
| NFR-MAINT-001 | Split-amount arithmetic shall be implemented once and shared in principle between frontend preview and backend authority (`frontend/src/lib/splitCalculator.ts` mirrors `backend/src/utils/splitCalculator.ts`), so a user's live preview while filling out a form matches what the server will actually persist. |
| NFR-MAINT-002 | The backend shall re-validate and be the sole authority on any client-submitted split, regardless of what the client computed — the frontend calculation is a preview, never a trust boundary. |
