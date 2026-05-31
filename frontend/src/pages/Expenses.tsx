import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Wallet,
  Calendar,
  Tag,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpenses, useAddExpense, useExpenseSummary } from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const categories = [
  { value: 'groceries', label: 'Groceries', icon: '🛒' },
  { value: 'utilities', label: 'Utilities', icon: '💡' },
  { value: 'rent', label: 'Rent', icon: '🏠' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'dining', label: 'Dining', icon: '🍽️' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'household', label: 'Household', icon: '🧹' },
  { value: 'other', label: 'Other', icon: '📦' },
];

const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6'];

export default function Expenses() {
  const { user, household, members } = useAuthStore();
  const { data: expenses, isLoading } = useExpenses();
  const { data: expenseSummary } = useExpenseSummary();
  const addExpense = useAddExpense();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('groceries');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const filteredExpenses = expenses?.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Chart data
  const chartData = expenses?.slice(0, 7).reverse().map((expense, index) => ({
    name: format(new Date(expense.created_at), 'MMM d'),
    amount: Number(expense.amount),
  })) || [];

  const categoryBreakdown = expenses?.reduce((acc, expense) => {
    const cat = expense.category || 'other';
    acc[cat] = (acc[cat] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleAddExpense = async () => {
    if (!amount || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!household) {
      toast.error('No household selected');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      let splits: { user_id: string; amount: number }[] = [];

      if (splitType === 'equal') {
        const splitAmount = amountNum / members.length;
        splits = members.map((member) => ({
          user_id: member.user_id,
          amount: splitAmount,
        }));
      } else {
        const totalSplit = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        if (Math.abs(totalSplit - amountNum) > 0.01) {
          toast.error('Split amounts must equal the total amount');
          return;
        }
        splits = Object.entries(customSplits)
          .filter(([_, value]) => value && parseFloat(value) > 0)
          .map(([userId, value]) => ({
            user_id: userId,
            amount: parseFloat(value),
          }));
      }

      await addExpense.mutateAsync({
        household_id: household.id,
        amount: amountNum,
        description,
        category,
        split_type: splitType,
        splits,
      });

      toast.success('Expense added successfully');
      setAddModalOpen(false);
      resetForm();
    } catch {
      toast.error('Failed to add expense');
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('groceries');
    setSplitType('equal');
    setSelectedMembers([]);
    setCustomSplits({});
  };

  return (
    <ScrollArea className="h-screen">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Expenses
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Track and manage shared expenses
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              onClick={() => setAddModalOpen(true)}
              className="bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </motion.div>
        </div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-sky-500 to-sky-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-sky-100">Total Spent</p>
                  <p className="text-2xl font-bold">
                    ${expenseSummary?.totalSpent.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-teal-100">You're Owed</p>
                  <p className="text-2xl font-bold">
                    ${Math.max(expenseSummary?.netBalance || 0, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-amber-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-orange-100">You Owe</p>
                  <p className="text-2xl font-bold">
                    ${Math.max(-(expenseSummary?.netBalance || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Spending Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorAmount2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorAmount2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    No expense data yet. Add your first expense!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Expenses List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
            <CardContent className="p-0">
              {filteredExpenses.length > 0 ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredExpenses.map((expense, index) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center text-xl',
                          'bg-slate-100 dark:bg-slate-700'
                        )}
                      >
                        {categories.find((c) => c.value === expense.category)?.icon || '📦'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {expense.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {expense.category}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          ${parseFloat(String(expense.amount)).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={expense.payer?.avatar_url} />
                            <AvatarFallback className="text-[8px]">
                              {getInitials(expense.payer?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-slate-500">
                            {expense.payer?.full_name}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <Wallet className="w-16 h-16 mb-4 text-slate-300" />
                  <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                    No expenses yet
                  </p>
                  <p className="text-sm">
                    {searchQuery
                      ? 'Try adjusting your search or filters'
                      : 'Add your first expense to get started'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Expense Modal */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Track a shared expense and split it with your household members.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What was this expense for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Split Type</Label>
                <Tabs value={splitType} onValueChange={(v) => setSplitType(v as 'equal' | 'custom')}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="equal">Split Equally</TabsTrigger>
                    <TabsTrigger value="custom">Custom Split</TabsTrigger>
                  </TabsList>

                  <TabsContent value="equal" className="pt-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Will be split equally among all {members.length} members ({members.length > 0 && amount && `$${(parseFloat(amount || '0') / members.length).toFixed(2)} each`})
                    </p>
                  </TabsContent>

                  <TabsContent value="custom" className="pt-4 space-y-3">
                    {members.map((member) => (
                      <div key={member.user_id} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.profile?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.profile?.full_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm">{member.profile?.full_name}</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={customSplits[member.user_id] || ''}
                          onChange={(e) =>
                            setCustomSplits((prev) => ({
                              ...prev,
                              [member.user_id]: e.target.value,
                            }))
                          }
                          className="w-24"
                        />
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddExpense}
                disabled={addExpense.isPending}
                className="bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white border-0"
              >
                {addExpense.isPending ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}
