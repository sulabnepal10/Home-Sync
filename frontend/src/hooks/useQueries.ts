import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  Expense,
  Loan,
  Meal,
  Chore,
  ChoreAssignment,
  InventoryItem,
  ActivityLog,
  Profile,
  Household,
  HouseholdMember,
  NotificationPreferences,
  RecurringBill,
} from '@/types';

// ============ Profile API ============

export function useProfile() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.get<Profile>('/api/profile'),
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      full_name?: string;
      avatar_url?: string;
      notification_preferences?: NotificationPreferences;
    }) => api.put<Profile>('/api/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ============ Household API ============

export function useHousehold() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['household'],
    queryFn: async () => {
      const result = await api.get<{ household: Household; members: HouseholdMember[] } | null>(
        '/api/household'
      );
      return result;
    },
    enabled: !!user,
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; address?: string }) =>
      api.post<Household>('/api/household', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household'] });
    },
  });
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) =>
      api.post<Household>('/api/household/join', { invite_code: inviteCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household'] });
    },
  });
}

export function useLeaveHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/api/household/leave'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ householdId, memberId }: { householdId: string; memberId: string }) =>
      api.delete(`/api/household/${householdId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household'] });
    },
  });
}

// ============ Expenses API ============

export function useExpenses(params?: {
  household_id?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const { household } = useAuthStore();

  return useQuery({
    queryKey: ['expenses', household?.id, params],
    queryFn: () => api.get<Expense[]>('/api/expenses', params as Record<string, string | number | boolean>),
    enabled: !!household?.id,
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => api.get<Expense>(`/api/expenses/${id}`),
    enabled: !!id,
  });
}

export function useExpenseSummary() {
  const { user, household } = useAuthStore();

  return useQuery({
    queryKey: ['expense-summary', household?.id, user?.id],
    queryFn: async () => {
      if (!household || !user) return { totalSpent: 0, totalOwed: 0, netBalance: 0 };

      // Fetch expenses and calculate summary on frontend
      const expenses = await api.get<Expense[]>('/api/expenses', {
        household_id: household.id,
      });

      let totalSpent = 0;
      let totalOwed = 0;

      expenses.forEach((expense) => {
        if (expense.payer_id === user.id) {
          totalSpent += Number(expense.amount);
        }
        expense.splits?.forEach((split) => {
          if (split.user_id === user.id && !split.is_settled) {
            totalOwed += Number(split.amount);
          }
        });
      });

      return {
        totalSpent,
        totalOwed,
        netBalance: totalSpent - totalOwed,
      };
    },
    enabled: !!household && !!user,
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expense: {
      household_id: string;
      amount: number;
      description: string;
      category: string;
      split_type: 'equal' | 'custom' | 'percentage';
      splits: { user_id: string; amount: number }[];
      split_config?: Record<string, number>;
    }) => api.post<Expense>('/api/expenses', expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; amount?: number; description?: string; category?: string }) =>
      api.put<Expense>(`/api/expenses/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useSettleExpenseSplit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, splitId }: { expenseId: string; splitId: string }) =>
      api.post(`/api/expenses/${expenseId}/splits/${splitId}/settle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
    },
  });
}

// ============ Loans API ============

export function useLoans(params?: { status?: 'all' | 'settled' | 'pending' }) {
  const { household } = useAuthStore();

  return useQuery({
    queryKey: ['loans', household?.id, params],
    queryFn: () => api.get<Loan[]>('/api/loans', params as Record<string, string | number | boolean>),
    enabled: !!household?.id,
  });
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface LoanBalances {
  balances: Record<string, { owed: number; lent: number; net: number }>;
  settlements: Settlement[];
}

export function useLoanBalances() {
  const { household } = useAuthStore();

  return useQuery({
    queryKey: ['loan-balances', household?.id],
    queryFn: () => api.get<LoanBalances>('/api/loans/balances'),
    enabled: !!household,
  });
}

export function useAddLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      household_id: string;
      borrower_id: string;
      amount: number;
      description: string;
    }) => api.post<Loan>('/api/loans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-balances'] });
    },
  });
}

export function useSettleLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post(`/api/loans/${id}/settle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-balances'] });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/loans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-balances'] });
    },
  });
}

// ============ Chores API ============

export function useChores() {
  const { household } = useAuthStore();

  return useQuery({
    queryKey: ['chores', household?.id],
    queryFn: () => api.get<Chore[]>('/api/chores', { is_active: true }),
    enabled: !!household?.id,
  });
}

