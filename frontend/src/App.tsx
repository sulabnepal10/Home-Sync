import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Expenses from '@/pages/Expenses';
import Loans from '@/pages/Loans';
import Chores from '@/pages/Chores';
import Meals from '@/pages/Meals';
import Inventory from '@/pages/Inventory';
import Settings from '@/pages/Settings';
import Onboarding from '@/pages/Onboarding';
import AppLayout from '@/components/layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }): JSX.Element {
  const { isAuthenticated, isLoading, household } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-teal-500 animate-spin" style={{ animationDuration: '1.5s' }} />
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Loading your home...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!household) {
    return <Navigate to="/onboarding" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { fetchProfile, isAuthenticated, household } = useAuthStore();

  useEffect(() => {
    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile();
      } else {
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          household: null,
          members: [],
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return (
    <Routes>
      <Route path="/" element={!isAuthenticated ? <Landing /> : <Navigate to={household ? '/dashboard' : '/onboarding'} replace />} />
      <Route path="/auth" element={isAuthenticated ? <Navigate to={household ? '/dashboard' : '/onboarding'} replace /> : <Auth />} />
      <Route path="/onboarding" element={isAuthenticated && !household ? <Onboarding /> : <Navigate to="/" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
      <Route path="/chores" element={<ProtectedRoute><Chores /></ProtectedRoute>} />
      <Route path="/meals" element={<ProtectedRoute><Meals /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
