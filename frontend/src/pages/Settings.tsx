import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Palette,
  Users,
  Shield,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Copy,
  Check,
  UserMinus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { useLeaveHousehold, useRemoveMember, useUpdateProfile } from '@/hooks/useQueries';
import type { NotificationPreferences, Profile } from '@/types';

const defaultNotificationPreferences: NotificationPreferences = {
  expenses: true,
  chores: true,
  meals: true,
  inventory: true,
  push: true,
  email: false,
};

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

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function Settings() {
  useFonts();

  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { user, household, members, signOut, updateUser } = useAuthStore();
  const leaveHousehold = useLeaveHousehold();
  const removeMember = useRemoveMember();
  const updateProfile = useUpdateProfile();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPreferences>(
    user?.notification_preferences || defaultNotificationPreferences
  );

  // Sync local toggle state once the real profile (with saved preferences)
  // loads in — the store starts with a fallback profile before that.
  useEffect(() => {
    if (user?.notification_preferences) {
      setNotifications(user.notification_preferences);
    }
  }, [user?.notification_preferences]);

  const isAdmin = members.find((m) => m.user_id === user?.id)?.role === 'admin';

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleCopyInviteCode = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      toast.success('Invite code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveHousehold = async () => {
    try {
      await leaveHousehold.mutateAsync();
      useAuthStore.setState({ household: null, members: [] });
      toast.success('You left the household');
      navigate('/onboarding');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to leave household');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!household) return;
    try {
      await removeMember.mutateAsync({ householdId: household.id, memberId });
      toast.success(`Removed ${memberName} from the household`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setIsUpdating(true);
    try {
      const updatedProfile = await apiClient.put<Profile>('/api/profile', {
        full_name: fullName.trim(),
      });
      updateUser({ full_name: updatedProfile.full_name });
      toast.success('Profile updated successfully');
      setEditProfileOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
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

      <div className="p-6 lg:p-10 max-w-[800px] mx-auto relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 border-b-2 border-homesync-sand pb-6">
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-homesync-rust flex items-center gap-3 mb-3">
            <div className="w-8 h-[1.5px] bg-homesync-rust" />
            Preferences
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-black text-homesync-ink tracking-tight">
            Settings
          </h1>
        </motion.div>

        <div className="space-y-12 pb-12">

          {/* Profile Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none">
              <CardHeader className="border-b-2 border-homesync-sand bg-homesync-tan pb-6">
                <CardTitle className="font-display text-2xl font-bold text-homesync-ink flex items-center gap-3">
                  <User className="w-6 h-6 text-homesync-ink" />
                  Profile
                </CardTitle>
                <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted mt-2">
                  Manage your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-white dark:bg-homesync-tan">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <Avatar className="w-24 h-24 rounded-none border-2 border-homesync-ink flex-shrink-0">
                    <AvatarImage src={user?.avatar_url} className="rounded-none" />
                    <AvatarFallback className="rounded-none text-2xl font-display font-bold bg-homesync-ink text-homesync-cream">
                      {getInitials(user?.full_name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-display font-bold text-2xl text-homesync-ink mb-1">
                      {user?.full_name}
                    </p>
                    <p className="font-mono text-xs text-homesync-muted mb-4">ID: {user?.id}</p>
                    <Button
                      variant="outline"
                      onClick={() => setEditProfileOpen(true)}
                      className="rounded-none border-2 border-homesync-ink bg-transparent text-homesync-ink hover:bg-homesync-ink hover:text-white font-mono text-xs uppercase tracking-widest transition-colors"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Household Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none">
              <CardHeader className="border-b-2 border-homesync-sand bg-homesync-tan pb-6">
                <CardTitle className="font-display text-2xl font-bold text-homesync-ink flex items-center gap-3">
                  <Users className="w-6 h-6 text-homesync-ink" />
                  Household
                </CardTitle>
                <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted mt-2">
                  Manage your household settings
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 bg-white dark:bg-homesync-tan">
                <div className="divide-y-2 divide-homesync-sand">

                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-display font-bold text-xl text-homesync-ink mb-1">
                        {household?.name}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted">
                        {members.length} member{members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge className="rounded-none bg-transparent border-2 border-homesync-olive text-homesync-olive font-mono text-[10px] uppercase tracking-widest hover:bg-transparent">
                      Active
                    </Badge>
                  </div>

                  <div className="p-6 bg-homesync-cream">
                    <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold mb-3 block">Invite Code</Label>
                    <div className="flex items-center gap-0">
                      <code className="flex-1 bg-white dark:bg-homesync-tan border-2 border-r-0 border-homesync-sand p-3 text-lg font-mono font-bold text-homesync-ink h-12 flex items-center">
                        {household?.invite_code}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyInviteCode}
                        className="h-12 w-12 rounded-none border-2 border-homesync-ink bg-homesync-ink text-white hover:bg-homesync-bark hover:border-homesync-bark transition-colors"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-homesync-olive" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted mt-3">
                      Share this code with roommates to invite them.
                    </p>
                  </div>

                  <div className="p-6">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold mb-4">
                      Roster
                    </h3>
                    <div className="grid gap-3">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-4 p-3 border-2 border-homesync-sand bg-white dark:bg-homesync-tan"
                        >
                          <Avatar className="rounded-none border border-homesync-ink">
                            <AvatarImage src={member.profile?.avatar_url} className="rounded-none" />
                            <AvatarFallback className="rounded-none font-mono text-[10px] bg-homesync-tan text-homesync-ink">
                              {getInitials(member.profile?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-body font-bold text-homesync-ink">
                              {member.profile?.full_name}
                            </p>
                            <p className="font-mono text-[9px] uppercase tracking-widest text-homesync-muted">
                              {member.role}
                            </p>
                          </div>
                          {member.user_id === user?.id && (
                            <Badge className="rounded-none bg-homesync-ink text-white font-mono text-[9px] uppercase tracking-widest hover:bg-homesync-ink">
                              You
                            </Badge>
                          )}
                          {isAdmin && member.user_id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove ${member.profile?.full_name || 'member'}`}
                              onClick={() => handleRemoveMember(member.id, member.profile?.full_name || 'this member')}
                              disabled={removeMember.isPending}
                              className="rounded-none text-homesync-rust hover:bg-homesync-rust/10 hover:text-homesync-rust"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none">
              <CardHeader className="border-b-2 border-homesync-sand bg-homesync-tan pb-6">
                <CardTitle className="font-display text-2xl font-bold text-homesync-ink flex items-center gap-3">
                  <Palette className="w-6 h-6 text-homesync-ink" />
                  Appearance
                </CardTitle>
                <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted mt-2">
                  Choose how HomeSync looks on this device
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-white dark:bg-homesync-tan">
                <div className="grid grid-cols-3 gap-3">
                  {themes.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      aria-pressed={theme === value}
                      className={`flex flex-col items-center gap-2 p-4 border-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                        theme === value
                          ? 'border-homesync-ink bg-homesync-ink text-homesync-cream'
                          : 'border-homesync-sand text-homesync-ink hover:bg-homesync-tan'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none">
              <CardHeader className="border-b-2 border-homesync-sand bg-homesync-tan pb-6">
                <CardTitle className="font-display text-2xl font-bold text-homesync-ink flex items-center gap-3">
                  <Bell className="w-6 h-6 text-homesync-ink" />
                  Notifications
                </CardTitle>
                <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted mt-2">
                  Control your alert preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 bg-white dark:bg-homesync-tan">
                <div className="divide-y-2 divide-homesync-sand">
                  {[
                    { key: 'expenses', label: 'Expense Updates', desc: 'Notified on new shared expenses' },
                    { key: 'chores', label: 'Chore Reminders', desc: 'Daily and overdue chore alerts' },
                    { key: 'meals', label: 'Meal Reminders', desc: 'Updates on planned meals' },
                    { key: 'inventory', label: 'Low Stock Alerts', desc: 'When items need restocking' },
                    { key: 'push', label: 'Push Notifications', desc: 'Enable device push alerts' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-6">
                      <div>
                        <p className="font-body font-bold text-homesync-ink mb-1">
                          {item.label}
                        </p>
                        <p className="font-mono text-[9px] uppercase tracking-widest text-homesync-muted">
                          {item.desc}
                        </p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof NotificationPreferences]}
                        disabled={updateProfile.isPending}
                        onCheckedChange={(checked) => {
                          const updated = { ...notifications, [item.key]: checked };
                          setNotifications(updated);
                          updateProfile.mutate(
                            { notification_preferences: updated },
                            {
                              onSuccess: (profile) => updateUser({ notification_preferences: profile.notification_preferences }),
                              onError: (error) => {
                                setNotifications(notifications);
                                toast.error(error instanceof Error ? error.message : 'Failed to update preference');
                              },
                            }
                          );
                        }}
                        className="data-[state=checked]:bg-homesync-olive"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="rounded-none border-2 border-homesync-rust bg-homesync-rust/5 shadow-none">
              <CardHeader className="border-b-2 border-homesync-rust bg-white dark:bg-homesync-tan pb-6">
                <CardTitle className="font-display text-2xl font-bold text-homesync-rust flex items-center gap-3">
                  <Shield className="w-6 h-6" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-homesync-rust/70 mt-2">
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-white dark:bg-homesync-tan">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-body font-bold text-homesync-ink mb-1">
                      Leave Household
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-homesync-muted">
                      You will lose access to all shared data permanently.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="rounded-none bg-homesync-rust text-white font-mono text-xs uppercase tracking-widest hover:bg-homesync-bark transition-colors px-6">
                        Leave Household
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-none border-2 border-homesync-rust bg-homesync-cream p-0 shadow-[8px_8px_0px_rgba(200,75,49,1)]">
                      <AlertDialogHeader className="p-6 bg-white dark:bg-homesync-tan border-b-2 border-homesync-rust">
                        <AlertDialogTitle className="font-display text-3xl font-black text-homesync-rust">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="font-body text-homesync-muted mt-2">
                          This action cannot be undone. You will lose access to all household data
                          including expenses, chores, and meal plans.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="p-6 bg-homesync-tan border-t-2 border-homesync-rust flex justify-end gap-3 sm:gap-0">
                        <AlertDialogCancel className="rounded-none border-2 border-homesync-ink bg-transparent text-homesync-ink hover:bg-white dark:hover:bg-homesync-tan font-mono text-xs uppercase tracking-widest px-6">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleLeaveHousehold}
                          disabled={leaveHousehold.isPending}
                          className="rounded-none bg-homesync-rust text-white hover:bg-homesync-bark font-mono text-xs uppercase tracking-widest px-6 ml-3"
                        >
                          {leaveHousehold.isPending ? 'Leaving...' : 'Leave'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sign Out */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Button
              variant="outline"
              className="w-full h-16 rounded-none border-2 border-homesync-ink bg-transparent text-homesync-ink hover:bg-homesync-ink hover:text-white font-mono text-sm uppercase tracking-widest transition-all"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </motion.div>
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent className="max-w-md rounded-none border-2 border-homesync-ink bg-homesync-cream p-0 shadow-[8px_8px_0px_rgba(26,18,9,1)]">
            <DialogHeader className="p-6 border-b-2 border-homesync-ink bg-homesync-tan">
              <DialogTitle className="font-display text-3xl font-black text-homesync-ink">Edit Profile</DialogTitle>
              <DialogDescription className="font-body text-homesync-muted text-sm mt-2">
                Update your personal information
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-6">
              <div className="flex justify-center">
                <Avatar className="w-24 h-24 rounded-none border-2 border-homesync-ink">
                  <AvatarImage src={user?.avatar_url} className="rounded-none" />
                  <AvatarFallback className="rounded-none text-2xl font-display font-bold bg-homesync-ink text-homesync-cream">
                    {getInitials(user?.full_name || '')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-body h-12 text-base"
                />
              </div>
            </div>
            <DialogFooter className="p-6 border-t-2 border-homesync-ink bg-homesync-tan flex justify-end gap-3 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setEditProfileOpen(false)}
                disabled={isUpdating}
                className="rounded-none border-2 border-homesync-ink bg-transparent text-homesync-ink hover:bg-homesync-cream font-mono text-xs uppercase tracking-widest px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="rounded-none border-2 border-homesync-ink bg-homesync-ink text-white hover:bg-homesync-bark font-mono text-xs uppercase tracking-widest px-6 sm:ml-3"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}