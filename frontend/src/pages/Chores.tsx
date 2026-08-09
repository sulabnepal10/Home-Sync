import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Calendar,
  Flame,
  Plus,
  Check,
  Clock,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Trash2
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChoreAssignments, useCompleteChore, useCreateChore, useCreateChoreAssignment, useDeleteChoreAssignment } from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

export default function Chores() {
  useFonts();

  const { user, members, household } = useAuthStore();
  const { data: assignments, isLoading, isError } = useChoreAssignments();
  const completeChore = useCompleteChore();
  const createChore = useCreateChore();
  const createAssignment = useCreateChoreAssignment();
  const deleteAssignment = useDeleteChoreAssignment();

  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [addChoreModalOpen, setAddChoreModalOpen] = useState(false);

  const [choreName, setChoreName] = useState('');
  const [chorePoints, setChorePoints] = useState('10');
  const [assignedUserId, setAssignedUserId] = useState(user?.id || '');
  const [assignedDate, setAssignedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // Get week days
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Current streak comes straight from the backend (chore_assignments.streak_count,
  // computed on completion in choreService.computeStreakOnCompletion) rather than
  // being recomputed here — read it off the user's most recently completed
  // assignment instead of a naive "count consecutive completed rows" reduce,
  // which didn't check date continuity and could overcount gaps.
  const userAssignments = assignments?.filter((a) => a.user_id === user?.id) || [];
  const mostRecentCompleted = userAssignments
    .filter((a) => a.completed_at)
    .sort((a, b) => b.assigned_date.localeCompare(a.assigned_date))[0];
  const currentStreak = mostRecentCompleted?.streak_count ?? 0;

  // Calculate completion rate
  const totalAssignments = assignments?.length || 0;
  const completedAssignments = assignments?.filter((a) => a.completed_at).length || 0;
  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

  const handleCompleteChore = async (assignmentId: string) => {
    try {
      await completeChore.mutateAsync({ assignmentId });
      toast.success('Chore completed!');
    } catch {
      toast.error('Failed to mark chore as complete');
    }
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
              Task Management
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-homesync-ink tracking-tight">
              Chores & Duties
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Button
              onClick={() => setAddChoreModalOpen(true)}
              className="rounded-none border-2 border-homesync-ink bg-homesync-ink text-homesync-cream hover:bg-homesync-olive hover:border-homesync-olive font-mono text-xs uppercase tracking-widest px-6 py-6 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Assign Chore
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
          {/* Card 1: Streak */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-rust text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center mb-8">
                <Flame className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/70 mb-2">Current Streak</p>
              <p className="font-display text-4xl font-bold">{currentStreak} <span className="text-2xl text-white/50">days</span></p>
            </CardContent>
          </Card>

          {/* Card 2: Completion Rate */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-olive text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center mb-8">
                <Trophy className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/70 mb-2">Completion Rate</p>
              <p className="font-display text-4xl font-bold">{completionRate.toFixed(0)}%</p>
            </CardContent>
          </Card>

          {/* Card 3: This Week */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-ink text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/20 flex items-center justify-center mb-8">
                <CheckSquare className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/50 mb-2">This Week</p>
              <p className="font-display text-4xl font-bold">{completedAssignments} <span className="text-2xl text-white/50">/ {totalAssignments}</span></p>
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
              <div className="grid grid-cols-7 divide-x-2 divide-homesync-sand">
                {weekDays.map((day) => {
                  const dayAssignments = assignments?.filter((a) =>
                    isSameDay(new Date(a.assigned_date), day)
                  ) || [];
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'min-h-[240px]',
                        isCurrentDay ? 'bg-homesync-cream' : 'bg-transparent'
                      )}
                    >
                      <div
                        className={cn(
                          'text-center py-4 border-b-2 border-homesync-sand font-medium',
                          isCurrentDay ? 'bg-homesync-rust text-white border-homesync-rust' : 'text-homesync-ink bg-homesync-tan'
                        )}
                      >
                        <p className={cn("font-mono text-[10px] uppercase tracking-widest mb-1", isCurrentDay ? 'text-white/80' : 'text-homesync-muted')}>
                          {format(day, 'EEE')}
                        </p>
                        <p className="font-display text-2xl font-bold">
                          {format(day, 'd')}
                        </p>
                      </div>
                      <div className="p-3 space-y-3">
                        {dayAssignments.length > 0 ? (
                          dayAssignments.map((assignment) => (
                            <motion.div
                              key={assignment.id}
                              whileHover={{ scale: 1.02 }}
                              className={cn(
                                'p-3 border-2 text-sm transition-all rounded-none',
                                assignment.completed_at
                                  ? 'border-homesync-olive bg-homesync-tan text-homesync-olive'
                                  : 'border-homesync-ink bg-white dark:bg-homesync-tan text-homesync-ink'
                              )}
                            >
                              <p className={cn(
                                'font-bold font-body truncate leading-tight mb-2',
                                assignment.completed_at && 'line-through opacity-70'
                              )}>
                                {assignment.chore?.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5 rounded-none border border-homesync-ink">
                                  <AvatarImage src={assignment.profile?.avatar_url} className="rounded-none" />
                                  <AvatarFallback className="text-[8px] font-mono rounded-none bg-homesync-ink text-white">
                                    {getInitials(assignment.profile?.full_name || '')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-mono text-[9px] uppercase tracking-widest truncate">
                                  {assignment.profile?.full_name}
                                </span>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <p className="font-mono text-[10px] uppercase tracking-widest text-center text-homesync-muted py-4">
                            No tasks
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

        {/* Today's Chores Detail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none">
            <CardHeader className="border-b-2 border-homesync-sand pb-6 bg-homesync-tan">
              <CardTitle className="font-display text-2xl font-bold text-homesync-ink flex items-center gap-3">
                <Calendar className="w-6 h-6 text-homesync-rust" />
                Today's Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-white dark:bg-homesync-tan">
              <div className="divide-y-2 divide-homesync-sand">
                {(() => {
                  if (isLoading) {
                    return <LoadingState label="Loading chores..." />;
                  }
                  if (isError) {
                    return <ErrorState message="Failed to load chores. Please try again." />;
                  }

                  const todayChores = assignments?.filter((a) =>
                    isToday(new Date(a.assigned_date))
                  ) || [];

                  if (todayChores.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-homesync-muted m-4 border-2 border-dashed border-homesync-sand">
                        <CheckSquare className="w-12 h-12 mb-4 text-homesync-sand opacity-50" />
                        <p className="font-display text-2xl font-bold text-homesync-ink mb-2">No chores today</p>
                        <p className="font-mono text-xs uppercase tracking-widest text-homesync-muted">Enjoy your free time!</p>
                      </div>
                    );
                  }

                  return todayChores.map((assignment) => (
                    <motion.div
                      key={assignment.id}
                      whileHover={{ backgroundColor: 'hsl(var(--hs-cream))' }}
                      className={cn(
                        'flex flex-col sm:flex-row sm:items-center gap-4 p-5 transition-colors',
                        assignment.completed_at ? 'bg-homesync-tan/50' : 'bg-white dark:bg-homesync-tan'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 border-2 flex items-center justify-center rounded-none flex-shrink-0',
                        assignment.completed_at
                          ? 'border-homesync-olive bg-homesync-olive text-white'
                          : 'border-homesync-ink bg-homesync-cream text-homesync-ink'
                      )}>
                        {assignment.completed_at ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <Clock className="w-6 h-6" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-display font-bold text-xl truncate mb-1',
                          assignment.completed_at ? 'text-homesync-olive line-through' : 'text-homesync-ink'
                        )}>
                          {assignment.chore?.name}
                        </p>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-6 h-6 rounded-none border border-homesync-ink">
                            <AvatarImage src={assignment.profile?.avatar_url} className="rounded-none" />
                            <AvatarFallback className="text-[10px] font-mono rounded-none bg-homesync-ink text-white">
                              {getInitials(assignment.profile?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-homesync-ink font-bold">
                            {assignment.profile?.full_name}
                          </span>

                          {assignment.streak_count > 0 && (
                            <Badge className="font-mono text-[9px] tracking-widest uppercase bg-homesync-rust text-white rounded-none border-none flex items-center ml-2">
                              <Flame className="w-3 h-3 mr-1" />
                              {assignment.streak_count}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-4 sm:mt-0">
                        {assignment.chore?.points && (
                          <Badge className="font-mono text-[10px] tracking-widest uppercase bg-transparent border-2 border-homesync-sand text-homesync-muted rounded-none">
                            +{assignment.chore.points} pts
                          </Badge>
                        )}
                        {!assignment.completed_at && assignment.user_id === user?.id && (
                          <Button
                            onClick={() => handleCompleteChore(assignment.id)}
                            disabled={completeChore.isPending}
                            className="rounded-none border-2 border-homesync-olive bg-homesync-olive text-white hover:bg-homesync-bark hover:border-homesync-bark font-mono text-xs uppercase tracking-widest px-4"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Complete
                          </Button>
                        )}
                        {!assignment.completed_at && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-none border-2 border-homesync-rust text-homesync-rust hover:bg-homesync-rust hover:text-white transition-colors"
                            disabled={deleteAssignment.isPending}
                            onClick={() => {
                              if (window.confirm('Delete this chore assignment?')) {
                                deleteAssignment.mutate(assignment.id, {
                                  onSuccess: () => toast.success('Chore removed'),
                                  onError: (error) => toast.error(error.message || 'Failed to remove chore'),
                                });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Chore Modal */}
        <Dialog open={addChoreModalOpen} onOpenChange={setAddChoreModalOpen}>
          <DialogContent className="max-w-md rounded-none border-2 border-homesync-ink bg-homesync-cream p-0 shadow-[8px_8px_0px_rgba(26,18,9,1)]">
            <DialogHeader className="p-6 border-b-2 border-homesync-ink bg-homesync-tan">
              <DialogTitle className="font-display text-3xl font-black text-homesync-ink">Assign Duty</DialogTitle>
              <DialogDescription className="font-body text-homesync-muted text-sm mt-2">
                Create a task and assign it to a household member.
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-6">

              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Chore Name</Label>
                <Input
                  placeholder="e.g., Take out the trash"
                  value={choreName}
                  onChange={(e) => setChoreName(e.target.value)}
                  className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-body h-12 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Points</Label>
                  <Input
                    type="number"
                    min="0"
                    value={chorePoints}
                    onChange={(e) => setChorePoints(e.target.value)}
                    className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-mono h-12 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Date</Label>
                  <Input
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-mono h-12 text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Assign To</Label>
                <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                  <SelectTrigger className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus:ring-0 focus:border-homesync-ink h-12 font-body text-base">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-homesync-ink bg-homesync-cream font-body">
                    {members.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id} className="focus:bg-homesync-tan rounded-none cursor-pointer">
                        {member.profile?.full_name} {member.user_id === user?.id ? '(You)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="p-6 border-t-2 border-homesync-ink bg-homesync-tan flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setAddChoreModalOpen(false)}
                disabled={createChore.isPending || createAssignment.isPending}
                className="rounded-none border-2 border-homesync-ink bg-transparent text-homesync-ink hover:bg-homesync-cream font-mono text-xs uppercase tracking-widest px-6"
              >
                Cancel
              </Button>
              <Button
                disabled={createChore.isPending || createAssignment.isPending}
                onClick={() => {
                  if (!household?.id) {
                    toast.error('Household missing');
                    return;
                  }
                  if (!choreName.trim() || !assignedUserId) {
                    toast.error('Please fill in the chore name and assignee');
                    return;
                  }

                  createChore.mutate(
                    {
                      household_id: household.id,
                      name: choreName,
                      points: Number(chorePoints) || 10,
                      frequency: 'weekly',
                    },
                    {
                      onSuccess: (newChore) => {
                        createAssignment.mutate(
                          {
                            chore_id: newChore.id,
                            user_id: assignedUserId,
                            assigned_date: assignedDate,
                          },
                          {
                            onSuccess: () => {
                              toast.success('Chore assigned successfully!');
                              setAddChoreModalOpen(false);
                              setChoreName('');
                              setChorePoints('10');
                            },
                            onError: () => toast.error('Failed to assign chore')
                          }
                        );
                      },
                      onError: () => toast.error('Failed to create chore template')
                    }
                  );
                }}
                className="rounded-none border-2 border-homesync-ink bg-homesync-ink text-white hover:bg-homesync-olive hover:border-homesync-olive font-mono text-xs uppercase tracking-widest px-6"
              >
                {createChore.isPending || createAssignment.isPending ? 'Saving...' : 'Assign Chore'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}