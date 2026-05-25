import { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
// ForceGraph component would be implemented separately
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
import { useLoans, useLoanBalances } from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type BalanceRecord = Record<string, { owed: number; lent: number; net: number }>;

export default function Loans() {
  const { user, members } = useAuthStore();
  const { data: loans } = useLoans();
  const { data: balances } = useLoanBalances();
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

  // Graph data for visualization
  const graphNodes = members.map((member) => ({
    id: member.user_id,
    data: member.profile,
  }));

  const graphLinks = loans?.filter((l) => !l.is_settled).map((loan) => ({
    source: loan.lender_id,
    target: loan.borrower_id,
    amount: Number(loan.amount),
  })) || [];

  return (
    <ScrollArea className="h-screen">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Loans & Debts
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Track who owes whom in your household
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Button
              onClick={() => setAddModalOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
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
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-teal-100">You're Owed</p>
                  <p className="text-2xl font-bold">${totalLent.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-amber-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-orange-100">You Owe</p>
                  <p className="text-2xl font-bold">${totalOwed.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            'border-0 text-white',
            netBalance >= 0
              ? 'bg-gradient-to-br from-sky-500 to-blue-600'
              : 'bg-gradient-to-br from-rose-500 to-pink-600'
          )}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-sky-100">Net Balance</p>
                  <p className="text-2xl font-bold">
                    {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid lg:grid-cols-2 gap-6 mb-8"
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Member Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => {
                  const balanceRecord = balances as BalanceRecord | undefined;
                  const balance = balanceRecord?.[member.user_id] || { owed: 0, lent: 0, net: 0 };
                  return (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
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
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Owed: ${balance.owed.toFixed(2)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Lent: ${balance.lent.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                      <div className={cn(
                        'text-right font-semibold',
                        balance.net >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-orange-600 dark:text-orange-400'
                      )}>
                        {balance.net >= 0 ? '+' : ''}${balance.net.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Handshake className="w-5 h-5" />
                Settlement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  // Simple settlement suggestions
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
                          suggestions.push({
                            from: debtor.id,
                            to: creditor.id,
                            amount,
                          });
                        }
                      }
                    });
                  });

                  return suggestions.length > 0 ? suggestions.map((s) => {
                    const debtor = members.find((m) => m.user_id === s.from);
                    const creditor = members.find((m) => m.user_id === s.to);
                    return (
                      <div key={`${s.from}-${s.to}`} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={debtor?.profile?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {getInitials(debtor?.profile?.full_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={creditor?.profile?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {getInitials(creditor?.profile?.full_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm text-slate-900 dark:text-white">
                            {debtor?.profile?.full_name} pays {creditor?.profile?.full_name}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          ${s.amount.toFixed(2)}
                        </p>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-teal-500" />
                      <p className="font-medium text-slate-900 dark:text-white">All settled!</p>
                      <p className="text-sm">No outstanding debts to settle</p>
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
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search loans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | 'settled' | 'pending')}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Loans</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
            <CardContent className="p-0">
              {filteredLoans.length > 0 ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredLoans.map((loan, index) => (
                    <motion.div
                      key={loan.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        loan.is_settled
                          ? 'bg-teal-100 dark:bg-teal-900/30'
                          : 'bg-orange-100 dark:bg-orange-900/30'
                      )}>
                        <ArrowLeftRight className={cn(
                          'w-6 h-6',
                          loan.is_settled
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-orange-600 dark:text-orange-400'
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {loan.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={loan.lender?.avatar_url} />
                            <AvatarFallback className="text-[6px]">
                              {getInitials(loan.lender?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={loan.borrower?.avatar_url} />
                            <AvatarFallback className="text-[6px]">
                              {getInitials(loan.borrower?.full_name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-slate-500">
                            {loan.lender?.full_name} lent to {loan.borrower?.full_name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          ${parseFloat(String(loan.amount)).toFixed(2)}
                        </p>
                        {loan.is_settled ? (
                          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-0">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Settled
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <ArrowLeftRight className="w-16 h-16 mb-4 text-slate-300" />
                  <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                    No loans yet
                  </p>
                  <p className="text-sm">
                    {searchQuery ? 'Try adjusting your search' : 'Record a loan to track debts between members'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Loan Modal */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record a Loan</DialogTitle>
              <DialogDescription>
                Track money lent or borrowed between household members.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="loan-amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    id="loan-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loan-description">Description</Label>
                <Input
                  id="loan-description"
                  placeholder="What was this loan for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lender</Label>
                  <Select value={lenderId} onValueChange={setLenderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lender" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.profile?.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Borrower</Label>
                  <Select value={borrowerId} onValueChange={setBorrowerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select borrower" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.filter((m) => m.user_id !== lenderId).map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.profile?.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!amount || !description || !lenderId || !borrowerId) {
                    toast.error('Please fill all fields');
                    return;
                  }
                  // Add loan mutation would go here
                  toast.success('Loan recorded');
                  setAddModalOpen(false);
                }}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
              >
                Record Loan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return <ArrowUpRight className={className} />;
}
