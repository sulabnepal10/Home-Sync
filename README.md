## 📖 The Problem
Living with roommates often turns into a messy spreadsheet of "who owes who," missed chores, and passive-aggressive group chats about who bought the last water jar. As a student living with flatmates, I realized we needed a better way to divide rent, track daily expenses, and ensure household responsibilities were handled equally. 

**[Home Sync]** is a smart living management platform designed to automate fairness. It goes beyond simple expense tracking by introducing debt simplification algorithms, chore gamification, and smart inventory management.

---

## 📐 System Analysis & Design

Home Sync is documented as two layers: the **analysis** behind why it works the way it does, and the **implementation** below. The analysis layer is grounded directly in this codebase — every requirement, rule, and diagram links to the actual route, controller, or table that implements it, cross-referenced end-to-end in a [requirements traceability matrix](docs/system-analysis/13-traceability-matrix.md).

| Doc | Covers |
|---|---|
| [01 — Business Analysis](docs/system-analysis/01-business-analysis.md) | Problem statement, objective, target users |
| [02 — Stakeholder Analysis](docs/system-analysis/02-stakeholder-analysis.md) | Who uses the system and what they need from it |
| [03 — Scope](docs/system-analysis/03-scope.md) | What's built vs. deliberately deferred, and why |
| [04 — Requirements](docs/system-analysis/04-requirements.md) | Functional & non-functional requirements, with IDs |
| [05 — Use Cases](docs/system-analysis/05-use-cases.md) | Actors, use case diagram, detailed use case specs |
| [06 — Business Rules](docs/system-analysis/06-business-rules.md) | The actual money-math and scheduling rules, with worked examples |
| [07 — Process Models](docs/system-analysis/07-process-models.md) | Flow diagrams for expense creation, debt simplification, chore lifecycle, etc. |
| [08 — Data Model](docs/system-analysis/08-data-model.md) | Why each entity exists, and the real ER diagram |
| [09 — Security Analysis](docs/system-analysis/09-security-analysis.md) | Two real vulnerabilities found and fixed — requirement → design → implementation |
| [10 — Architecture](docs/system-analysis/10-architecture.md) | Why a custom backend in front of Supabase, request pipeline, deployment |
| [11 — Acceptance Criteria](docs/system-analysis/11-acceptance-criteria.md) | Given/When/Then criteria for the requirements above |
| [12 — Test Scenarios](docs/system-analysis/12-test-scenarios.md) | Manually-verified QA scenarios (automation status noted honestly) |
| [13 — Traceability Matrix](docs/system-analysis/13-traceability-matrix.md) | Requirement → use case → API → implementation → verification |
| [14 — Future Requirement: AI Summary](docs/system-analysis/14-future-ai-assistant.md) | A worked example of analyzing a feature before building it |
| [15 — Future Improvements](docs/system-analysis/15-future-improvements.md) | Scoped next steps, phrased as requirements |

---

## ✨ Key Features (Implementation)

### 💰 Smart Expense & Debt Management
* **Intelligent Splitting:** Split expenses equally, by percentage, or by custom amounts (e.g., "Only 2 people ate dinner," "Electricity split by room").
* **Debt Graph Simplification:** If Roommate A owes B Rs. 500, and B owes C Rs. 500, the system automatically simplifies the debt network so A pays C directly.
* **Recurring Bills:** Auto-generate monthly rent and utility tracking.

### 🧹 Gamified Chore Rotation
* **Dynamic Schedules:** Rotating responsibilities for bathroom cleaning, dishwashing, and taking out the trash.
* **Fairness Scoring & Streaks:** Track who actually completes their chores on time. Missed chores result in penalties or extra assignments to maintain perfect equity.

### 🍳 Meal & Inventory Management
* **Meal Calendar:** Track whose turn it is to cook, vote on meals, and allow roommates to opt-out ("I won't eat tonight") to adjust grocery splits accurately.
* **Smart Inventory:** Keep track of shared items (water jars, gas cylinders, detergent). Get low-stock alerts based on estimated consumption and track who bought it last.

### 📈 Analytics & AI (Coming Soon)
* **Fairness Dashboard:** Visualized charts (using Recharts) showing spending trends and household contribution scores.
* **AI Roommate Assistant:** AI-generated monthly summaries determining who contributed the most and smart categorization of expenses.

---

## 🛠️ Technical Architecture

This project is built with a modern full-stack architecture, utilizing Row Level Security (RLS) for robust data protection.

* **Frontend:** React, TypeScript, Tailwind CSS, Zustand (State Management), React Query (Data Fetching), Framer Motion (Animations).
* **Backend:** Node.js, Express.js.
* **Database:** PostgreSQL (via Supabase) with complex schema relationships, trigger functions, and optimized indexes.
* **Authentication:** Google OAuth & JWT Sessions via Supabase Auth.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* Supabase Account & CLI