export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  address: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface Expense {
  id: string;
  household_id: string;
  payer_id: string;
  amount: number;
  description: string;
  category: string;
  split_type: 'equal' | 'custom' | 'percentage';
  created_at: string;
  payer?: Profile;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  is_settled: boolean;
  settled_at: string | null;
  profile?: Profile;
}

export interface Loan {
  id: string;
  household_id: string;
  lender_id: string;
  borrower_id: string;
  amount: number;
  description: string;
  is_settled: boolean;
  settled_at: string | null;
  created_at: string;
  lender?: Profile;
  borrower?: Profile;
}

export interface Chore {
  id: string;
  household_id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  points: number;
  is_active: boolean;
}

export interface ChoreAssignment {
  id: string;
  chore_id: string;
  user_id: string;
  assigned_date: string;
  completed_at: string | null;
  streak_count: number;
  notes: string;
  chore?: Chore;
  profile?: Profile;
}

export interface Meal {
  id: string;
  household_id: string;
  date: string;
  chef_id: string;
  meal_name: string;
  notes: string;
  attendees: string[];
  created_at: string;
  chef?: Profile;
}

export interface InventoryItem {
  id: string;
  household_id: string;
  name: string;
  category: 'groceries' | 'supplies' | 'appliances';
  quantity: number;
  unit: string;
  min_quantity: number;
  last_purchased: string | null;
  purchased_by: string | null;
}

export interface ActivityLog {
  id: string;
  household_id: string;
  user_id: string;
  action_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  profile?: Profile;
}

export type Theme = 'light' | 'dark' | 'system';
