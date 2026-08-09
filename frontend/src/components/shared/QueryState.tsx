import { Loader2, AlertTriangle } from 'lucide-react';

/**
 * Shared loading/error placeholders for list/data views, styled to match the
 * homesync brutalist aesthetic used across Dashboard/Expenses/Loans/Chores/
 * Meals/Inventory. Pages previously had no isLoading/isError handling at
 * all, so a slow or failed fetch looked identical to "no data yet."
 */
export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 border-2 border-dashed border-homesync-sand text-homesync-muted">
      <Loader2 className="w-6 h-6 animate-spin" />
      <p className="font-mono text-[10px] uppercase tracking-widest">{label}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong loading this data.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 border-2 border-homesync-rust bg-homesync-rust/5 text-homesync-rust text-center px-6">
      <AlertTriangle className="w-6 h-6" />
      <p className="font-mono text-[10px] uppercase tracking-widest">{message}</p>
    </div>
  );
}
