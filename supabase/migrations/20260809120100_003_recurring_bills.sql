/*
  # Recurring bills

  Adds `recurring_bills`, a template for auto-generating a real `expenses`
  row (+ splits) each time its `next_due_date` has passed. Generation
  itself is application logic (backend/src/services/recurringBillService.ts),
  triggered lazily whenever a household fetches its expenses or recurring
  bills list — this table only stores the template and scheduling state.
*/

CREATE TABLE IF NOT EXISTS recurring_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES profiles(id),
  description text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL DEFAULT 'other',
  split_type text NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom', 'percentage')),
  split_config jsonb,
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly')),
  day_of_month integer CHECK (day_of_month BETWEEN 1 AND 28),
  next_due_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_generated_expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view recurring bills"
  ON recurring_bills FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = recurring_bills.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create recurring bills"
  ON recurring_bills FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = recurring_bills.household_id
      AND household_members.user_id = auth.uid()
    ) AND auth.uid() = payer_id
  );

CREATE POLICY "Payer or admin can update recurring bill"
  ON recurring_bills FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = payer_id
    OR EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = recurring_bills.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role = 'admin'
    )
  );

CREATE POLICY "Payer or admin can delete recurring bill"
  ON recurring_bills FOR DELETE
  TO authenticated
  USING (
    auth.uid() = payer_id
    OR EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = recurring_bills.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_recurring_bills_household ON recurring_bills(household_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_next_due ON recurring_bills(next_due_date) WHERE is_active;
