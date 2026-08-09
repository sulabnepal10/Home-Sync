# 11 — Acceptance Criteria

Given/When/Then criteria for the requirements in
[04-requirements.md](04-requirements.md) most likely to be scrutinized —
the money-math and authorization rules — plus one per other domain.
Numbers are chosen to make the underlying rule from
[06-business-rules.md](06-business-rules.md) checkable by hand.

## FR-EXP-002 / FR-EXP-003 — Expense splitting

```
Given a household has 3 members
When a member creates a $10.01 expense with an equal split across all 3
Then two members are assigned $3.34 and one member is assigned $3.33
And the three amounts sum to exactly $10.01
```

```
Given a household has 4 members
When a member creates a $400 expense with a percentage split of
  25% / 25% / 25% / 25%
Then each member is assigned exactly $100
```

```
Given a household has 2 members
When a member submits a custom split of $30 and $19 for a $50 expense
Then the system rejects the request with a 400
And no expense row is created
```

## FR-EXP-011 / FR-EXP-012 — Balance merge and simplification

```
Given member A has an unsettled $500 loan owed to member B
And member B has an unsettled $500 expense-split owed to member C
When any member requests the household's simplified balances
Then member A's net balance is -$500
And member B's net balance is $0
And member C's net balance is +$500
And the returned settlement list contains exactly one entry: A pays C $500
```

```
Given member A owes member B $500 (loan)
And member B owes member C $300 (loan)
When simplified balances are requested
Then the settlement list contains: A pays C $300, then A pays B $200
And member B never appears as a debtor or creditor of $500 or $300 directly
```

```
Given A owes B $100, B owes C $100, and C owes A $100 (all loans)
When simplified balances are requested
Then every member's net balance is $0
And the settlement list is empty
```

## FR-CHORE-004 — Streak continuity

```
Given a user has no prior completed assignments
When they complete an assignment on or before its assigned_date
Then their streak_count becomes 1
```

```
Given a user's most recent prior assignment was completed on time
  with streak_count = 4
When they complete their current assignment on or before its assigned_date
Then their streak_count becomes 5
```

```
Given a user's most recent prior assignment was completed late
When they complete their current assignment on time
Then their streak_count becomes 1, not 1 + the prior streak
```

## FR-CHORE-005 / FR-CHORE-006 — Missed chore detection

```
Given an assignment's assigned_date has passed with no completed_at
And missed_penalty_applied is false
When any household member loads the Chores page
Then the assignment is flagged missed_penalty_applied = true
And the user's streak_count resets to 0
And a new assignment for the same chore is created for tomorrow,
  flagged is_penalty = true
And loading the Chores page again does not create a second penalty
  for the same original miss
```

## FR-HH-003 / FR-HH-004 — Household join

```
Given a user does not belong to any household
When they submit a valid invite code (in any letter casing)
Then they become a member of that household with role = 'member'
```

```
Given a user already belongs to a household
When they attempt to join a different household by invite code
Then the request is rejected with a 409 Conflict
And their existing membership is unchanged
```

## FR-MEAL-003 / FR-MEAL-004 — Meal polls

```
Given a member proposes 2 candidate meals for Friday dinner
When 3 household members vote — 2 for candidate A, 1 for candidate B
Then candidate A is displayed as the leading option
And no separate "finalize" action is required for that to be true
```

## FR-INV-003 — Low stock

```
Given an inventory item has quantity = 2 and min_quantity = 3
When the household views inventory
Then the item is flagged as low stock
```

```
Given the same item is restocked to quantity = 5
When the household views inventory again
Then the item is no longer flagged as low stock
```

## NFR-SEC-002 — Household scoping (regression criteria for the IDOR fix)

```
Given user X belongs to household 1
And household 2 has expenses that belong only to its own members
When user X calls GET /api/expenses with any household_id query parameter,
  including household 2's id
Then the response contains only household 1's expenses
And household 2's data never appears regardless of the query parameter
```

## NFR-SEC-001 — JWT algorithm (regression criteria for the auth-bypass fix)

```
Given an attacker has fetched this project's public JWKS key
And forged a JWT with header {"alg": "HS256"} signed using that public key
  as an HMAC secret, claiming an arbitrary user's sub
When that token is presented to any authenticated endpoint
Then the request is rejected with 401 Unauthorized
And no HS256-signed token is ever accepted regardless of its claims
```
