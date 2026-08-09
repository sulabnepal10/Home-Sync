/*
  # Defense-in-depth RLS policies + new columns

  1. RLS
    - Several tables only ever got SELECT/INSERT policies in the initial
      migration (expenses, loans, meals, chores, expense_splits, and
      chore_assignments' DELETE). The backend API currently enforces all
      authorization itself using the Supabase *service-role* key, which
      bypasses RLS entirely — so these gaps aren't exploitable today. But
      if this project ever queries Supabase directly from a client using
      the anon key (a common pattern in this stack), default-deny RLS
      would silently block legitimate UPDATE/DELETE requests. This
      migration adds the missing policies so RLS mirrors what the
      controllers already enforce in application code.

  2. New columns
    - `meals.meal_time` — breakfast/lunch/dinner/snack, surfaced in the UI
      but previously not persisted anywhere.
    - `chore_assignments.missed_penalty_applied` / `is_penalty` — support
      lazy miss-detection: a missed assignment gets flagged once (so it's
      not re-penalized on every fetch) and its auto-generated replacement
      is marked so the UI can distinguish it from a normal assignment.
    - `profiles.notification_preferences` — previously only a client-side
      useState in Settings that reset on reload; now persisted per user.
*/

-- ============ Expenses ============

CREATE POLICY "Payer can update own expense"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = payer_id)
  WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Payer or admin can delete expense"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    auth.uid() = payer_id
    OR EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = expenses.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role = 'admin'
    )
  );

-- ============ Expense splits ============
-- Matches settleSplit: only the debtor can mark their own split settled.

CREATE POLICY "Debtor can update own expense split"
  ON expense_splits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============ Loans ============
-- Matches updateLoan/settleLoan/deleteLoan: lender-only.

CREATE POLICY "Lender can update own loan"
  ON loans FOR UPDATE
  TO authenticated
  USING (auth.uid() = lender_id)
  WITH CHECK (auth.uid() = lender_id);

CREATE POLICY "Lender can delete own loan"
  ON loans FOR DELETE
  TO authenticated
  USING (auth.uid() = lender_id);

-- ============ Meals ============
-- Matches join/leave (any member can update attendees) and
-- updateMeal (chef-only in application code); RLS models the broader
-- membership requirement, with authorship enforced by the controller.

CREATE POLICY "Household members can update meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = meals.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Chef or admin can delete meal"
  ON meals FOR DELETE
  TO authenticated
  USING (
    auth.uid() = chef_id
    OR EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = meals.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role = 'admin'
    )
  );

-- ============ Chores ============
-- Matches updateChore/deleteChore: any household member.

CREATE POLICY "Household members can update chores"
  ON chores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = chores.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can delete chores"
  ON chores FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = chores.household_id
      AND household_members.user_id = auth.uid()
    )
  );

-- ============ Chore assignments ============
-- The initial migration only added UPDATE (self-complete); deleteChoreAssignment
-- allows any household member, and assignment creation/miss-detection needs
-- INSERT from any member too (not just the assignee).

CREATE POLICY "Household members can create chore assignments"
  ON chore_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members hm
      JOIN chores c ON c.household_id = hm.household_id
      WHERE c.id = chore_assignments.chore_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can delete chore assignments"
  ON chore_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      JOIN chores c ON c.household_id = hm.household_id
      WHERE c.id = chore_assignments.chore_id
      AND hm.user_id = auth.uid()
    )
  );

-- ============ New columns ============

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS meal_time text NOT NULL DEFAULT 'dinner'
  CHECK (meal_time IN ('breakfast', 'lunch', 'dinner', 'snack'));

ALTER TABLE chore_assignments
  ADD COLUMN IF NOT EXISTS missed_penalty_applied boolean NOT NULL DEFAULT false;

ALTER TABLE chore_assignments
  ADD COLUMN IF NOT EXISTS is_penalty boolean NOT NULL DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT
  '{"expenses":true,"chores":true,"meals":true,"inventory":true,"push":true,"email":false}'::jsonb;
