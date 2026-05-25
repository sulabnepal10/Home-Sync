import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowLeftRight,
  CheckSquare,
  UtensilsCrossed,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell,
  ArrowRight,
  Activity,
  Droplets,
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
} from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDistanceToNow, format, isToday, isTomorrow } from 'date-fns';
import { Link } from 'react-router-dom';

const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6'];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user, household, members } = useAuthStore();
  const { data: expenses } = useExpenses();
  const { data: expenseSummary } = useExpenseSummary();
  const { data: activities } = useActivityLog();
  const { data: lowStockItems } = useLowStockItems();
  const { data: choreAssignments } = useChoreAssignments();

  // Calculate monthly expense data for chart
  const expenseChartData = expenses?.slice(0, 7).reverse().map((expense, index) => ({
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
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ScrollArea className="h-screen">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
                {user?.full_name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Here's what's happening in your household
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Summary Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={item}>
            <Card className="bg-gradient-to-br from-sky-500 to-sky-600 border-0 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <Badge className="bg-white/20 border-0 text-white hover:bg-white/30">
                    This Month
                  </Badge>
                </div>
                <p className="text-sm text-sky-100 mb-1">Total Spent</p>
                <p className="text-3xl font-bold">
                  ${expenseSummary?.totalSpent.toFixed(2) || '0.00'}
                </p>
                <div className="flex items-center gap-1 mt-2 text-sm text-sky-100">
                  <TrendingUp className="w-4 h-4" />
                  <span>${expenseSummary?.totalOwed.toFixed(2) || '0.00'} to settle</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 border-0 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <Badge className="bg-white/20 border-0 text-white hover:bg-white/30">
                    Today
                  </Badge>
                </div>
                <p className="text-sm text-teal-100 mb-1">Chores</p>
                <p className="text-3xl font-bold">
                  {todayChores.length - incompleteChores.length}/{todayChores.length}
                </p>
                <p className="text-sm text-teal-100 mt-2">
                  {incompleteChores.length} remaining
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-gradient-to-br from-orange-500 to-amber-600 border-0 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <Badge className="bg-white/20 border-0 text-white hover:bg-white/30">
                    Upcoming
                  </Badge>
                </div>
                <p className="text-sm text-orange-100 mb-1">Meals Planned</p>
                <p className="text-3xl font-bold">3</p>
                <p className="text-sm text-orange-100 mt-2">Today's meal at 7 PM</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-gradient-to-br from-rose-500 to-pink-600 border-0 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <Badge className="bg-white/20 border-0 text-white hover:bg-white/30">
                    Alert
                  </Badge>
                </div>
                <p className="text-sm text-rose-100 mb-1">Low Stock Items</p>
                <p className="text-3xl font-bold">{lowStockItems?.length || 0}</p>
                <p className="text-sm text-rose-100 mt-2">Need restocking</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Expense Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  Expense Trend
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/expenses">
                    View All
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {expenseChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={expenseChartData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
                          fill="url(#colorAmount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
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
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      No data yet
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  {categoryData.slice(0, 4).map((cat, index) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-slate-600 dark:text-slate-400 capitalize">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">
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
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  Today's Schedule
                </CardTitle>
                <Calendar className="w-5 h-5 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayChores.length > 0 ? (
                    todayChores.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900"
                      >
                        <div
                          className={`w-2 h-12 rounded-full ${
                            assignment.completed_at
                              ? 'bg-gradient-to-b from-teal-500 to-emerald-500'
                              : 'bg-gradient-to-b from-orange-500 to-amber-500'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {assignment.chore?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={assignment.profile?.avatar_url} />
                              <AvatarFallback className="text-[8px]">
                                {getInitials(assignment.profile?.full_name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-slate-500">
                              {assignment.profile?.full_name}
                            </span>
                          </div>
                        </div>
                        {assignment.completed_at ? (
                          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-0">
                            Done
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0">
                            Pending
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
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
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  Recent Activity
                </CardTitle>
                <Activity className="w-5 h-5 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {activities && activities.length > 0 ? (
                    activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={activity.profile?.avatar_url} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-sky-500 to-teal-500 text-white">
                            {getInitials(activity.profile?.full_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm text-slate-900 dark:text-white">
                            <span className="font-medium">{activity.profile?.full_name}</span>{' '}
                            {activity.description}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
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
          className="mt-6"
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Household Members
              </CardTitle>
              <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-0">
                {members.length} members
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900"
                  >
                    <Avatar>
                      <AvatarImage src={member.profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-sky-500 to-teal-500 text-white">
                        {getInitials(member.profile?.full_name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {member.profile?.full_name}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  );
}
