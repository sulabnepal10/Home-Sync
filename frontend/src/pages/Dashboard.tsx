import { motion } from 'framer-motion';
import { useFonts } from '@/hooks/useFonts';
import { GrainOverlay } from '@/components/shared/GrainOverlay';
import {
  Wallet,
  CheckSquare,
  UtensilsCrossed,
  Package,
  TrendingUp,
  Calendar,
  Bell,
  ArrowRight,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useExpenses,
  useExpenseSummary,
  useActivityLog,
  useLowStockItems,
  useChoreAssignments,
  useMeals
} from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDistanceToNow, format, isToday } from 'date-fns';
import { Link } from 'react-router-dom';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';



// Updated to match HomeSync Brand Colors
// hsl(var(--hs-*)) rather than literal hex so the pie chart's segment
// colors follow the theme instead of staying fixed under dark mode.
const COLORS = [
  'hsl(var(--hs-rust))',
  'hsl(var(--hs-olive))',
  'hsl(var(--hs-ink))',
  'hsl(var(--hs-muted))',
  'hsl(var(--hs-sand))',
  'hsl(var(--hs-bark))',
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  useFonts();

  const { user, members } = useAuthStore();
  const { data: expenses, isLoading: expensesLoading, isError: expensesError } = useExpenses();
  const { data: expenseSummary } = useExpenseSummary();
  const { data: activities } = useActivityLog();
  const { data: lowStockItems } = useLowStockItems();
  const { data: choreAssignments, isLoading: choresLoading, isError: choresError } = useChoreAssignments();
  const { data: meals, isLoading: mealsLoading, isError: mealsError } = useMeals();

  const isLoading = expensesLoading || choresLoading || mealsLoading;
  const isError = expensesError || choresError || mealsError;

  const upcomingMeals = meals?.filter((meal) => new Date(meal.date) >= new Date()) || [];
  const todaysMeals = upcomingMeals.filter((meal) => isToday(new Date(meal.date)));

  // Calculate monthly expense data for chart
  const expenseChartData = expenses?.slice(0, 7).reverse().map((expense) => ({
    name: format(new Date(expense.created_at), 'MMM d'),
    amount: Number(expense.amount),
  })) || [];

  // Calculate category breakdown
  const categoryData = expenses?.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    const existing = acc.find((c) => c.name === category);
    if (existing) {
      existing.value += Number(expense.amount);
    } else {
      acc.push({ name: category, value: Number(expense.amount) });
    }
    return acc;
  }, [] as { name: string; value: number }[]) || [];

  // Get today's chores
  const todayChores = choreAssignments?.filter((assignment) =>
    isToday(new Date(assignment.assigned_date))
  ) || [];

  // Get incomplete chores
  const incompleteChores = todayChores.filter((assignment) => !assignment.completed_at);

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const currentHour = new Date().getHours();
  const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening';

  return (
    <ScrollArea className="h-screen bg-homesync-cream font-body text-homesync-ink relative">
      <GrainOverlay />

      <div className="p-6 lg:p-10 max-w-[1200px] mx-auto relative z-10">

        {/* Header */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b-2 border-homesync-sand pb-6"
          >
            <div>
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-homesync-rust flex items-center gap-3 mb-3">
                <div className="w-8 h-[1.5px] bg-homesync-rust" />
                Dashboard Overview
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-black text-homesync-ink tracking-tight">
                Good {timeOfDay}, <br /><em className="italic text-homesync-rust">{user?.full_name?.split(' ')[0] || 'there'}.</em>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                aria-label="Notifications"
                className="relative rounded-none border-2 border-homesync-sand bg-transparent hover:bg-homesync-tan hover:border-homesync-ink transition-colors h-12 w-12"
              >
                <Bell className="w-5 h-5 text-homesync-ink" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-homesync-rust rounded-none" />
              </Button>
            </div>
          </motion.div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading your dashboard..." />
        ) : isError ? (
          <ErrorState message="Failed to load dashboard data. Please try again." />
        ) : (
        <>
        {/* Summary Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 mb-12 border-t-2 border-l-2 border-homesync-sand"
        >
          {/* Card 1: Expenses */}
          <motion.div variants={item}>
            <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-rust text-white shadow-none h-full transition-transform hover:bg-homesync-bark">
              <CardContent className="p-6 sm:p-8 relative">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <Badge className="font-mono text-[10px] tracking-widest uppercase bg-transparent border border-white/30 text-white rounded-none hover:bg-white/10">
                    This Month
                  </Badge>
                </div>
                <p className="font-mono text-xs tracking-widest uppercase text-white/70 mb-2">Total Spent</p>
                <p className="font-display text-4xl font-bold mb-4">
                  ${expenseSummary?.totalSpent.toFixed(2) || '0.00'}
                </p>
                <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-white/80 border-t border-white/20 pt-4">
                  <TrendingUp className="w-4 h-4" />
                  <span>${expenseSummary?.totalOwed.toFixed(2) || '0.00'} to settle</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Chores */}
          <motion.div variants={item}>
            <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-olive text-white shadow-none h-full transition-colors hover:bg-homesync-bark">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <Badge className="font-mono text-[10px] tracking-widest uppercase bg-transparent border border-white/30 text-white rounded-none hover:bg-white/10">
                    Today
                  </Badge>
                </div>
                <p className="font-mono text-xs tracking-widest uppercase text-white/70 mb-2">Chores Done</p>
                <p className="font-display text-4xl font-bold mb-4">
                  {todayChores.length - incompleteChores.length} <span className="text-2xl text-white/50">/ {todayChores.length}</span>
                </p>
                <p className="font-mono text-[11px] tracking-wider text-white/80 border-t border-white/20 pt-4">
                  {incompleteChores.length} remaining
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3: Meals */}
          <motion.div variants={item}>
            <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-white dark:bg-homesync-tan text-homesync-ink shadow-none h-full transition-colors hover:bg-homesync-tan">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 border-2 border-homesync-ink flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <Badge className="font-mono text-[10px] tracking-widest uppercase bg-homesync-ink text-homesync-cream rounded-none hover:bg-homesync-bark">
                    Upcoming
                  </Badge>
                </div>
                <p className="font-mono text-xs tracking-widest uppercase text-homesync-muted mb-2">Meals Planned</p>
                <p className="font-display text-4xl font-bold mb-4">{upcomingMeals.length}</p>
                <p className="font-mono text-[11px] tracking-wider text-homesync-muted border-t border-homesync-sand pt-4 truncate">
                  {todaysMeals.length > 0
                    ? `Today: ${todaysMeals[0].meal_name}`
                    : 'No meals planned for today'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 4: Alerts */}
          <motion.div variants={item}>
            <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-ink text-homesync-cream shadow-none h-full transition-colors hover:bg-homesync-bark">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 border-2 border-white/20 flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <Badge className="font-mono text-[10px] tracking-widest uppercase bg-homesync-rust text-white rounded-none border-none">
                    Alert
                  </Badge>
                </div>
                <p className="font-mono text-xs tracking-widest uppercase text-white/50 mb-2">Low Stock</p>
                <p className="font-display text-4xl font-bold mb-4">{lowStockItems?.length || 0}</p>
                <p className="font-mono text-[11px] tracking-wider text-white/50 border-t border-white/10 pt-4">
                  Items need restocking
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Expense Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan shadow-none h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b-2 border-homesync-sand">
                <CardTitle className="font-display text-2xl font-bold text-homesync-ink">
                  Expense Trend
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="rounded-none font-mono text-xs uppercase tracking-widest hover:bg-homesync-tan">
                  <Link to="/expenses">
                    View All
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-72">
                  {expenseChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={expenseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--hs-rust))" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="hsl(var(--hs-rust))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--hs-tan))" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--hs-muted))" fontSize={12} fontFamily="var(--ff-mono)" tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="hsl(var(--hs-muted))" fontSize={12} fontFamily="var(--ff-mono)" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
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
                          fill="url(#colorAmount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center font-mono text-sm uppercase tracking-widest text-homesync-muted">
                      No expense data yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan shadow-none h-full">
              <CardHeader className="pb-6 border-b-2 border-homesync-sand">
                <CardTitle className="font-display text-2xl font-bold text-homesync-ink">
                  Spending Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-48 mb-6">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--hs-ink))',
                            border: 'none',
                            borderRadius: '0',
                            fontFamily: 'var(--ff-mono)',
                            fontSize: '12px',
                            color: 'hsl(var(--hs-cream))'
                          }}
                          itemStyle={{ color: 'hsl(var(--hs-cream))' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center font-mono text-sm uppercase tracking-widest text-homesync-muted">
                      No data yet
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {categoryData.slice(0, 4).map((cat, index) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm border-b border-homesync-sand pb-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-none"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-mono text-xs uppercase tracking-widest text-homesync-ink">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-homesync-ink">
                        ${cat.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">

          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b-2 border-homesync-sand bg-homesync-tan">
                <CardTitle className="font-display text-2xl font-bold text-homesync-ink">
                  Today's Ledger
                </CardTitle>
                <Calendar className="w-5 h-5 text-homesync-rust" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y-2 divide-homesync-sand">
                  {todayChores.length > 0 ? (
                    todayChores.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-4 p-5 bg-white dark:bg-homesync-tan transition-colors hover:bg-homesync-cream"
                      >
                        <div
                          className={`w-2 h-12 rounded-none ${assignment.completed_at
                            ? 'bg-homesync-olive'
                            : 'bg-homesync-rust'
                            }`}
                        />
                        <div className="flex-1">
                          <p className="font-display text-lg font-bold text-homesync-ink">
                            {assignment.chore?.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <Avatar className="w-6 h-6 rounded-none border border-homesync-ink">
                              <AvatarImage src={assignment.profile?.avatar_url} className="rounded-none" />
                              <AvatarFallback className="text-[10px] rounded-none bg-homesync-tan text-homesync-ink font-mono">
                                {getInitials(assignment.profile?.full_name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted">
                              {assignment.profile?.full_name}
                            </span>
                          </div>
                        </div>
                        {assignment.completed_at ? (
                          <Badge className="font-mono text-[10px] tracking-widest uppercase bg-homesync-olive text-white rounded-none border-none">
                            Done
                          </Badge>
                        ) : (
                          <Badge className="font-mono text-[10px] tracking-widest uppercase bg-transparent border-2 border-homesync-rust text-homesync-rust rounded-none">
                            Pending
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 font-mono text-sm uppercase tracking-widest text-homesync-muted bg-white dark:bg-homesync-tan">
                      No chores scheduled for today
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b-2 border-homesync-sand bg-homesync-tan">
                <CardTitle className="font-display text-2xl font-bold text-homesync-ink">
                  Recent Activity
                </CardTitle>
                <Activity className="w-5 h-5 text-homesync-rust" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y-2 divide-homesync-sand max-h-[350px] overflow-y-auto bg-white dark:bg-homesync-tan">
                  {activities && activities.length > 0 ? (
                    activities.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-5">
                        <Avatar className="w-10 h-10 rounded-none border-2 border-homesync-ink">
                          <AvatarImage src={activity.profile?.avatar_url} className="rounded-none" />
                          <AvatarFallback className="text-xs rounded-none bg-homesync-ink text-homesync-cream font-mono">
                            {getInitials(activity.profile?.full_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 pt-1">
                          <p className="text-sm text-homesync-ink leading-relaxed">
                            <span className="font-bold font-display">{activity.profile?.full_name}</span>{' '}
                            <span className="text-homesync-muted">{activity.description}</span>
                          </p>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-homesync-sand mt-2">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 font-mono text-sm uppercase tracking-widest text-homesync-muted">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Household Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pb-12"
        >
          <Card className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b-2 border-homesync-sand">
              <CardTitle className="font-display text-2xl font-bold text-homesync-ink">
                Household Roster
              </CardTitle>
              <Badge className="font-mono text-[10px] tracking-widest uppercase bg-transparent border-2 border-homesync-ink text-homesync-ink rounded-none">
                {members.length} members
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 border-2 border-homesync-sand bg-homesync-cream transition-colors hover:border-homesync-ink min-w-[200px]"
                  >
                    <Avatar className="rounded-none border border-homesync-ink w-12 h-12">
                      <AvatarImage src={member.profile?.avatar_url} className="rounded-none" />
                      <AvatarFallback className="rounded-none bg-homesync-bark text-white font-mono text-sm">
                        {getInitials(member.profile?.full_name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-display font-bold text-homesync-ink text-lg leading-none mb-1">
                        {member.profile?.full_name}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        </>
        )}

      </div>
    </ScrollArea>
  );
}