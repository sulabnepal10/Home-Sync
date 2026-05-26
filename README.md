## 📖 The Problem
Living with roommates often turns into a messy spreadsheet of "who owes who," missed chores, and passive-aggressive group chats about who bought the last water jar. As a student living with flatmates, I realized we needed a better way to divide rent, track daily expenses, and ensure household responsibilities were handled equally. 

**[Home Sync]** is a smart living management platform designed to automate fairness. It goes beyond simple expense tracking by introducing debt simplification algorithms, chore gamification, and smart inventory management.

---

## ✨ Key Features

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