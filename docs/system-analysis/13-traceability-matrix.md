# 13 — Requirements Traceability Matrix

Every row is checkable against the actual repository — click through the
implementation column. Verification references
[12-test-scenarios.md](12-test-scenarios.md); "manual" means verified by
hand during development (see that doc's status note) rather than by an
automated suite.

| Requirement | Use Case | API | Implementation | Verification |
|---|---|---|---|---|
| FR-AUTH-001 | — | Supabase Auth (`signUp`/`signInWithPassword`) | `frontend/src/store/useAuthStore.ts` | Manual |
| FR-AUTH-002 | — | Supabase Auth (`signInWithOAuth`) | `useAuthStore.signInWithGoogle`, `pages/AuthCallback.tsx` | Manual |
| FR-AUTH-003 | — | Supabase Auth (`resetPasswordForEmail`) | `pages/ResetPassword.tsx`, `useAuthStore.requestPasswordReset` | Manual |
| FR-AUTH-004 | — | All `/api/*` (via `requireAuth`) | `backend/src/middleware/requireAuth.ts` | TC-SEC-001, TC-SEC-002, TC-SEC-003 |
| FR-AUTH-005 | — | `GET/PUT /api/profile` | `backend/src/controllers/profileController.ts` | Manual |
| FR-HH-001 | UC-HH-001 (create path) | `POST /api/household` | `householdController.createHousehold` | Manual |
| FR-HH-002 | UC-HH-001 | `households.invite_code` default | `supabase/migrations/001_initial_schema.sql` | Manual |
| FR-HH-003 | UC-HH-001 | `POST /api/household/join` | `householdController.joinHousehold` | Manual |
| FR-HH-004 | UC-HH-001 (BR-HH-001) | `POST /api/household`, `/join` | Existing-membership check in both controllers | Manual |
| FR-HH-005 | — | `PUT /api/household/:id` | `householdController.updateHousehold` (admin-gated) | Manual |
| FR-HH-006 | — | `DELETE /api/household/:householdId/members/:memberId` | `householdController.removeMember` | Manual |
| FR-HH-007 | — | `POST /api/household/leave` | `householdController.leaveHousehold` | Manual |
| FR-EXP-001 | UC-EXP-001 | `POST /api/expenses` | `expenseController.createExpense` | Manual |
| FR-EXP-002 | UC-EXP-001 | `POST /api/expenses` | `backend/src/utils/splitCalculator.ts` `computeSplits` | TC-EXP-001, TC-EXP-002 |
| FR-EXP-003 | UC-EXP-001 (alt flow) | `POST /api/expenses` | `validateSplitsSum` | TC-EXP-004 |
| FR-EXP-004 | UC-EXP-001 (alt flow) | `POST /api/expenses` | `computeSplits` percentage branch | TC-EXP-003 |
| FR-EXP-005 | — | `POST /api/expenses/:expenseId/splits/:splitId/settle` | `expenseController.settleSplit` | Manual |
| FR-EXP-006 | — | `PUT`/`DELETE /api/expenses/:id` | `expenseController.updateExpense`/`deleteExpense`; RLS payer-only policy | Manual |
| FR-EXP-007 | — | `POST /api/recurring-bills` | `recurringBillController.createRecurringBill` | Manual |
| FR-EXP-008 | — | (lazy, on `GET /api/expenses`) | `recurringBillService.generateDueRecurringBills` | TC-RB-001, TC-RB-002 |
| FR-EXP-009 | — | `POST /api/loans` | `loanController.createLoan` | Manual |
| FR-EXP-010 | — | `PUT`/`POST .../settle`/`DELETE /api/loans/:id` | `loanController` (lender-only, RLS-backed) | Manual |
| FR-EXP-011 | UC-LOAN-001 | `GET /api/loans/balances` | `balanceService.computeHouseholdBalances` | TC-LOAN-004 |
| FR-EXP-012 | UC-LOAN-001 | `GET /api/loans/balances` | `balanceService.simplifyDebts` | TC-LOAN-001, TC-LOAN-002, TC-LOAN-003 |
| FR-CHORE-001 | — | `POST /api/chores` | `choreController.createChore` | Manual |
| FR-CHORE-002 | — | `POST/GET/DELETE /api/chore-assignments` | `choreController` | TC-CHORE-006 |
| FR-CHORE-003 | UC-CHORE-001 | `POST /api/chore-assignments/:id/complete` | `choreController.completeChoreAssignment` | Manual |
| FR-CHORE-004 | UC-CHORE-001 | (same) | `choreService.computeStreakOnCompletion` | TC-CHORE-001, TC-CHORE-002, TC-CHORE-003 |
| FR-CHORE-005 | UC-CHORE-002 | (lazy, on chores/assignments reads) | `choreService.checkMissedChoreAssignments` | TC-CHORE-004, TC-CHORE-005 |
| FR-CHORE-006 | UC-CHORE-002 | (same) | Same function — penalty insert | TC-CHORE-004 |
| FR-MEAL-001 | — | `POST /api/meals` | `mealController.createMeal` | Manual |
| FR-MEAL-002 | — | `POST /api/meals/:id/join`\|`leave` | `mealController.joinMeal`/`leaveMeal` | Manual |
| FR-MEAL-003 | UC-MEAL-001 | `POST /api/meals` (shared `poll_group_id`) | Frontend poll-mode UI, `pages/Meals.tsx` | Manual |
| FR-MEAL-004 | UC-MEAL-001 | `POST /api/meals/:id/vote` | `mealController.voteMeal` | TC-MEAL-001, TC-MEAL-002 |
| FR-MEAL-005 | — | `DELETE /api/meals/:id` | `mealController.deleteMeal`; RLS chef-or-admin policy | Manual |
| FR-INV-001 | — | `POST /api/inventory` | `inventoryController.createInventoryItem` | Manual |
| FR-INV-002 | — | `POST /api/inventory/:id/restock` | `inventoryController.restockItem` | Manual |
| FR-INV-003 | — | `GET /api/inventory` | Low-stock computation in `inventoryController.getInventory` | TC-INV-001, TC-INV-002 |
| FR-ACT-001 | — | (internal, all mutating endpoints) | `activityService.logActivity`, called from every domain controller | Manual |
| FR-ACT-002 | — | (internal) | `logActivity`'s fire-and-forget error handling | Manual (code inspection) |
| NFR-SEC-001 | — | All `/api/*` | `requireAuth.ts` algorithms allow-list | TC-SEC-003 |
| NFR-SEC-002 | — | `GET /api/expenses` (+ pattern in all list endpoints) | `expenseController.getExpenses` membership lookup | TC-SEC-004 |
| NFR-SEC-003 | — | N/A (database layer) | `supabase/migrations/002_defense_in_depth_and_columns.sql` | Manual (policy review) |
| NFR-SEC-004 | — | N/A (startup) | `backend/src/config/index.ts` | Manual |
| NFR-SEC-005 | — | `POST /api/household/join` | `middleware/rateLimiter.ts` `joinHouseholdLimiter` | TC-SEC-006 |
| NFR-SEC-006 | — | All mutating endpoints | `middleware/validate.ts` + `validation/*.schemas.ts` | TC-SEC-005 |
| NFR-PERF-001 | — | N/A (database layer) | `CREATE INDEX idx_*_household` statements, `001_initial_schema.sql` | Manual (query plan review) |
| NFR-PERF-002 | — | `GET /api/expenses`, `/api/chores` | `MAX_CATCHUP_ITERATIONS` in `recurringBillService.ts` | TC-RB-002 |
| NFR-USE-002 | — | Frontend only | `components/shared/QueryState.tsx` (`LoadingState`/`ErrorState`) | Manual |
| NFR-USE-003 | — | Frontend only | `frontend/src/index.css` `--hs-*` tokens; see contrast fixes in project history | Manual |
| NFR-MAINT-001 | — | Frontend + backend | `frontend/src/lib/splitCalculator.ts` mirrors `backend/src/utils/splitCalculator.ts` | Manual (side-by-side review) |
| NFR-MAINT-002 | UC-EXP-001 | `POST /api/expenses` | Server-side `validateSplitsSum` regardless of client input | TC-EXP-005 |

## Coverage gaps this table makes visible

- Every **NFR-SEC** row has a concrete test scenario except NFR-SEC-003 and
  NFR-SEC-004, which are startup/config-time and schema-time properties —
  harder to express as a request/response scenario, verified by review
  instead. A future automated suite could still cover NFR-SEC-004 (assert
  the process exits with missing env vars) fairly cheaply.
- **NFR-USE-001** (three-step expense entry) has no row at all — it's a UX
  claim about interaction count, not a system behavior, and doesn't yet have
  a defined measurement method. Flagged here rather than silently dropped.