export function useChoreAssignments(params?: { start_date?: string; end_date?: string }) {
  const { household } = useAuthStore();

  return useQuery({
    queryKey: ['chore-assignments', household?.id, params],
    queryFn: () =>
      api.get<ChoreAssignment[]>('/api/chore-assignments', params as Record<string, string | number | boolean>),
    enabled: !!household?.id,
  });
}

export function useCreateChore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      household_id: string;
      name: string;
      description?: string;
      frequency?: 'daily' | 'weekly' | 'monthly';
      points?: number;
    }) => api.post<Chore>('/api/chores', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
    },
  });
}

export function useCreateChoreAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { chore_id: string; user_id: string; assigned_date: string }) =>
      api.post<ChoreAssignment>('/api/chore-assignments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chore-assignments'] });
    },
  });
}

export function useCompleteChore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, notes }: { assignmentId: string; notes?: string }) =>
      api.post<ChoreAssignment>(`/api/chore-assignments/${assignmentId}/complete`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chore-assignments'] });
    },
  });
}

export function useDeleteChoreAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/chore-assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chore-assignments'] });
    },
  });
}

// ============ Meals API ============

export function useMeals(params?: { start_date?: string; end_date?: string }) {
  const { household } = useAuthStore();

  return useQuery({
    queryKey: ['meals', household?.id, params],
    queryFn: () =>
      api.get<Meal[]>('/api/meals', params as Record<string, string | number | boolean>),
    enabled: !!household?.id,
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      household_id: string;
      date: string;
      meal_name: string;
      notes?: string;
      attendees?: string[];
      meal_time?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      poll_group_id?: string;
    }) => api.post<Meal>('/api/meals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      meal_name?: string;
      notes?: string;
      date?: string;
      attendees?: string[];
      meal_time?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    }) => api.put<Meal>(`/api/meals/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/meals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useJoinMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<Meal>(`/api/meals/${id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useLeaveMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<Meal>(`/api/meals/${id}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useVoteMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ meal_id: string; vote_count: number; voted_by_me: boolean }>(`/api/meals/${id}/vote`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

// ============ Inventory API ============

export function useInventory(params?: { category?: string }) {
  const { household } = useAuthStore();

  return useQuery({
    queryKey: ['inventory', household?.id, params],
    queryFn: () =>
      api.get<InventoryItem[]>('/api/inventory', params as Record<string, string | number | boolean>),
    enabled: !!household?.id,
  });
}

export function useLowStockItems() {
  const { household } = useAuthStore();

  return useQuery({
    queryKey: ['low-stock', household?.id],
    queryFn: () =>
      api.get<InventoryItem[]>('/api/inventory', { low_stock: true }),
    enabled: !!household?.id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      household_id: string;
      name: string;
      category?: 'groceries' | 'supplies' | 'appliances';
      quantity: number;
      unit?: string;
      min_quantity?: number;
    }) => api.post<InventoryItem>('/api/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      name?: string;
      category?: string;
      quantity?: number;
      unit?: string;
      min_quantity?: number;
    }) => api.put<InventoryItem>(`/api/inventory/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
    },
  });
}

export function useRestockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; quantity: number }) =>
      api.post<InventoryItem>(`/api/inventory/${data.id}/restock`, { quantity: data.quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
    },
  });
}

// ============ Recurring Bills API ============

export function useRecurringBills() {
  const { household } = useAuthStore();

  return useQuery({
    queryKey: ['recurring-bills', household?.id],
    queryFn: () => api.get<RecurringBill[]>('/api/recurring-bills'),
    enabled: !!household?.id,
  });
}

export function useCreateRecurringBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      household_id: string;
      description: string;
      amount: number;
      category?: string;
      split_type?: 'equal' | 'custom' | 'percentage';
      frequency?: 'weekly' | 'monthly';
      next_due_date: string;
    }) => api.post<RecurringBill>('/api/recurring-bills', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useUpdateRecurringBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; is_active?: boolean; description?: string; amount?: number }) =>
      api.put<RecurringBill>(`/api/recurring-bills/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] });
    },
  });
}

export function useDeleteRecurringBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/recurring-bills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] });
    },
  });
}

// ============ Activity Log API ============

export function useActivityLog() {
  const { household } = useAuthStore();

  return useQuery({
    queryKey: ['activity', household?.id],
    queryFn: () => api.get<ActivityLog[]>('/api/activity'),
    enabled: !!household?.id,
  });
}
