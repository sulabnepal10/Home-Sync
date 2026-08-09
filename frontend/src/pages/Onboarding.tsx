import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Users, ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateHousehold, useJoinHousehold } from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

/* ─── Google Fonts injected once ─── */
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

/* ─── GRAIN OVERLAY ─── */
const grainSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.07'/%3E%3C/svg%3E")`;

const steps = [
  { id: 'welcome', title: 'Welcome to HomeSync' },
  { id: 'create-or-join', title: 'Set up your home' },
  { id: 'complete', title: 'All set!' },
];

export default function Onboarding() {
  useFonts(); // Load typography
  const [currentStep, setCurrentStep] = useState(0);
  const [action, setAction] = useState<'create' | 'join' | null>(null);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

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
      useAuthStore.getState().setHousehold(household);
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
      useAuthStore.getState().setHousehold(household);
      setCurrentStep(2);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join household');
    }
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
            <div className="w-16 h-16 bg-homesync-rust flex items-center justify-center mx-auto mb-8 -rotate-3">
              <Home className="w-8 h-8 text-white" />
            </div>

            <h2 className="font-display text-4xl font-black text-homesync-ink mb-4 tracking-tight">
              Welcome, <em className="italic text-homesync-rust">{user?.full_name?.split(' ')[0] || 'there'}!</em>
            </h2>
            <p className="text-homesync-muted mb-10 max-w-sm mx-auto leading-relaxed">
              Let's set up your household so you can start managing shared living together.
            </p>
            <Button
              onClick={() => setCurrentStep(1)}
              className="font-mono text-xs tracking-[0.1em] uppercase bg-homesync-rust text-white border-2 border-homesync-rust hover:bg-homesync-bark hover:border-homesync-bark hover:-translate-y-0.5 transition-all rounded-none px-8 py-6"
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
            <div className="text-center mb-10">
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-homesync-rust flex items-center justify-center gap-3 mb-4">
                <div className="w-6 h-[1.5px] bg-homesync-rust" />
                Set up your home
                <div className="w-6 h-[1.5px] bg-homesync-rust" />
              </div>
              <h2 className="font-display text-3xl font-black text-homesync-ink mb-2 tracking-tight">
                Create or Join
              </h2>
            </div>

            <div className="grid gap-4 mb-8">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <div
                  className={`cursor-pointer transition-colors p-5 border-2 ${action === 'create'
                      ? 'border-homesync-rust bg-homesync-tan'
                      : 'border-homesync-sand bg-transparent hover:bg-homesync-tan'
                    }`}
                  onClick={() => setAction('create')}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 border-2 border-homesync-rust text-homesync-rust flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-homesync-ink text-lg font-display mb-1">Create a Household</p>
                      <p className="text-sm text-homesync-muted">Start fresh with your own group</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <div
                  className={`cursor-pointer transition-colors p-5 border-2 ${action === 'join'
                      ? 'border-homesync-olive bg-homesync-tan'
                      : 'border-homesync-sand bg-transparent hover:bg-homesync-tan'
                    }`}
                  onClick={() => setAction('join')}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 border-2 border-homesync-olive text-homesync-olive flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-homesync-ink text-lg font-display mb-1">Join a Household</p>
                      <p className="text-sm text-homesync-muted">Use an invite code to join</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {action === 'create' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <Label htmlFor="household-name" className="font-mono text-xs uppercase tracking-widest text-homesync-muted">
                      Household Name
                    </Label>
                    <Input
                      id="household-name"
                      placeholder="e.g., The Apartment 4B Crew"
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                      className="rounded-none border-2 border-homesync-sand bg-transparent p-6 focus-visible:ring-0 focus-visible:border-homesync-rust font-body text-homesync-ink placeholder:text-homesync-muted/50 text-base"
                    />
                  </div>
                  <Button
                    onClick={handleCreateHousehold}
                    className="w-full font-mono text-xs tracking-[0.1em] uppercase bg-homesync-rust text-white border-2 border-homesync-rust hover:bg-homesync-bark hover:border-homesync-bark hover:-translate-y-0.5 transition-all rounded-none py-6"
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
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <Label htmlFor="invite-code" className="font-mono text-xs uppercase tracking-widest text-homesync-muted">
                      Invite Code
                    </Label>
                    <Input
                      id="invite-code"
                      placeholder="Enter your invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      maxLength={8}
                      className="uppercase rounded-none border-2 border-homesync-sand bg-transparent p-6 focus-visible:ring-0 focus-visible:border-homesync-olive font-body text-homesync-ink placeholder:text-homesync-muted/50 text-base"
                    />
                  </div>
                  <Button
                    onClick={handleJoinHousehold}
                    className="w-full font-mono text-xs tracking-[0.1em] uppercase bg-homesync-olive text-white border-2 border-homesync-olive hover:bg-homesync-bark hover:border-homesync-bark hover:-translate-y-0.5 transition-all rounded-none py-6"
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
              className="flex items-center justify-center gap-2 mx-auto mt-8 font-mono text-[11px] uppercase tracking-widest text-homesync-muted hover:text-homesync-ink transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Go Back
            </button>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 border-2 border-homesync-olive flex items-center justify-center mx-auto mb-8 rounded-full">
              <Check className="w-10 h-10 text-homesync-olive" />
            </div>
            <h2 className="font-display text-4xl font-black text-homesync-ink mb-4 tracking-tight">
              You're <em className="italic text-homesync-olive">all set!</em>
            </h2>
            <p className="text-homesync-muted mb-10 max-w-sm mx-auto leading-relaxed">
              Your household has been {action === 'create' ? 'created' : 'joined'}. Ready to start managing your shared living?
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="font-mono text-xs tracking-[0.1em] uppercase bg-homesync-ink text-homesync-cream border-2 border-homesync-ink hover:bg-homesync-rust hover:border-homesync-rust hover:-translate-y-0.5 transition-all rounded-none px-8 py-6"
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
    <div className="min-h-screen relative flex items-center justify-center bg-homesync-cream font-body text-homesync-ink p-4 overflow-hidden">
      {/* Global Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[999] opacity-40 mix-blend-overlay"
        style={{ backgroundImage: grainSvg }}
        aria-hidden="true"
      />

      {/* Progress indicator */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`transition-all duration-300 ${index <= currentStep
                  ? 'bg-homesync-rust w-2 h-2 rotate-45'
                  : 'bg-homesync-sand/50 w-2 h-2 rotate-45'
                }`}
            />
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-[1px] ml-3 transition-colors duration-300 ${index < currentStep
                    ? 'bg-homesync-rust'
                    : 'bg-homesync-sand/50'
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-[480px] bg-homesync-cream border-2 border-homesync-sand p-10 relative z-10">
        <AnimatePresence mode="wait">
          {getStep()}
        </AnimatePresence>
      </div>
    </div>
  );
}