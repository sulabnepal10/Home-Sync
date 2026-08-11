# 07 — Process Models

Each diagram reflects the actual control flow in the corresponding
controller/service, not an idealized version of it.

## Create expense

```mermaid
flowchart TD
    A[User fills expense form] --> B[Select split method:<br/>equal / percentage / custom]
    B --> C[Select participants]
    C --> D[Client computes live preview<br/>lib/splitCalculator.ts]
    D --> E[Submit]
    E --> F{Server recomputes split<br/>utils/splitCalculator.ts}
    F -->|Sum mismatch| G[400 — reject<br/>no row written]
    F -->|Valid| H[Insert expense row]
    H --> I[Insert expense_splits rows]
    I --> J[Log activity entry]
    J --> K[Client refetches —<br/>balances now include this debt]
```

## View simplified balances (runs on every read, nothing cached)

```mermaid
flowchart TD
    A[GET /api/loans/balances] --> B[Fetch unsettled loans<br/>for household]
    A --> C[Fetch expenses + splits<br/>for household]
    B --> D[Merge into per-member<br/>owed / lent / net]
    C --> D
    D --> E[Sort debtors desc,<br/>creditors desc]
    E --> F{Debtors and<br/>creditors remain?}
    F -->|Yes| G[Match largest debtor<br/>to largest creditor]
    G --> H[Record settlement for<br/>min of the two amounts]
    H --> F
    F -->|No| I[Return balances +<br/>settlement list]
```

## Complete chore assignment (with miss-detection as a precondition)

```mermaid
flowchart TD
    A[GET /api/chores or<br/>/api/chore-assignments] --> B[checkMissedChoreAssignments]
    B --> C{Any assignment past due,<br/>uncompleted, unflagged?}
    C -->|Yes| D[Flag missed_penalty_applied<br/>Reset streak to 0]
    D --> E[Insert penalty assignment<br/>for tomorrow]
    E --> F[Log activity: chore_missed]
    F --> C
    C -->|No| G[Return chores/assignments]
    G --> H[User marks an assignment<br/>complete]
    H --> I{Completed on or before<br/>assigned_date?}
    I -->|No| J[streak_count = 0]
    I -->|Yes| K{Was the user's prior<br/>assignment on time?}
    K -->|No / none| L[streak_count = 1]
    K -->|Yes| M[streak_count = prior + 1]
    J --> N[Set completed_at,<br/>persist streak_count]
    L --> N
    M --> N
```

## Recurring bill generation (lazy, triggered by a read)

```mermaid
flowchart TD
    A[GET /api/expenses or<br/>/api/recurring-bills] --> B{Any active bill with<br/>next_due_date <= today?}
    B -->|No| Z[Continue to normal<br/>list response]
    B -->|Yes| C[iterations = 0]
    C --> D{next_due_date <= today<br/>AND iterations < 12?}
    D -->|Yes| E[Compute splits for<br/>all household members]
    E --> F[Insert expense + splits]
    F --> G[Log activity:<br/>recurring_bill_generated]
    G --> H[Advance next_due_date<br/>by frequency]
    H --> I[iterations += 1]
    I --> D
    D -->|No| J[Persist final next_due_date]
    J --> Z
```

## Meal poll voting

```mermaid
flowchart TD
    A[Member proposes 2-3 candidates] --> B[Insert meals rows sharing<br/>one client-generated poll_group_id]
    B --> C[Household members cast votes<br/>POST /:id/vote per candidate]
    C --> D{User already voted<br/>for this candidate?}
    D -->|Yes| E[Remove their vote —<br/>toggle off]
    D -->|No| F[Insert their vote]
    E --> G[Read time: count meal_votes<br/>per candidate]
    F --> G
    G --> H[Candidate with most votes<br/>is the displayed leader —<br/>no separate finalize step]
```

## Join household by invite code

```mermaid
flowchart TD
    A[User submits invite code] --> B{Rate limit:<br/>10 attempts / 15 min}
    B -->|Exceeded| C[429 — rejected]
    B -->|OK| D{User already has a<br/>household_members row?}
    D -->|Yes| E[409 Conflict]
    D -->|No| F[Look up household by<br/>uppercased invite code]
    F -->|Not found| G[404]
    F -->|Found| H{Already a member of<br/>this household?}
    H -->|Yes| I[409 Conflict]
    H -->|No| J[Insert household_members<br/>role = member]
    J --> K[Return household]
```
