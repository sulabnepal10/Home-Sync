import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Calendar,
  Flame,
  Plus,
  Check,
  Clock,
  Trophy,
  RotateCcw,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useChoreAssignments, useCompleteChore, useCreateChore, useCreateChoreAssignment, useDeleteChoreAssignment } from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
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

export default function Chores() {
  const { user, members, household } = useAuthStore();
  const { data: assignments, isLoading } = useChoreAssignments();
  const completeChore = useCompleteChore();
  const createChore = useCreateChore();
  const createAssignment = useCreateChoreAssignment();
  const deleteAssignment = useDeleteChoreAssignment();

  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [addChoreModalOpen, setAddChoreModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [choreName, setChoreName] = useState('');
  const [chorePoints, setChorePoints] = useState('10');
  const [assignedUserId, setAssignedUserId] = useState(user?.id || '');
  const [assignedDate, setAssignedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // Get week days
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Calculate streak
  const userAssignments = assignments?.filter((a) => a.user_id === user?.id) || [];
  const currentStreak = userAssignments.reduce((streak, assignment) => {
    if (assignment.completed_at) {
      return streak + 1;
    }
    return 0;
  }, 0);

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
    <ScrollArea className="h-screen">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Chores
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage tasks and track your streaks
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Button
              onClick={() => setAddChoreModalOpen(true)}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Chore
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
          <Card className="bg-gradient-to-br from-orange-500 to-amber-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-orange-100">Current Streak</p>
                  <p className="text-2xl font-bold">{currentStreak} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-teal-100">Completion Rate</p>
                  <p className="text-2xl font-bold">{completionRate.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-sky-500 to-blue-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-sky-100">This Week</p>
                  <p className="text-2xl font-bold">{completedAssignments}/{totalAssignments}</p>
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

        {/* Weekly Calendar View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
            <CardContent className="p-0">
              <div className="grid grid-cols-7">
                {weekDays.map((day) => {
                  const dayAssignments = assignments?.filter((a) =>
                    isSameDay(new Date(a.assigned_date), day)
                  ) || [];

                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[200px]',
                        isCurrentDay && 'bg-sky-50 dark:bg-sky-900/10'
                      )}
                    >
                      <div
                        className={cn(
                          'text-center py-3 border-b border-slate-200 dark:border-slate-700 font-medium',
                          isCurrentDay && 'text-sky-600 dark:text-sky-400'
                        )}
                      >
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {format(day, 'EEE')}
                        </p>
                        <p className={cn(
                          'text-lg',
                          isCurrentDay && 'font-bold'
                        )}>
                          {format(day, 'd')}
                        </p>
                      </div>

                      <div className="p-2 space-y-2">
                        {dayAssignments.length > 0 ? (
                          dayAssignments.map((assignment) => (
                            <motion.div
                              key={assignment.id}
                              whileHover={{ scale: 1.02 }}
                              className={cn(
                                'p-2 rounded-lg text-sm cursor-pointer transition-all',
                                assignment.completed_at
                                  ? 'bg-teal-100 dark:bg-teal-900/30'
                                  : 'bg-slate-100 dark:bg-slate-700'
                              )}
                            >
                              <p className={cn(
                                'font-medium truncate',
                                assignment.completed_at
                                  ? 'text-teal-700 dark:text-teal-400 line-through'
                                  : 'text-slate-900 dark:text-white'
                              )}>
                                {assignment.chore?.name}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Avatar className="w-4 h-4">
                                  <AvatarImage src={assignment.profile?.avatar_url} />
                                  <AvatarFallback className="text-[6px]">
                                    {getInitials(assignment.profile?.full_name || '')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] text-slate-500 truncate">
                                  {assignment.profile?.full_name}
                                </span>
                              </div>
                              {assignment.completed_at && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Check className="w-3 h-3 text-teal-500" />
                                  <span className="text-[10px] text-teal-500">Done</span>
                                </div>
                              )}
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-xs text-center text-slate-400 py-4">No chores</p>
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
          className="mt-8"
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Today's Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const todayChores = assignments?.filter((a) =>
                    isToday(new Date(a.assigned_date))
                  ) || [];

                  if (todayChores.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-500">
                        <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium text-slate-900 dark:text-white">No chores for today</p>
                        <p className="text-sm">Enjoy your free time!</p>
                      </div>
                    );
                  }

                  return todayChores.map((assignment) => (
                    <motion.div
                      key={assignment.id}
                      whileHover={{ scale: 1.01 }}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl transition-all',
                        assignment.completed_at
                          ? 'bg-teal-50 dark:bg-teal-900/20'
                          : 'bg-slate-50 dark:bg-slate-900'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        assignment.completed_at
                          ? 'bg-teal-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}>
                        {assignment.completed_at ? (
                          <Check className="w-6 h-6 text-white" />
                        ) : (
                          <Clock className="w-6 h-6 text-slate-500" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className={cn(
                          'font-medium',
                          assignment.completed_at
                            ? 'text-teal-700 dark:text-teal-400'
                            : 'text-slate-900 dark:text-white'
                        )}>
                          {assignment.chore?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={assignment.profile?.avatar_url} />
                            <AvatarFallback className="text-[6px]">
                              {getInitials(assignment.profile?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-slate-500">
                            {assignment.profile?.full_name}
                          </span>
                          {assignment.streak_count > 0 && (
                            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0 ml-2">
                              <Flame className="w-3 h-3 mr-1" />
                              {assignment.streak_count}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {assignment.chore?.points && (
                          <Badge variant="outline">
                            +{assignment.chore.points} pts
                          </Badge>
                        )}

                        {!assignment.completed_at && assignment.user_id === user?.id && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteChore(assignment.id)}
                            disabled={completeChore.isPending}
                            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        )}

                        {!assignment.completed_at && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            disabled={deleteAssignment.isPending}
                            onClick={() => {
                              if (window.confirm('Delete this chore assignment?')) {
                                deleteAssignment.mutate(assignment.id, {
                                  onSuccess: () => toast.success('Chore removed')
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign New Chore</DialogTitle>
              <DialogDescription>
                Create a task and assign it to a household member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Chore Name</Label>
                <Input
                  placeholder="e.g., Take out the trash"
                  value={choreName}
                  onChange={(e) => setChoreName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    min="0"
                    value={chorePoints}
                    onChange={(e) => setChorePoints(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.profile?.full_name} {member.user_id === user?.id ? '(You)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setAddChoreModalOpen(false)}
                disabled={createChore.isPending || createAssignment.isPending}
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

                  // 1. Create the Chore template
                  createChore.mutate(
                    {
                      household_id: household.id,
                      name: choreName,
                      points: Number(chorePoints) || 10,
                      frequency: 'weekly', // Defaulting for the demo
                    },
                    {
                      onSuccess: (newChore) => {
                        // 2. Once created, immediately assign it
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
                              // Reset states
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
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white border-0"
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
