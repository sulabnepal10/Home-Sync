import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Palette,
  Users,
  Shield,
  LogOut,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Copy,
  Check,
  Trash2,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import type { Profile } from '@/types';

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, household, members, signOut, updateUser } = useAuthStore();

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [notifications, setNotifications] = useState({
    expenses: true,
    chores: true,
    meals: true,
    inventory: true,
    email: false,
    push: true,
  });

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
    <ScrollArea className="h-screen">
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your account and household preferences
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile
                </CardTitle>
                <CardDescription>
                  Manage your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-sky-500 to-teal-500 text-white">
                      {getInitials(user?.full_name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-lg text-slate-900 dark:text-white">
                      {user?.full_name}
                    </p>
                    <p className="text-sm text-slate-500">{user?.id}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setEditProfileOpen(true)}
                  >
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Household Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Household
                </CardTitle>
                <CardDescription>
                  Manage your household settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {household?.name}
                      </p>
                      <p className="text-sm text-slate-500">{members.length} members</p>
                    </div>
                    <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-0">
                      Active
                    </Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <Label className="text-sm text-slate-500">Invite Code</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                        {household?.invite_code}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyInviteCode}
                        className="h-8 w-8"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-teal-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Share this code with roommates to invite them to your household
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-3">
                      Members
                    </h3>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900"
                        >
                          <Avatar>
                            <AvatarImage src={member.profile?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-teal-500 text-white">
                              {getInitials(member.profile?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {member.profile?.full_name}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">
                              {member.role}
                            </p>
                          </div>
                          {member.user_id === user?.id && (
                            <Badge variant="outline">You</Badge>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {themes.map((t) => {
                      const Icon = t.icon;
                      return (
                        <motion.button
                          key={t.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setTheme(t.value)}
                          className={cn(
                            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                            theme === t.value
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-6 h-6',
                              theme === t.value
                                ? 'text-sky-500'
                                : 'text-slate-400'
                            )}
                          />
                          <span
                            className={cn(
                              'text-sm font-medium',
                              theme === t.value
                                ? 'text-sky-600 dark:text-sky-400'
                                : 'text-slate-600 dark:text-slate-400'
                            )}
                          >
                            {t.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Expense Updates
                      </p>
                      <p className="text-sm text-slate-500">
                        Get notified about new expenses
                      </p>
                    </div>
                    <Switch
                      checked={notifications.expenses}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, expenses: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Chore Reminders
                      </p>
                      <p className="text-sm text-slate-500">
                        Daily chore notifications
                      </p>
                    </div>
                    <Switch
                      checked={notifications.chores}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, chores: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Meal Reminders
                      </p>
                      <p className="text-sm text-slate-500">
                        Get notified about planned meals
                      </p>
                    </div>
                    <Switch
                      checked={notifications.meals}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, meals: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Low Stock Alerts
                      </p>
                      <p className="text-sm text-slate-500">
                        Notifications when items are running low
                      </p>
                    </div>
                    <Switch
                      checked={notifications.inventory}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, inventory: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Push Notifications
                      </p>
                      <p className="text-sm text-slate-500">
                        Receive push notifications
                      </p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, push: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-red-200 dark:border-red-800/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      Leave Household
                    </p>
                    <p className="text-sm text-slate-500">
                      You will lose access to all household data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        Leave Household
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. You will lose access to all household data
                          including expenses, chores, and meal plans.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                          Leave
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sign Out */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              variant="outline"
              className="w-full"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your personal information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-sky-500 to-teal-500 text-white">
                    {getInitials(user?.full_name || '')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditProfileOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white border-0"
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
