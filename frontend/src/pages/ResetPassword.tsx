import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Reached via the link in a Supabase password-recovery email
 * (resetPasswordForEmail's redirectTo). Supabase attaches a temporary
 * recovery session to the client automatically when the link is opened, so
 * this page just waits for that session and then lets the user set a new
 * password with supabase.auth.updateUser.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
      }
    });

    // The recovery session may already be attached by the time this mounts.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated! Redirecting...');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-homesync-cream font-body text-homesync-ink p-4">
      <div className="w-full max-w-[420px] border-2 border-homesync-sand bg-white p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-homesync-rust flex items-center justify-center -rotate-3">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-mono text-xs tracking-[0.15em] uppercase text-homesync-ink font-medium">
            HomeSync
          </span>
        </div>

        <h1 className="font-display text-3xl font-black text-homesync-ink mb-2 tracking-tight">
          Set a new password
        </h1>

        {!ready ? (
          <div className="flex flex-col items-center gap-3 py-10 text-homesync-muted">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="font-mono text-[10px] uppercase tracking-widest">Verifying reset link...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <div className="space-y-2">
              <label htmlFor="new-password" className="font-mono text-xs uppercase tracking-widest text-homesync-muted">
                New password
              </label>
              <div className="flex items-center gap-2 border-2 border-homesync-sand px-3 py-3 focus-within:border-homesync-ink">
                <Lock className="w-4 h-4 text-homesync-muted" />
                <input
                  id="new-password"
                  type="password"
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="font-mono text-xs uppercase tracking-widest text-homesync-muted">
                Confirm password
              </label>
              <div className="flex items-center gap-2 border-2 border-homesync-sand px-3 py-3 focus-within:border-homesync-ink">
                <Lock className="w-4 h-4 text-homesync-muted" />
                <input
                  id="confirm-password"
                  type="password"
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-homesync-ink text-white font-mono text-xs uppercase tracking-widest py-4 hover:bg-homesync-bark transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
