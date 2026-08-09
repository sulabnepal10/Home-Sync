import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Landing point for supabase.auth.signInWithOAuth's redirectTo. The
 * onAuthStateChange listener in App.tsx already picks up the resulting
 * session and calls fetchProfile — this just waits for that to resolve
 * (or fails visibly) and routes on, rather than exposing any UI of its own.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        toast.error('Sign-in failed. Please try again.');
        navigate('/auth');
        return;
      }
      navigate('/');
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-homesync-cream">
      <div className="flex flex-col items-center gap-3 text-homesync-muted">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="font-mono text-[10px] uppercase tracking-widest">Signing you in...</p>
      </div>
    </div>
  );
}
