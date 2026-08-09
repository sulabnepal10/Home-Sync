/*
  # Meal voting

  Supports proposing 2-3 candidate meals for one slot and letting household
  members vote for a favorite. Candidates share a client-generated
  `poll_group_id`; a meal with no `poll_group_id` is a normal, non-voted meal
  (the existing behavior). `meal_votes` is a simple one-vote-per-user-per-meal
  table — the "winner" is just whichever candidate has the most votes,
  computed on read rather than a separate finalization step.
*/

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS poll_group_id uuid;

CREATE INDEX IF NOT EXISTS idx_meals_poll_group ON meals(poll_group_id) WHERE poll_group_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS meal_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(meal_id, user_id)
);

ALTER TABLE meal_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view meal votes"
  ON meal_votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      JOIN meals m ON m.household_id = hm.household_id
      WHERE m.id = meal_votes.meal_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can cast own vote"
  ON meal_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM household_members hm
      JOIN meals m ON m.household_id = hm.household_id
      WHERE m.id = meal_votes.meal_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove own vote"
  ON meal_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_meal_votes_meal ON meal_votes(meal_id);
