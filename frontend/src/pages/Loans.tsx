import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Handshake,
  Trash2,
  ArrowRight
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useLoans,
  useLoanBalances,
  useAddLoan,
  useSettleLoan,
  useDeleteLoan
} from '@/hooks/useQueries';

type BalanceRecord = Record<string, { owed: number; lent: number; net: number }>;

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

export default function Loans() {
  useFonts();

  const { user, members, household } = useAuthStore();
  const { data: loans } = useLoans();
  const { data: balances } = useLoanBalances();
  const addLoan = useAddLoan();
  const settleLoan = useSettleLoan();
  const deleteLoan = useDeleteLoan();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'settled' | 'pending'>('all');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [lenderId, setLenderId] = useState('');
  const [borrowerId, setBorrowerId] = useState('');

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const filteredLoans = loans?.filter((loan) => {
    const matchesSearch = loan.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'settled' && loan.is_settled) ||
      (filter === 'pending' && !loan.is_settled);
    return matchesSearch && matchesFilter;
  }) || [];

  const totalOwed = loans?.filter((l) => l.borrower_id === user?.id && !l.is_settled)
    .reduce((sum, l) => sum + Number(l.amount), 0) || 0;

  const totalLent = loans?.filter((l) => l.lender_id === user?.id && !l.is_settled)
    .reduce((sum, l) => sum + Number(l.amount), 0) || 0;

  const netBalance = totalLent - totalOwed;

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
              Debt Tracker
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-homesync-ink tracking-tight">
              Loans & Debts
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Button
              onClick={() => setAddModalOpen(true)}
              className="rounded-none border-2 border-homesync-ink bg-homesync-ink text-homesync-cream hover:bg-homesync-rust hover:border-homesync-rust font-mono text-xs uppercase tracking-widest px-6 py-6 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Loan
            </Button>
          </motion.div>
        </div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-0 mb-12 border-t-2 border-l-2 border-homesync-sand"
        >
          {/* Card 1: You're Owed */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-olive text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center mb-8">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/70 mb-2">You're Owed</p>
              <p className="font-display text-4xl font-bold">
                ${totalLent.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: You Owe */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-rust text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center mb-8">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/70 mb-2">You Owe</p>
              <p className="font-display text-4xl font-bold">
                ${totalOwed.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Net Balance */}
          <Card className={cn(
            'rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand text-white shadow-none hover:bg-homesync-bark transition-colors',
            netBalance >= 0 ? 'bg-homesync-ink' : 'bg-[#3D2B1F]' // homesync-bark variant if negative
          )}>
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/20 flex items-center justify-center mb-8">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/50 mb-2">Net Balance</p>
              <p className="font-display text-4xl font-bold">
                {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balance Overview & Settlement Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid lg:grid-cols-2 gap-6 mb-12"
        >
          {/* Member Balances */}
          <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none h-full flex flex-col">
            <CardHeader className="border-b-2 border-homesync-sand pb-6 bg-homesync-tan">
              <CardTitle className="font-display text-2xl font-bold text-homesync-ink flex items-center gap-3">
                <Users className="w-6 h-6 text-homesync-rust" />
                Member Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 bg-white">
              <div className="divide-y-2 divide-homesync-sand">
                {members.map((member) => {
                  const balanceRecord = balances as BalanceRecord | undefined;
                  const balance = balanceRecord?.[member.user_id] || { owed: 0, lent: 0, net: 0 };
                  return (
                    <div key={member.id} className="flex items-center gap-4 p-5 hover:bg-homesync-cream transition-colors">
                      <Avatar className="w-10 h-10 rounded-none border-2 border-homesync-ink">
                        <AvatarImage src={member.profile?.avatar_url} className="rounded-none" />
                        <AvatarFallback className="text-xs font-mono rounded-none bg-homesync-ink text-white">
                          {getInitials(member.profile?.full_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-lg font-bold text-homesync-ink truncate mb-1">
                          {member.profile?.full_name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className="rounded-none bg-transparent border border-homesync-sand text-homesync-muted font-mono text-[9px] uppercase tracking-widest hover:bg-transparent">
                            Owed: ${balance.owed.toFixed(2)}
                          </Badge>
                          <Badge className="rounded-none bg-transparent border border-homesync-sand text-homesync-muted font-mono text-[9px] uppercase tracking-widest hover:bg-transparent">
                            Lent: ${balance.lent.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                      <div className={cn(
                        'text-right font-mono text-sm font-bold',
                        balance.net >= 0 ? 'text-homesync-olive' : 'text-homesync-rust'
                      )}>
                        {balance.net >= 0 ? '+' : ''}${balance.net.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Settlement Suggestions */}
          <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none h-full flex flex-col">
            <CardHeader className="border-b-2 border-homesync-sand pb-6 bg-homesync-tan">
              <CardTitle className="font-display text-2xl font-bold text-homesync-ink flex items-center gap-3">
                <Handshake className="w-6 h-6 text-homesync-olive" />
                Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 bg-white">
              <div className="divide-y-2 divide-homesync-sand h-full">
                {(() => {
                  const suggestions: { from: string; to: string; amount: number }[] = [];
                  const balanceRecord = balances as BalanceRecord | undefined;
                  const memberBalances = members.map((m) => ({
                    id: m.user_id,
                    name: m.profile?.full_name || '',
                    balance: balanceRecord?.[m.user_id]?.net || 0,
                  }));

                  const debtors = memberBalances.filter((m) => m.balance < 0).sort((a, b) => a.balance - b.balance);
                  const creditors = memberBalances.filter((m) => m.balance > 0).sort((a, b) => b.balance - a.balance);

                  debtors.forEach((debtor) => {
                    creditors.forEach((creditor) => {
                      if (debtor.balance < 0 && creditor.balance > 0) {
                        const amount = Math.min(-debtor.balance, creditor.balance);
                        if (amount > 0.01) {
                          suggestions.push({ from: debtor.id, to: creditor.id, amount });
                          debtor.balance += amount;
                          creditor.balance -= amount;
                        }
                      }
                    });
                  });

                  return suggestions.length > 0 ? suggestions.map((s, i) => {
                    const debtor = members.find((m) => m.user_id === s.from);
                    const creditor = members.find((m) => m.user_id === s.to);
                    return (
                      <div key={i} className="flex items-center gap-4 p-5 hover:bg-homesync-cream transition-colors">
                        <Avatar className="w-8 h-8 rounded-none border border-homesync-ink hidden sm:block">
                          <AvatarImage src={debtor?.profile?.avatar_url} className="rounded-none" />
                          <AvatarFallback className="text-[10px] font-mono rounded-none bg-homesync-tan text-homesync-ink">
                            {getInitials(debtor?.profile?.full_name || '')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 text-sm font-body text-homesync-ink flex flex-col sm:flex-row sm:items-center gap-1">
                          <span className="font-bold">{debtor?.profile?.full_name}</span>
                          <span className="text-homesync-muted font-mono text-[10px] uppercase tracking-widest mx-1 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 hidden sm:inline" />
                            Pays
                          </span>
                          <span className="font-bold">{creditor?.profile?.full_name}</span>
                        </div>

                        <p className="font-display font-bold text-lg text-homesync-ink">
                          ${s.amount.toFixed(2)}
                        </p>
                      </div>
                    );
                  }) : (
                    <div className="h-full flex flex-col items-center justify-center py-16 text-homesync-muted p-6 text-center">
                      <div className="w-16 h-16 border-2 border-homesync-olive bg-homesync-tan flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-homesync-olive" />
                      </div>
                      <p className="font-display text-2xl font-bold text-homesync-ink mb-2">All settled!</p>
                      <p className="font-mono text-xs uppercase tracking-widest text-homesync-muted">No outstanding debts</p>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loans List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-homesync-muted" />
              <Input
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 rounded-none border-2 border-homesync-sand bg-white focus-visible:border-homesync-ink focus-visible:ring-0 font-body text-base h-12"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | 'settled' | 'pending')}>
              <SelectTrigger className="w-full sm:w-48 rounded-none border-2 border-homesync-sand bg-white focus:ring-0 focus:border-homesync-ink h-12 font-mono text-xs uppercase tracking-widest">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2 border-homesync-ink font-mono text-xs uppercase tracking-widest bg-homesync-cream">
                <SelectItem value="all" className="focus:bg-homesync-tan rounded-none">All Loans</SelectItem>
                <SelectItem value="pending" className="focus:bg-homesync-tan rounded-none">Pending</SelectItem>
                <SelectItem value="settled" className="focus:bg-homesync-tan rounded-none">Settled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none">
            <CardContent className="p-0">
              {filteredLoans.length > 0 ? (
                <div className="divide-y-2 divide-homesync-sand bg-white">
                  <AnimatePresence>
                    {filteredLoans.map((loan, index) => (
                      <motion.div
                        key={loan.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-homesync-cream transition-colors"
                      >
                        <div className={cn(
                          'w-12 h-12 border-2 flex items-center justify-center rounded-none flex-shrink-0',
                          loan.is_settled
                            ? 'border-homesync-olive bg-homesync-tan text-homesync-olive'
                            : 'border-homesync-rust bg-homesync-tan text-homesync-rust'
                        )}>
                          <ArrowLeftRight className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-lg text-homesync-ink truncate mb-2">
                            {loan.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted">From</span>
                            <Avatar className="w-5 h-5 rounded-none border border-homesync-ink">
                              <AvatarImage src={loan.lender?.avatar_url} className="rounded-none" />
                              <AvatarFallback className="text-[8px] font-mono rounded-none bg-homesync-ink text-white">
                                {getInitials(loan.lender?.full_name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-body text-xs font-bold text-homesync-ink">{loan.lender?.full_name}</span>

                            <ArrowRight className="w-3 h-3 text-homesync-sand mx-1" />

                            <span className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted">To</span>
                            <Avatar className="w-5 h-5 rounded-none border border-homesync-ink">
                              <AvatarImage src={loan.borrower?.avatar_url} className="rounded-none" />
                              <AvatarFallback className="text-[8px] font-mono rounded-none bg-homesync-tan text-homesync-ink">
                                {getInitials(loan.borrower?.full_name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-body text-xs font-bold text-homesync-ink">{loan.borrower?.full_name}</span>
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 mt-4 sm:mt-0">
                          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                            <p className="font-display font-bold text-xl text-homesync-ink">
                              ${parseFloat(String(loan.amount)).toFixed(2)}
                            </p>
                            {loan.is_settled ? (
                              <Badge className="font-mono text-[9px] tracking-widest uppercase bg-homesync-olive text-white rounded-none border-none">
                                Settled
                              </Badge>
                            ) : (
                              <Badge className="font-mono text-[9px] tracking-widest uppercase bg-transparent border-2 border-homesync-rust text-homesync-rust rounded-none">
                                Pending
                              </Badge>
                            )}
                          </div>

                          {/* Action Buttons (Only show to the lender) */}
                          {user?.id === loan.lender_id && (
                            <div className="flex items-center gap-2">
                              {!loan.is_settled && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-none border-2 border-homesync-olive text-homesync-olive hover:bg-homesync-olive hover:text-white font-mono text-[10px] uppercase tracking-widest px-3"
                                  disabled={settleLoan.isPending}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    settleLoan.mutate(loan.id, {
                                      onSuccess: () => toast.success('Loan marked as settled!')
                                    });
                                  }}
                                >
                                  Settle
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-none border-2 border-homesync-rust text-homesync-rust hover:bg-homesync-rust hover:text-white"
                                disabled={deleteLoan.isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Are you sure you want to delete this loan?')) {
                                    deleteLoan.mutate(loan.id, {
                                      onSuccess: () => toast.success('Loan deleted')
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-homesync-muted bg-white border-2 border-dashed border-homesync-sand m-4">
                  <ArrowLeftRight className="w-12 h-12 mb-4 text-homesync-sand opacity-50" />
                  <p className="font-display text-2xl font-bold text-homesync-ink mb-2">
                    No records found
                  </p>
                  <p className="font-mono text-xs uppercase tracking-widest text-homesync-muted text-center px-4">
                    {searchQuery ? 'Adjust your search filters' : 'Record a loan to start tracking debts'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Loan Modal */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="max-w-md rounded-none border-2 border-homesync-ink bg-homesync-cream p-0 shadow-[8px_8px_0px_rgba(26,18,9,1)]">
            <DialogHeader className="p-6 border-b-2 border-homesync-ink bg-homesync-tan">
              <DialogTitle className="font-display text-3xl font-black text-homesync-ink">Record Loan</DialogTitle>
              <DialogDescription className="font-body text-homesync-muted text-sm mt-2">
                Track money lent or borrowed between household members.
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-6">

              <div className="space-y-3">
                <Label htmlFor="loan-amount" className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-homesync-muted font-mono">$</span>
                  <Input
                    id="loan-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 rounded-none border-2 border-homesync-sand bg-white focus-visible:border-homesync-ink focus-visible:ring-0 font-mono text-lg h-12"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="loan-description" className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Description</Label>
                <Input
                  id="loan-description"
                  placeholder="What was this loan for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-none border-2 border-homesync-sand bg-white focus-visible:border-homesync-ink focus-visible:ring-0 font-body h-12"
                />
              </div>

              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Borrower</Label>
                <Select value={borrowerId} onValueChange={setBorrowerId}>
                  <SelectTrigger className="rounded-none border-2 border-homesync-sand bg-white focus:ring-0 focus:border-homesync-ink h-12 font-body">
                    <SelectValue placeholder="Select borrower" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-homesync-ink bg-homesync-cream font-body">
                    {members.filter((m) => m.user_id !== lenderId).map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id} className="focus:bg-homesync-tan rounded-none cursor-pointer">
                        {member.profile?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="p-6 border-t-2 border-homesync-ink bg-homesync-tan flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={addLoan.isPending}
                className="rounded-none border-2 border-homesync-ink bg-transparent text-homesync-ink hover:bg-homesync-cream font-mono text-xs uppercase tracking-widest px-6"
              >
                Cancel
              </Button>
              <Button
                disabled={addLoan.isPending}
                onClick={() => {
                  if (!household?.id) {
                    toast.error('Household ID is missing');
                    return;
                  }
                  if (!amount || !description || !borrowerId) {
                    toast.error('Please fill all required fields');
                    return;
                  }
                  if (borrowerId === user?.id) {
                    toast.error('You cannot lend money to yourself');
                    return;
                  }
                  addLoan.mutate(
                    {
                      household_id: household.id,
                      borrower_id: borrowerId,
                      amount: Number(amount),
                      description: description,
                    },
                    {
                      onSuccess: () => {
                        toast.success('Loan recorded successfully!');
                        setAddModalOpen(false);
                        setAmount('');
                        setDescription('');
                        setBorrowerId('');
                        setLenderId('');
                      },
                      onError: (error) => {
                        toast.error(error.message || 'Failed to record loan');
                      }
                    }
                  );
                }}
                className="rounded-none border-2 border-homesync-ink bg-homesync-rust text-white hover:bg-homesync-bark font-mono text-xs uppercase tracking-widest px-6"
              >
                {addLoan.isPending ? 'Recording...' : 'Record Loan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}