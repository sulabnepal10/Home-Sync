import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Wallet,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
import { Checkbox } from '@/components/ui/checkbox';
import { useExpenses, useAddExpense, useExpenseSummary } from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { computeSplits } from '@/lib/splitCalculator';
import { RecurringBillsPanel } from '@/components/shared/RecurringBillsPanel';

/* ─── Fonts & Brand ─── */
function useFonts() {
  useEffect(() => {
    if (document.getElementById('homesync-fonts')) return;
    const link = document.createElement('link');
    link.id = 'homesync-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

const grainSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.07'/%3E%3C/svg%3E")`;

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

export default function Expenses() {
  useFonts();

  const { members, household } = useAuthStore();
  const { data: expenses, isLoading, isError } = useExpenses();
  const { data: expenseSummary } = useExpenseSummary();
  const addExpense = useAddExpense();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('groceries');
  const [splitType, setSplitType] = useState<'equal' | 'custom' | 'percentage'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [percentageSplits, setPercentageSplits] = useState<Record<string, string>>({});
  const [equalSplitMembers, setEqualSplitMembers] = useState<string[]>([]);

  const filteredExpenses = expenses?.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Chart data
  const chartData = expenses?.slice(0, 7).reverse().map((expense) => ({
    name: format(new Date(expense.created_at), 'MMM d'),
    amount: Number(expense.amount),
  })) || [];

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
    let splits: { user_id: string; amount: number }[] = [];
    let splitConfig: Record<string, number> | undefined;

    if (splitType === 'equal') {
      if (equalSplitMembers.length === 0) {
        toast.error('Select at least one person to split with');
        return;
      }
      splits = computeSplits(amountNum, 'equal', equalSplitMembers);
    } else if (splitType === 'percentage') {
      const sumPct = members.reduce((sum, m) => sum + (parseFloat(percentageSplits[m.user_id]) || 0), 0);
      if (Math.abs(sumPct - 100) > 0.5) {
        toast.error(`Percentages must add up to 100 (currently ${sumPct.toFixed(1)})`);
        return;
      }
      splitConfig = Object.fromEntries(members.map((m) => [m.user_id, parseFloat(percentageSplits[m.user_id]) || 0]));
      splits = computeSplits(amountNum, 'percentage', members.map((m) => m.user_id), splitConfig);
    } else {
      const totalSplit = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      if (Math.abs(totalSplit - amountNum) > 0.01) {
        toast.error('Split amounts must equal the total amount');
        return;
      }
      splits = Object.entries(customSplits)
        .filter(([, value]) => value && parseFloat(value) > 0)
        .map(([userId, value]) => ({
          user_id: userId,
          amount: parseFloat(value),
        }));
    }

    try {
      await addExpense.mutateAsync({
        household_id: household.id,
        amount: amountNum,
        description,
        category,
        split_type: splitType,
        splits,
        ...(splitConfig ? { split_config: splitConfig } : {}),
      });
      toast.success('Expense added successfully');
      setAddModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add expense');
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('groceries');
    setSplitType('equal');
    setCustomSplits({});
    setPercentageSplits({});
    setEqualSplitMembers(members.map((m) => m.user_id));
  };

  return (
    <ScrollArea className="h-screen bg-homesync-cream font-body text-homesync-ink relative">
      {/* Global Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[999] opacity-40 mix-blend-overlay"
        style={{ backgroundImage: grainSvg }}
        aria-hidden="true"
      />

      <div className="p-6 lg:p-10 max-w-[1200px] mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 border-b-2 border-homesync-sand pb-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-homesync-rust flex items-center gap-3 mb-3">
              <div className="w-8 h-[1.5px] bg-homesync-rust" />
              Shared Ledger
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-homesync-ink tracking-tight">
              Expenses
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Button
              onClick={() => {
                setEqualSplitMembers(members.map((m) => m.user_id));
                setAddModalOpen(true);
              }}
              className="rounded-none border-2 border-homesync-ink bg-homesync-ink text-homesync-cream hover:bg-homesync-rust hover:border-homesync-rust font-mono text-xs uppercase tracking-widest px-6 py-6 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Expense
            </Button>
          </motion.div>
        </div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-0 mb-12 border-t-2 border-l-2 border-homesync-sand"
        >
          {/* Card 1: Total Spent */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-rust text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center mb-8">
                <Wallet className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/70 mb-2">Total Spent</p>
              <p className="font-display text-4xl font-bold">
                ${expenseSummary?.totalSpent.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: You're Owed */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-olive text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center mb-8">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/70 mb-2">You're Owed</p>
              <p className="font-display text-4xl font-bold">
                ${Math.max(expenseSummary?.netBalance || 0, 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: You Owe */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-ink text-homesync-cream shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/20 flex items-center justify-center mb-8">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/50 mb-2">You Owe</p>
              <p className="font-display text-4xl font-bold">
                ${Math.max(-(expenseSummary?.netBalance || 0), 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <Card className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan shadow-none">
            <CardHeader className="border-b-2 border-homesync-sand pb-6">
              <CardTitle className="font-display text-2xl font-bold text-homesync-ink">
                Spending Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-72">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAmount2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--hs-rust))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--hs-rust))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--hs-tan))" vertical={false} />
                      <XAxis dataKey="name" stroke="hsl(var(--hs-muted))" fontSize={12} fontFamily="var(--ff-mono)" tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="hsl(var(--hs-muted))" fontSize={12} fontFamily="var(--ff-mono)" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--hs-cream))',
                          border: '2px solid hsl(var(--hs-ink))',
                          borderRadius: '0',
                          fontFamily: 'var(--ff-mono)',
                          fontSize: '12px',
                          textTransform: 'uppercase'
                        }}
                        itemStyle={{ color: 'hsl(var(--hs-ink))', fontWeight: 'bold' }}
                      />
                      <Area
                        type="step"
                        dataKey="amount"
                        stroke="hsl(var(--hs-rust))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorAmount2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center font-mono text-sm uppercase tracking-widest text-homesync-muted">
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-homesync-muted" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-body text-base h-12"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-64 rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus:ring-0 focus:border-homesync-ink h-12 font-mono text-xs uppercase tracking-widest">
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-3 text-homesync-muted" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-none border-2 border-homesync-ink font-mono text-xs uppercase tracking-widest bg-homesync-cream">
              <SelectItem value="all" className="focus:bg-homesync-tan rounded-none">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="focus:bg-homesync-tan rounded-none">
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
          <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none">
            <CardContent className="p-0">
              {isLoading ? (
                <LoadingState label="Loading expenses..." />
              ) : isError ? (
                <ErrorState message="Failed to load expenses. Please try again." />
              ) : filteredExpenses.length > 0 ? (
                <div className="divide-y-2 divide-homesync-sand bg-white dark:bg-homesync-tan">
                  {filteredExpenses.map((expense, index) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-5 p-5 hover:bg-homesync-cream transition-colors"
                    >
                      <div className="w-12 h-12 border-2 border-homesync-ink bg-homesync-tan flex items-center justify-center text-xl rounded-none">
                        {categories.find((c) => c.value === expense.category)?.icon || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-lg text-homesync-ink truncate">
                          {expense.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className="rounded-none bg-transparent border border-homesync-sand text-homesync-muted font-mono text-[10px] uppercase tracking-widest hover:bg-transparent">
                            {expense.category}
                          </Badge>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-homesync-sand">
                            {formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-xl text-homesync-ink">
                          ${parseFloat(String(expense.amount)).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 mt-2 justify-end">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted">
                            Paid by
                          </span>
                          <Avatar className="w-5 h-5 rounded-none border border-homesync-ink">
                            <AvatarImage src={expense.payer?.avatar_url} className="rounded-none" />
                            <AvatarFallback className="text-[8px] font-mono rounded-none bg-homesync-ink text-white">
                              {getInitials(expense.payer?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-none hover:bg-homesync-tan">
                            <MoreHorizontal className="w-5 h-5 text-homesync-ink" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-2 border-homesync-ink font-mono text-xs uppercase tracking-widest bg-homesync-cream p-0">
                          <DropdownMenuItem className="rounded-none focus:bg-homesync-tan p-3 cursor-pointer">
                            <Edit className="w-4 h-4 mr-3" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-homesync-ink m-0" />
                          <DropdownMenuItem className="rounded-none focus:bg-homesync-rust focus:text-white text-homesync-rust p-3 cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-3" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-homesync-muted bg-white dark:bg-homesync-tan border-2 border-dashed border-homesync-sand m-4">
                  <Wallet className="w-12 h-12 mb-4 text-homesync-sand opacity-50" />
                  <p className="font-display text-2xl font-bold text-homesync-ink mb-2">
                    No records found
                  </p>
                  <p className="font-mono text-xs uppercase tracking-widest text-homesync-muted">
                    {searchQuery
                      ? 'Adjust your search or filters'
                      : 'Add your first expense to get started'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="mt-12">
          <RecurringBillsPanel />
        </div>

        {/* Add Expense Modal */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="max-w-md rounded-none border-2 border-homesync-ink bg-homesync-cream p-0 shadow-[8px_8px_0px_rgba(26,18,9,1)]">
            <DialogHeader className="p-6 border-b-2 border-homesync-ink bg-homesync-tan">
              <DialogTitle className="font-display text-3xl font-black text-homesync-ink">Log Expense</DialogTitle>
              <DialogDescription className="font-body text-homesync-muted text-sm mt-2">
                Track a shared expense and split it with the household.
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="amount" className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-homesync-muted font-mono">$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-mono text-lg h-12"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Description</Label>
                <Input
                  id="description"
                  placeholder="What was this expense for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-body h-12"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus:ring-0 focus:border-homesync-ink h-12 font-body">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-homesync-ink bg-homesync-cream font-body">
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="focus:bg-homesync-tan rounded-none cursor-pointer">
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Split Strategy</Label>
                <Tabs value={splitType} onValueChange={(v) => setSplitType(v as 'equal' | 'custom' | 'percentage')}>
                  <TabsList className="grid grid-cols-3 bg-transparent border-2 border-homesync-ink rounded-none p-0 h-auto">
                    <TabsTrigger
                      value="equal"
                      className="rounded-none font-mono text-[10px] uppercase tracking-widest py-3 data-[state=active]:bg-homesync-ink data-[state=active]:text-white transition-none"
                    >
                      Equal
                    </TabsTrigger>
                    <TabsTrigger
                      value="percentage"
                      className="rounded-none font-mono text-[10px] uppercase tracking-widest py-3 data-[state=active]:bg-homesync-ink data-[state=active]:text-white transition-none"
                    >
                      Percentage
                    </TabsTrigger>
                    <TabsTrigger
                      value="custom"
                      className="rounded-none font-mono text-[10px] uppercase tracking-widest py-3 data-[state=active]:bg-homesync-ink data-[state=active]:text-white transition-none"
                    >
                      Custom
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="equal" className="pt-4 space-y-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted">
                      Only 2 people ate dinner? Uncheck who's not splitting this one.
                    </p>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                      {members.map((member) => (
                        <label
                          key={member.user_id}
                          className="flex items-center gap-3 bg-white dark:bg-homesync-tan border border-homesync-sand p-3 cursor-pointer"
                        >
                          <Checkbox
                            checked={equalSplitMembers.includes(member.user_id)}
                            onCheckedChange={(checked) =>
                              setEqualSplitMembers((prev) =>
                                checked
                                  ? [...prev, member.user_id]
                                  : prev.filter((id) => id !== member.user_id)
                              )
                            }
                            className="rounded-none border-2 border-homesync-ink data-[state=checked]:bg-homesync-ink"
                          />
                          <span className="flex-1 font-body text-sm font-bold text-homesync-ink truncate">
                            {member.profile?.full_name}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="bg-white dark:bg-homesync-tan border-2 border-homesync-sand p-4 text-sm font-mono text-homesync-muted">
                      Splitting equally among {equalSplitMembers.length} of {members.length} members.
                      <br />
                      <span className="text-homesync-ink font-bold mt-2 inline-block">
                        {equalSplitMembers.length > 0 && amount &&
                          `$${(parseFloat(amount || '0') / equalSplitMembers.length).toFixed(2)} per person`}
                      </span>
                    </div>
                  </TabsContent>

                  <TabsContent value="percentage" className="pt-4 space-y-3 max-h-[240px] overflow-y-auto pr-2">
                    {members.map((member) => (
                      <div key={member.user_id} className="flex items-center gap-3 bg-white dark:bg-homesync-tan border border-homesync-sand p-3">
                        <Avatar className="w-8 h-8 rounded-none border border-homesync-ink">
                          <AvatarImage src={member.profile?.avatar_url} className="rounded-none" />
                          <AvatarFallback className="text-[10px] font-mono rounded-none bg-homesync-tan text-homesync-ink">
                            {getInitials(member.profile?.full_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 font-body text-sm font-bold text-homesync-ink truncate">
                          {member.profile?.full_name}
                        </span>
                        <div className="relative w-20">
                          <Input
                            type="number"
                            step="1"
                            placeholder="0"
                            value={percentageSplits[member.user_id] || ''}
                            onChange={(e) =>
                              setPercentageSplits((prev) => ({
                                ...prev,
                                [member.user_id]: e.target.value,
                              }))
                            }
                            className="pr-6 rounded-none border-2 border-homesync-sand focus-visible:border-homesync-ink focus-visible:ring-0 font-mono text-sm h-9"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-homesync-muted font-mono text-xs">%</span>
                        </div>
                      </div>
                    ))}
                    <p className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted">
                      Total: {members.reduce((sum, m) => sum + (parseFloat(percentageSplits[m.user_id]) || 0), 0).toFixed(1)}% (must equal 100%)
                    </p>
                  </TabsContent>

                  <TabsContent value="custom" className="pt-4 space-y-3 max-h-[200px] overflow-y-auto pr-2">
                    {members.map((member) => (
                      <div key={member.user_id} className="flex items-center gap-3 bg-white dark:bg-homesync-tan border border-homesync-sand p-3">
                        <Avatar className="w-8 h-8 rounded-none border border-homesync-ink">
                          <AvatarImage src={member.profile?.avatar_url} className="rounded-none" />
                          <AvatarFallback className="text-[10px] font-mono rounded-none bg-homesync-tan text-homesync-ink">
                            {getInitials(member.profile?.full_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 font-body text-sm font-bold text-homesync-ink truncate">
                          {member.profile?.full_name}
                        </span>
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-homesync-muted font-mono text-xs">$</span>
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
                            className="pl-6 rounded-none border-2 border-homesync-sand focus-visible:border-homesync-ink focus-visible:ring-0 font-mono text-sm h-9"
                          />
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="p-6 border-t-2 border-homesync-ink bg-homesync-tan flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="rounded-none border-2 border-homesync-ink bg-transparent text-homesync-ink hover:bg-homesync-cream font-mono text-xs uppercase tracking-widest px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddExpense}
                disabled={addExpense.isPending}
                className="rounded-none border-2 border-homesync-ink bg-homesync-rust text-white hover:bg-homesync-bark font-mono text-xs uppercase tracking-widest px-6"
              >
                {addExpense.isPending ? 'Saving...' : 'Add Expense'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}