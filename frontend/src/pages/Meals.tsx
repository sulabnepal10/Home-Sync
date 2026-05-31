import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  Calendar,
  Plus,
  ChefHat,
  Users,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight, Trash2
} from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  useMeals,
  useCreateMeal,
  useJoinMeal,
  useLeaveMeal,
  useDeleteMeal
} from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { format, startOfWeek, addDays, isToday, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const mealTimes = [
  { value: 'breakfast', label: 'Breakfast', time: '8:00 AM' },
  { value: 'lunch', label: 'Lunch', time: '12:00 PM' },
  { value: 'dinner', label: 'Dinner', time: '7:00 PM' },
];

const mealIdeas = [
  'Pasta Carbonara',
  'Chicken Stir Fry',
  'Tacos Night',
  'Homemade Pizza',
  'Grilled Salmon with Vegetables',
  'Vegetable Curry',
  'Burger Night',
  'Sushi Making',
];

export default function Meals() {
  const { user, members, household } = useAuthStore();
  const { data: meals, isLoading } = useMeals();
  const createMeal = useCreateMeal();
  const joinMeal = useJoinMeal();
  const leaveMeal = useLeaveMeal();
  const deleteMeal = useDeleteMeal();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [addMealModalOpen, setAddMealModalOpen] = useState(false);

  const [mealName, setMealName] = useState('');
  const [mealDate, setMealDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealTime, setMealTime] = useState('dinner');
  const [notes, setNotes] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // Get week days
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Today's meal
  const todayMeals = meals?.filter((meal) =>
    isToday(parseISO(meal.date))
  ) || [];

  // Upcoming meals this week
  const upcomingMeals = meals?.filter((meal) => {
    const mealDate = parseISO(meal.date);
    return mealDate >= new Date() && mealDate <= addDays(new Date(), 7);
  }) || [];

  return (
    <ScrollArea className="h-screen">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Meal Planner
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Plan and coordinate meals with your roommates
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Button
              onClick={() => setAddMealModalOpen(true)}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Plan Meal
            </Button>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-rose-500 to-pink-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-rose-100">Your Turn</p>
                  <p className="text-2xl font-bold">Tomorrow</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-amber-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-orange-100">Today's Meals</p>
                  <p className="text-2xl font-bold">{todayMeals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-teal-100">This Week</p>
                  <p className="text-2xl font-bold">{upcomingMeals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Week Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Week of {format(weekStart, 'MMM d, yyyy')}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Weekly Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
            <CardContent className="p-0">
              <div className="grid grid-cols-7">
                {weekDays.map((day) => {
                  const dayMeals = meals?.filter((meal) =>
                    isSameDay(parseISO(meal.date), day)
                  ) || [];

                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[180px]',
                        isCurrentDay && 'bg-rose-50 dark:bg-rose-900/10'
                      )}
                    >
                      <div
                        className={cn(
                          'text-center py-3 border-b border-slate-200 dark:border-slate-700 font-medium',
                          isCurrentDay && 'text-rose-600 dark:text-rose-400'
                        )}
                      >
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {format(day, 'EEE')}
                        </p>
                        <p className={cn('text-lg', isCurrentDay && 'font-bold')}>
                          {format(day, 'd')}
                        </p>
                      </div>

                      <div className="p-2 space-y-2">
                        {dayMeals.length > 0 ? (
                          dayMeals.map((meal) => (
                            <motion.div
                              key={meal.id}
                              whileHover={{ scale: 1.02 }}
                              className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-sm"
                            >
                              <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 mb-1">
                                <ChefHat className="w-3 h-3" />
                                <span className="text-xs font-medium">
                                  {meal.chef?.full_name}
                                </span>
                              </div>
                              <p className="font-medium text-slate-900 dark:text-white truncate">
                                {meal.meal_name}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                <Users className="w-3 h-3" />
                                <span>{meal.attendees?.length || 0} attending</span>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-xs text-center text-slate-400 py-4">
                            No meals planned
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Meals Detail */}
        {todayMeals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5" />
                  Today's Menu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {todayMeals.map((meal) => (
                    <motion.div
                      key={meal.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200 dark:border-rose-800"
                    >
                      {/* Flex container updated to allow delete button on the right */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={meal.chef?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-500 text-white">
                              {getInitials(meal.chef?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {meal.chef?.full_name}
                            </p>
                            <p className="text-xs text-slate-500">Chef</p>
                          </div>
                        </div>

                        {/* Delete button (Only show if current user is the chef) */}
                        {user?.id === meal.chef_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 -mt-2 -mr-2"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this meal?')) {
                                deleteMeal.mutate(meal.id, {
                                  onSuccess: () => toast.success('Meal deleted')
                                });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                        {meal.meal_name}
                      </h3>
                      {meal.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {meal.notes}
                        </p>
                      )}

                      {/* Join / Leave Button Area */}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {meal.attendees?.length || 0} attending
                        </Badge>
                        <Button
                          size="sm"
                          variant={meal.attendees?.includes(user?.id || '') ? "default" : "ghost"}
                          disabled={joinMeal.isPending || leaveMeal.isPending}
                          onClick={() => {
                            if (meal.attendees?.includes(user?.id || '')) {
                              leaveMeal.mutate(meal.id, {
                                onSuccess: () => toast.success('You left this meal')
                              });
                            } else {
                              joinMeal.mutate(meal.id, {
                                onSuccess: () => toast.success('You joined this meal')
                              });
                            }
                          }}
                        >
                          {meal.attendees?.includes(user?.id || '') ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Attending
                            </>
                          ) : (
                            "I'm in"
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Cooking Rotation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Cooking Rotation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900"
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={member.profile?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-500 text-white">
                          {getInitials(member.profile?.full_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <ChefHat className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {member.profile?.full_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {index === 0 ? 'Tomorrow' : `Day ${index + 1}`}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Meal Modal */}
        <Dialog open={addMealModalOpen} onOpenChange={setAddMealModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Plan a Meal</DialogTitle>
              <DialogDescription>
                Schedule a meal and let your roommates know what's cooking!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="meal-name">Meal Name</Label>
                <Input
                  id="meal-name"
                  placeholder="What's on the menu?"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {mealIdeas.slice(0, 4).map((idea) => (
                    <Button
                      key={idea}
                      variant="outline"
                      size="sm"
                      onClick={() => setMealName(idea)}
                    >
                      {idea}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Meal Time</Label>
                  <Select value={mealTime} onValueChange={setMealTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mealTimes.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label} ({time.time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Any special notes, dietary restrictions, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Who's attending?</Label>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <Button
                      key={member.user_id}
                      variant={selectedAttendees.includes(member.user_id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedAttendees((prev) =>
                          prev.includes(member.user_id)
                            ? prev.filter((id) => id !== member.user_id)
                            : [...prev, member.user_id]
                        );
                      }}
                    >
                      {member.profile?.full_name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setAddMealModalOpen(false)}
                disabled={createMeal.isPending}
              >
                Cancel
              </Button>
              <Button
                disabled={createMeal.isPending}
                onClick={() => {
                  if (!mealName) {
                    toast.error('Please enter a meal name');
                    return;
                  }
                  if (!household?.id) {
                    toast.error('Household ID is missing');
                    return;
                  }

                  createMeal.mutate(
                    {
                      household_id: household.id,
                      date: mealDate,
                      meal_name: mealName,
                      notes: notes,
                      attendees: selectedAttendees,
                    },
                    {
                      onSuccess: () => {
                        toast.success('Meal planned!');
                        setAddMealModalOpen(false);
                        setMealName('');
                        setNotes('');
                        setSelectedAttendees([]);
                      },
                      onError: (error) => {
                        toast.error(error.message || 'Failed to plan meal');
                      }
                    }
                  );
                }}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0"
              >
                {createMeal.isPending ? 'Planning...' : 'Plan Meal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}

function RotateCcw({ className }: { className?: string }) {
  return <RotateCcwIcon className={className} />;
}

function RotateCcwIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
