/*
  # Roommate Platform Initial Schema

  This migration creates the foundational database schema for the roommate management platform.
  
  1. New Tables
    - `profiles` - User profiles extending auth.users
      - `id` (uuid, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
    
    - `households` - Shared living spaces/groups
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `invite_code` (text, unique)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
    
    - `household_members` - Membership between users and households
      - `id` (uuid, primary key)
      - `household_id` (uuid, references households)
      - `user_id` (uuid, references profiles)
      - `role` (text: 'admin', 'member')
      - `joined_at` (timestamp)
    
    - `expenses` - Shared expense tracking
      - `id` (uuid, primary key)
      - `household_id` (uuid, references households)
      - `payer_id` (uuid, references profiles)
      - `amount` (decimal)
      - `description` (text)
      - `category` (text)
      - `split_type` (text: 'equal', 'custom', 'percentage')
      - `created_at` (timestamp)
    
    - `expense_splits` - How expenses are divided
      - `id` (uuid, primary key)
      - `expense_id` (uuid, references expenses)
      - `user_id` (uuid, references profiles)
      - `amount` (decimal)
      - `is_settled` (boolean)
      - `settled_at` (timestamp)
    
    - `loans` - Debt/loan tracking between members
      - `id` (uuid, primary key)
      - `household_id` (uuid, references households)
      - `lender_id` (uuid, references profiles)
      - `borrower_id` (uuid, references profiles)
      - `amount` (decimal)
      - `description` (text)
      - `is_settled` (boolean)
      - `settled_at` (timestamp)
      - `created_at` (timestamp)
    
    - `chores` - Task definitions
      - `id` (uuid, primary key)
      - `household_id` (uuid, references households)
      - `name` (text)
      - `description` (text)
      - `frequency` (text: 'daily', 'weekly', 'monthly')
      - `points` (integer)
    
    - `chore_assignments` - Task rotation assignments
      - `id` (uuid, primary key)
      - `chore_id` (uuid, references chores)
      - `user_id` (uuid, references profiles)
      - `assigned_date` (date)
      - `completed_at` (timestamp)
      - `streak_count` (integer)
    
    - `meals` - Cooking schedule
      - `id` (uuid, primary key)
      - `household_id` (uuid, references households)
      - `date` (date)
      - `chef_id` (uuid, references profiles)
      - `meal_name` (text)
      - `notes` (text)
      - `attendees` (uuid array)
      - `created_at` (timestamp)
    
    - `inventory_items` - Shared items tracking
      - `id` (uuid, primary key)
      - `household_id` (uuid, references households)
      - `name` (text)
      - `category` (text: 'groceries', 'supplies', 'appliances')
      - `quantity` (integer)
      - `unit` (text)
      - `min_quantity` (integer)
      - `last_purchased` (timestamp)
      - `purchased_by` (uuid, references profiles)
    
    - `activity_log` - Activity timeline
      - `id` (uuid, primary key)
      - `household_id` (uuid, references households)
      - `user_id` (uuid, references profiles)
      - `action_type` (text)
      - `description` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Policies ensure users can only access data from their households
    - All tables track ownership and timestamps
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create households table
CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text DEFAULT '',
  invite_code text UNIQUE DEFAULT upper(substr(gen_random_uuid()::text, 1, 8)),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create household_members table
CREATE TABLE IF NOT EXISTS household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES profiles(id),
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  split_type text NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom', 'percentage')),
  created_at timestamptz DEFAULT now()
);

-- Create expense_splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  is_settled boolean DEFAULT false,
  settled_at timestamptz,
  UNIQUE(expense_id, user_id)
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  lender_id uuid NOT NULL REFERENCES profiles(id),
  borrower_id uuid NOT NULL REFERENCES profiles(id),
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  description text NOT NULL,
  is_settled boolean DEFAULT false,
  settled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CHECK (lender_id != borrower_id)
);

-- Create chores table
CREATE TABLE IF NOT EXISTS chores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  frequency text NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  points integer DEFAULT 10,
  is_active boolean DEFAULT true
);

-- Create chore_assignments table
CREATE TABLE IF NOT EXISTS chore_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id uuid NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  assigned_date date NOT NULL,
  completed_at timestamptz,
  streak_count integer DEFAULT 0,
  notes text DEFAULT '',
  UNIQUE(chore_id, assigned_date)
);

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  date date NOT NULL,
  chef_id uuid NOT NULL REFERENCES profiles(id),
  meal_name text NOT NULL,
  notes text DEFAULT '',
  attendees uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'groceries' CHECK (category IN ('groceries', 'supplies', 'appliances')),
  quantity integer NOT NULL DEFAULT 0,
  unit text DEFAULT 'units',
  min_quantity integer DEFAULT 1,
  last_purchased timestamptz,
  purchased_by uuid REFERENCES profiles(id)
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  action_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Household members policies (helper: user is member of household)
CREATE POLICY "Household members can view household"
  ON households FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = households.id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household admins can update household"
  ON households FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = households.id
      AND household_members.user_id = auth.uid()
      AND household_members.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create household"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Household members policies
CREATE POLICY "Household members can view membership"
  ON household_members FOR SELECT
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Household admins can manage membership"
  ON household_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'admin'
    )
  );

-- Expenses policies
CREATE POLICY "Household members can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = expenses.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = expenses.household_id
      AND household_members.user_id = auth.uid()
    ) AND auth.uid() = payer_id
  );

-- Expense splits policies
CREATE POLICY "Users can view their expense splits"
  ON expense_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      JOIN expenses e ON e.household_id = hm.household_id
      WHERE e.id = expense_splits.expense_id
      AND hm.user_id = auth.uid()
    )
  );

-- Loans policies
CREATE POLICY "Household members can view loans"
  ON loans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = loans.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = loans.household_id
      AND household_members.user_id = auth.uid()
    ) AND (auth.uid() = lender_id OR auth.uid() = borrower_id)
  );

-- Chores policies
CREATE POLICY "Household members can view chores"
  ON chores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = chores.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create chores"
  ON chores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = chores.household_id
      AND household_members.user_id = auth.uid()
    )
  );

-- Chore assignments policies
CREATE POLICY "Household members can view chore assignments"
  ON chore_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      JOIN chores c ON c.household_id = hm.household_id
      WHERE c.id = chore_assignments.chore_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can complete own chore assignments"
  ON chore_assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Meals policies
CREATE POLICY "Household members can view meals"
  ON meals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = meals.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = meals.household_id
      AND household_members.user_id = auth.uid()
    ) AND auth.uid() = chef_id
  );

-- Inventory policies
CREATE POLICY "Household members can view inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = inventory_items.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can manage inventory"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = inventory_items.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can update inventory"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = inventory_items.household_id
      AND household_members.user_id = auth.uid()
    )
  );

-- Activity log policies
CREATE POLICY "Household members can view activity"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = activity_log.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create activity"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = activity_log.household_id
      AND household_members.user_id = auth.uid()
    ) AND auth.uid() = user_id
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_expenses_household ON expenses(household_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_loans_household ON loans(household_id);
CREATE INDEX IF NOT EXISTS idx_chores_household ON chores(household_id);
CREATE INDEX IF NOT EXISTS idx_chore_assignments_chore ON chore_assignments(chore_id);
CREATE INDEX IF NOT EXISTS idx_meals_household ON meals(household_id);
CREATE INDEX IF NOT EXISTS idx_inventory_household ON inventory_items(household_id);
CREATE INDEX IF NOT EXISTS idx_activity_household ON activity_log(household_id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
