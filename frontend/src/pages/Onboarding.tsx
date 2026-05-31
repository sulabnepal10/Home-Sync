import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Users, ChevronRight, ChevronLeft, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useCreateHousehold, useJoinHousehold } from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

const steps = [
  { id: 'welcome', title: 'Welcome to HomeSync' },
  { id: 'create-or-join', title: 'Set up your home' },
  { id: 'complete', title: 'All set!' },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [action, setAction] = useState<'create' | 'join' | null>(null);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const { user } = useAuthStore();
  const createHousehold = useCreateHousehold();
  const joinHousehold = useJoinHousehold();
  const navigate = useNavigate();

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      toast.error('Please enter a household name');
      return;
    }

    try {
      const household = await createHousehold.mutateAsync({ name: householdName });
      useAuthStore.setState({ household });
      setCurrentStep(2);
    } catch {
      toast.error('Failed to create household');
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    try {
      const household = await joinHousehold.mutateAsync(inviteCode);
      useAuthStore.setState({ household });
      setCurrentStep(2);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join household');
    }
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getStep = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center mx-auto mb-6">
              <Home className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome, {user?.full_name?.split(' ')[0] || 'there'}!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm mx-auto">
              Let's set up your household so you can start managing shared living together.
            </p>
            <Button
              onClick={() => setCurrentStep(1)}
              className="bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white border-0"
            >
              Get Started
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        );

      case 'create-or-join':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Set up your home
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Create a new household or join an existing one
              </p>
            </div>

            <div className="grid gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    action === 'create'
                      ? 'ring-2 ring-sky-500 bg-sky-50 dark:bg-sky-900/20'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  onClick={() => setAction('create')}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center">
                      <Home className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-900 dark:text-white">Create a Household</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Start fresh with your own group
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    action === 'join'
                      ? 'ring-2 ring-sky-500 bg-sky-50 dark:bg-sky-900/20'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  onClick={() => setAction('join')}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-900 dark:text-white">Join a Household</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Use an invite code to join
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {action === 'create' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="household-name">Household Name</Label>
                    <Input
                      id="household-name"
                      placeholder="e.g., The Apartment 4B Crew"
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCreateHousehold}
                    className="w-full bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white border-0"
                    disabled={createHousehold.isPending}
                  >
                    {createHousehold.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Household'
                    )}
                  </Button>
                </motion.div>
              )}

              {action === 'join' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="invite-code">Invite Code</Label>
                    <Input
                      id="invite-code"
                      placeholder="Enter your invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      maxLength={8}
                      className="uppercase"
                    />
                  </div>
                  <Button
                    onClick={handleJoinHousehold}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
                    disabled={joinHousehold.isPending}
                  >
                    {joinHousehold.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join Household'
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setCurrentStep(0)}
              className="flex items-center gap-1 mx-auto mt-6 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              You're all set!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm mx-auto">
              Your household has been {action === 'create' ? 'created' : 'joined'}. Ready to start managing your shared living?
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white border-0"
            >
              Go to Dashboard
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/30 to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full transition-all ${
                index <= currentStep
                  ? 'bg-gradient-to-r from-sky-500 to-teal-500 w-4'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  index < currentStep
                    ? 'bg-gradient-to-r from-sky-500 to-teal-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {getStep()}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

function copied() {
  throw new Error('Function not implemented.');
}
