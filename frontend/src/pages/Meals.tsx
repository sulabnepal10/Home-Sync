import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFonts } from '@/hooks/useFonts';
import { GrainOverlay } from '@/components/shared/GrainOverlay';
import {
  UtensilsCrossed,
  Plus,
  ChefHat,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Vote
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
  useDeleteMeal,
  useVoteMeal
} from '@/hooks/useQueries';
import type { Meal } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
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

/**
 * Groups a day's meals into standalone meals vs. poll groups (candidates
 * sharing a poll_group_id), sorting each poll's options by vote count so
 * the leading option renders first.
 */
function groupMealsForDay(dayMeals: Meal[]): { key: string; options: Meal[] }[] {
  const groups = new Map<string, Meal[]>();
  dayMeals.forEach((meal) => {
    const key = meal.poll_group_id || meal.id;
    groups.set(key, [...(groups.get(key) || []), meal]);
  });
  return Array.from(groups.entries()).map(([key, options]) => ({
    key,
    options: [...options].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0)),
  }));
}

export default function Meals() {
  useFonts();

  const { user, members, household } = useAuthStore();
  const { data: meals, isLoading, isError } = useMeals();
  const createMeal = useCreateMeal();
  const joinMeal = useJoinMeal();
  const leaveMeal = useLeaveMeal();
  const deleteMeal = useDeleteMeal();
  const voteMeal = useVoteMeal();

  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [addMealModalOpen, setAddMealModalOpen] = useState(false);

  const [mealName, setMealName] = useState('');
  const [mealDate, setMealDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealTime, setMealTime] = useState('dinner');
  const [notes, setNotes] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '', '']);
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);

  const handleVote = (mealId: string) => {
    voteMeal.mutate(mealId, {
      onError: (error) => toast.error(error.message || 'Failed to vote'),
    });
  };

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
    <ScrollArea className="h-screen bg-homesync-cream font-body text-homesync-ink relative">
      <GrainOverlay />

      <div className="p-6 lg:p-10 max-w-[1200px] mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 border-b-2 border-homesync-sand pb-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-homesync-rust flex items-center gap-3 mb-3">
              <div className="w-8 h-[1.5px] bg-homesync-rust" />
              Meal Planner
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-homesync-ink tracking-tight">
              Meals & Menu
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Button
              onClick={() => setAddMealModalOpen(true)}
              className="rounded-none border-2 border-homesync-ink bg-homesync-ink text-homesync-cream hover:bg-homesync-rust hover:border-homesync-rust font-mono text-xs uppercase tracking-widest px-6 py-6 transition-colors"
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
          className="grid grid-cols-1 sm:grid-cols-3 gap-0 mb-12 border-t-2 border-l-2 border-homesync-sand"
        >
          {/* Card 1: Your Turn */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-olive text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center mb-8">
                <ChefHat className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white mb-2">Your Turn</p>
              <p className="font-display text-4xl font-bold">Tomorrow</p>
            </CardContent>
          </Card>

          {/* Card 2: Today's Meals */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-rust text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center mb-8">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white mb-2">Today's Meals</p>
              <p className="font-display text-4xl font-bold">{todayMeals.length}</p>
            </CardContent>
          </Card>

          {/* Card 3: This Week */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-ink text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/20 flex items-center justify-center mb-8">
                <Users className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white mb-2">This Week</p>
              <p className="font-display text-4xl font-bold">{upcomingMeals.length}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Week Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-6 bg-homesync-tan border-2 border-homesync-sand p-2"
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous week"
            onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
            className="rounded-none hover:bg-white dark:hover:bg-homesync-tan text-homesync-ink"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-sm font-mono uppercase tracking-widest text-homesync-ink font-bold">
            Week of {format(weekStart, 'MMM d, yyyy')}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next week"
            onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
            className="rounded-none hover:bg-white dark:hover:bg-homesync-tan text-homesync-ink"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Weekly Calendar View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12 overflow-x-auto"
        >
          <Card className="min-w-[800px] rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan shadow-none">
            <CardContent className="p-0">
              {isLoading ? (
                <LoadingState label="Loading meals..." />
              ) : isError ? (
                <ErrorState message="Failed to load meals. Please try again." />
              ) : (
              <div className="grid grid-cols-7 divide-x-2 divide-homesync-sand">
                {weekDays.map((day) => {
                  const dayMeals = meals?.filter((meal) =>
                    isSameDay(parseISO(meal.date), day)
                  ) || [];
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'min-h-[220px]',
                        isCurrentDay ? 'bg-homesync-cream' : 'bg-transparent'
                      )}
                    >
                      <div
                        className={cn(
                          'text-center py-4 border-b-2 border-homesync-sand font-medium',
                          isCurrentDay ? 'bg-homesync-rust text-white border-homesync-rust' : 'text-homesync-ink bg-homesync-tan'
                        )}
                      >
                        <p className={cn("font-mono text-[10px] uppercase tracking-widest mb-1", isCurrentDay ? 'text-white' : 'text-homesync-muted')}>
                          {format(day, 'EEE')}
                        </p>
                        <p className="font-display text-2xl font-bold">
                          {format(day, 'd')}
                        </p>
                      </div>
                      <div className="p-3 space-y-3">
                        {dayMeals.length > 0 ? (
                          groupMealsForDay(dayMeals).map(({ key, options }) =>
                            options.length > 1 ? (
                              <div key={key} className="border-2 border-homesync-rust bg-white dark:bg-homesync-tan text-sm rounded-none">
                                <div className="flex items-center gap-1 px-3 pt-2 text-[9px] font-mono uppercase tracking-widest text-homesync-rust">
                                  <Vote className="w-3 h-3" />
                                  Vote
                                </div>
                                <div className="p-2 space-y-1.5">
                                  {options.map((meal, i) => (
                                    <button
                                      key={meal.id}
                                      onClick={() => handleVote(meal.id)}
                                      disabled={voteMeal.isPending}
                                      className={cn(
                                        "w-full flex items-center justify-between gap-2 p-2 border transition-colors text-left",
                                        meal.voted_by_me
                                          ? "border-homesync-olive bg-homesync-olive/10"
                                          : "border-homesync-sand hover:bg-homesync-cream",
                                        i === 0 && (meal.vote_count ?? 0) > 0 && "font-bold"
                                      )}
                                    >
                                      <span className="truncate text-homesync-ink text-xs">{meal.meal_name}</span>
                                      <span className="flex items-center gap-1 font-mono text-[9px] text-homesync-muted shrink-0">
                                        {meal.voted_by_me && <Check className="w-3 h-3 text-homesync-olive" />}
                                        {meal.vote_count ?? 0}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <motion.div
                                key={key}
                                whileHover={{ scale: 1.02 }}
                                className="p-3 border-2 border-homesync-ink bg-white dark:bg-homesync-tan text-homesync-ink text-sm transition-all rounded-none"
                              >
                                <div className="flex items-center gap-2 text-homesync-muted mb-2">
                                  <ChefHat className="w-3 h-3 text-homesync-rust" />
                                  <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-homesync-ink truncate">
                                    {options[0].chef?.full_name}
                                  </span>
                                </div>
                                <p className="font-bold font-body truncate leading-tight mb-2">
                                  {options[0].meal_name}
                                </p>
                                <div className="flex items-center gap-1 mt-1 text-[9px] font-mono uppercase tracking-widest text-homesync-muted">
                                  <Users className="w-3 h-3 text-homesync-ink" />
                                  <span>{options[0].attendees?.length || 0} In</span>
                                </div>
                              </motion.div>
                            )
                          )
                        ) : (
                          <p className="font-mono text-[10px] uppercase tracking-widest text-center text-homesync-muted py-4">
                            No meals
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Meals Detail */}
        {todayMeals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-12"
          >
            <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none">
              <CardHeader className="border-b-2 border-homesync-sand pb-6 bg-homesync-tan">
                <CardTitle className="font-display text-2xl font-bold text-homesync-ink flex items-center gap-3">
                  <UtensilsCrossed className="w-6 h-6 text-homesync-rust" />
                  Today's Menu
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-white dark:bg-homesync-tan">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {todayMeals.map((meal) => (
                    <motion.div
                      key={meal.id}
                      whileHover={{ scale: 1.01 }}
                      className="p-5 border-2 border-homesync-sand bg-homesync-cream hover:border-homesync-ink transition-colors flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-4 border-b-2 border-homesync-sand pb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 rounded-none border border-homesync-ink">
                            <AvatarImage src={meal.chef?.avatar_url} className="rounded-none" />
                            <AvatarFallback className="bg-homesync-ink text-white rounded-none font-mono text-xs">
                              {getInitials(meal.chef?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold font-body text-homesync-ink">
                              {meal.chef?.full_name}
                            </p>
                            <p className="font-mono text-[9px] uppercase tracking-widest text-homesync-muted">Chef</p>
                          </div>
                        </div>

                        {user?.id === meal.chef_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete meal"
                            className="rounded-none hover:bg-homesync-tan text-homesync-rust h-8 w-8 -mt-2 -mr-2"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this meal?')) {
                                deleteMeal.mutate(meal.id, {
                                  onSuccess: () => toast.success('Meal deleted'),
                                  onError: (error) => toast.error(error.message || 'Failed to delete meal'),
                                });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-display font-bold text-xl text-homesync-ink mb-2">
                          {meal.meal_name}
                        </h3>
                        {meal.notes && (
                          <p className="text-sm font-body text-homesync-muted mb-4 leading-relaxed">
                            {meal.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-homesync-sand border-dashed">
                        <Badge className="font-mono text-[9px] uppercase tracking-widest bg-transparent border-2 border-homesync-sand text-homesync-ink rounded-none hover:bg-transparent">
                          {meal.attendees?.length || 0} attending
                        </Badge>
                        <Button
                          size="sm"
                          disabled={joinMeal.isPending || leaveMeal.isPending}
                          className={cn(
                            "rounded-none border-2 font-mono text-[10px] uppercase tracking-widest px-4",
                            meal.attendees?.includes(user?.id || '')
                              ? "bg-homesync-olive text-white border-homesync-olive hover:bg-homesync-bark hover:border-homesync-bark"
                              : "bg-transparent text-homesync-ink border-homesync-ink hover:bg-homesync-ink hover:text-white"
                          )}
                          onClick={() => {
                            if (meal.attendees?.includes(user?.id || '')) {
                              leaveMeal.mutate(meal.id, {
                                onSuccess: () => toast.success('You left this meal'),
                                onError: (error) => toast.error(error.message || 'Failed to leave meal'),
                              });
                            } else {
                              joinMeal.mutate(meal.id, {
                                onSuccess: () => toast.success('You joined this meal'),
                                onError: (error) => toast.error(error.message || 'Failed to join meal'),
                              });
                            }
                          }}
                        >
                          {meal.attendees?.includes(user?.id || '') ? (
                            <>
                              <Check className="w-3 h-3 mr-2" />
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
          className="pb-12"
        >
          <Card className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan shadow-none">
            <CardHeader className="border-b-2 border-homesync-sand pb-6">
              <CardTitle className="font-display text-2xl font-bold text-homesync-ink flex items-center gap-3">
                <RotateCcw className="w-6 h-6 text-homesync-ink" />
                Cooking Rotation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 border-2 border-homesync-sand bg-homesync-cream transition-colors hover:border-homesync-ink min-w-[200px]"
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12 rounded-none border border-homesync-ink">
                        <AvatarImage src={member.profile?.avatar_url} className="rounded-none" />
                        <AvatarFallback className="rounded-none bg-homesync-bark text-white font-mono text-sm">
                          {getInitials(member.profile?.full_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && (
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 border border-homesync-ink bg-homesync-rust flex items-center justify-center rounded-none">
                          <ChefHat className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-display font-bold text-homesync-ink text-lg leading-none mb-1">
                        {member.profile?.full_name}
                      </p>
                      <p className={cn(
                        "font-mono text-[10px] uppercase tracking-widest",
                        index === 0 ? "text-homesync-rust font-bold" : "text-homesync-muted"
                      )}>
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
          <DialogContent className="max-w-md rounded-none border-2 border-homesync-ink bg-homesync-cream p-0 shadow-[8px_8px_0px_rgba(26,18,9,1)]">
            <DialogHeader className="p-6 border-b-2 border-homesync-ink bg-homesync-tan">
              <DialogTitle className="font-display text-3xl font-black text-homesync-ink">Plan a Meal</DialogTitle>
              <DialogDescription className="font-body text-homesync-muted text-sm mt-2">
                Schedule a meal and let your roommates know what's cooking!
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">

              <button
                type="button"
                onClick={() => setIsPollMode((v) => !v)}
                className={cn(
                  "w-full flex items-center justify-between p-3 border-2 font-mono text-[10px] uppercase tracking-widest transition-colors",
                  isPollMode
                    ? "border-homesync-rust bg-homesync-rust/10 text-homesync-rust"
                    : "border-homesync-sand bg-white dark:bg-homesync-tan text-homesync-muted hover:border-homesync-ink"
                )}
              >
                <span>Can't decide? Propose a few options to vote on</span>
                <span className="font-bold">{isPollMode ? 'ON' : 'OFF'}</span>
              </button>

              {isPollMode ? (
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Options to vote on</Label>
                  {pollOptions.map((option, i) => (
                    <Input
                      key={i}
                      placeholder={`Option ${i + 1}${i < 2 ? '' : ' (optional)'}`}
                      value={option}
                      onChange={(e) =>
                        setPollOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                      }
                      className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-body h-12 text-base"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="meal-name" className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Meal Name</Label>
                  <Input
                    id="meal-name"
                    placeholder="What's on the menu?"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-body h-12 text-base"
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {mealIdeas.slice(0, 4).map((idea) => (
                      <Button
                        key={idea}
                        variant="outline"
                        size="sm"
                        onClick={() => setMealName(idea)}
                        className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan hover:bg-homesync-tan hover:border-homesync-ink text-homesync-ink font-mono text-[9px] uppercase tracking-widest h-8"
                      >
                        {idea}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Date</Label>
                  <Input
                    type="date"
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                    className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-mono h-12 text-xs uppercase"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Time</Label>
                  <Select value={mealTime} onValueChange={setMealTime}>
                    <SelectTrigger className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus:ring-0 focus:border-homesync-ink h-12 font-body text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2 border-homesync-ink bg-homesync-cream font-body">
                      {mealTimes.map((time) => (
                        <SelectItem key={time.value} value={time.value} className="focus:bg-homesync-tan rounded-none cursor-pointer">
                          {time.label} <span className="text-homesync-muted ml-1">({time.time})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Notes <span className="text-homesync-muted font-normal lowercase tracking-normal">(optional)</span></Label>
                <Textarea
                  placeholder="Special notes, dietary restrictions, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-body resize-none p-3"
                />
              </div>

              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Who's attending?</Label>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => {
                    const isSelected = selectedAttendees.includes(member.user_id);
                    return (
                      <Button
                        key={member.user_id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAttendees((prev) =>
                            prev.includes(member.user_id)
                              ? prev.filter((id) => id !== member.user_id)
                              : [...prev, member.user_id]
                          );
                        }}
                        className={cn(
                          "rounded-none border-2 font-mono text-[10px] uppercase tracking-widest h-9",
                          isSelected
                            ? "bg-homesync-ink border-homesync-ink text-white hover:bg-homesync-bark hover:text-white"
                            : "bg-white dark:bg-homesync-tan border-homesync-sand text-homesync-ink hover:bg-homesync-tan hover:border-homesync-ink"
                        )}
                      >
                        {member.profile?.full_name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t-2 border-homesync-ink bg-homesync-tan flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setAddMealModalOpen(false)}
                disabled={createMeal.isPending}
                className="rounded-none border-2 border-homesync-ink bg-transparent text-homesync-ink hover:bg-homesync-cream font-mono text-xs uppercase tracking-widest px-6"
              >
                Cancel
              </Button>
              <Button
                disabled={createMeal.isPending || isSubmittingPoll}
                onClick={async () => {
                  if (!household?.id) {
                    toast.error('Household ID is missing');
                    return;
                  }

                  const resetShared = () => {
                    setAddMealModalOpen(false);
                    setNotes('');
                    setSelectedAttendees([]);
                    setMealTime('dinner');
                  };

                  if (isPollMode) {
                    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
                    if (options.length < 2) {
                      toast.error('Enter at least 2 options to vote on');
                      return;
                    }
                    const pollGroupId = crypto.randomUUID();
                    setIsSubmittingPoll(true);
                    try {
                      for (const option of options) {
                        await createMeal.mutateAsync({
                          household_id: household.id,
                          date: mealDate,
                          meal_name: option,
                          notes,
                          attendees: selectedAttendees,
                          meal_time: mealTime as 'breakfast' | 'lunch' | 'dinner',
                          poll_group_id: pollGroupId,
                        });
                      }
                      toast.success('Poll created — cast your votes!');
                      resetShared();
                      setPollOptions(['', '', '']);
                      setIsPollMode(false);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Failed to create poll');
                    } finally {
                      setIsSubmittingPoll(false);
                    }
                    return;
                  }

                  if (!mealName) {
                    toast.error('Please enter a meal name');
                    return;
                  }
                  createMeal.mutate(
                    {
                      household_id: household.id,
                      date: mealDate,
                      meal_name: mealName,
                      notes: notes,
                      attendees: selectedAttendees,
                      meal_time: mealTime as 'breakfast' | 'lunch' | 'dinner',
                    },
                    {
                      onSuccess: () => {
                        toast.success('Meal planned!');
                        resetShared();
                        setMealName('');
                      },
                      onError: (error) => {
                        toast.error(error.message || 'Failed to plan meal');
                      }
                    }
                  );
                }}
                className="rounded-none border-2 border-homesync-ink bg-homesync-rust text-white hover:bg-homesync-bark font-mono text-xs uppercase tracking-widest px-6"
              >
                {createMeal.isPending || isSubmittingPoll ? 'Planning...' : isPollMode ? 'Create Poll' : 'Plan Meal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}

// Keeping original inline SVGs and components for backward compatibility
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