import { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Plus, Pause, Play, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  useRecurringBills,
  useCreateRecurringBill,
  useUpdateRecurringBill,
  useDeleteRecurringBill,
} from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

/**
 * Recurring bills are always split equally across the whole household —
 * percentage/custom recurring splits are intentionally out of scope here to
 * keep the "set it and forget it" use case (rent, utilities) simple. The
 * one-off Expenses split UI still supports all three split types.
 */
export function RecurringBillsPanel() {
  const { household } = useAuthStore();
  const { data: bills, isLoading, isError } = useRecurringBills();
  const createBill = useCreateRecurringBill();
  const updateBill = useUpdateRecurringBill();
  const deleteBill = useDeleteRecurringBill();

  const [modalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [nextDueDate, setNextDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setFrequency('monthly');
    setNextDueDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleCreate = async () => {
    if (!household) return;
    const amountNum = parseFloat(amount);
    if (!description || isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please fill in a description and a valid amount');
      return;
    }
    try {
      await createBill.mutateAsync({
        household_id: household.id,
        description,
        amount: amountNum,
        split_type: 'equal',
        frequency,
        next_due_date: nextDueDate,
      });
      toast.success('Recurring bill created');
      setModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create recurring bill');
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateBill.mutate(
      { id, is_active: !isActive },
      {
        onSuccess: () => toast.success(isActive ? 'Bill paused' : 'Bill resumed'),
        onError: (error) => toast.error(error.message || 'Failed to update bill'),
      }
    );
  };

  const handleDelete = (id: string, label: string) => {
    if (!window.confirm(`Delete the recurring bill "${label}"?`)) return;
    deleteBill.mutate(id, {
      onSuccess: () => toast.success('Recurring bill deleted'),
      onError: (error) => toast.error(error.message || 'Failed to delete recurring bill'),
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
      <Card className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none">
        <CardHeader className="border-b-2 border-homesync-sand bg-homesync-tan pb-6 flex-row items-center justify-between space-y-0">
          <CardTitle className="font-display text-2xl font-bold text-homesync-ink flex items-center gap-3">
            <Repeat className="w-6 h-6 text-homesync-rust" />
            Recurring Bills
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="rounded-none border-2 border-homesync-ink bg-homesync-ink text-white hover:bg-homesync-rust hover:border-homesync-rust font-mono text-[10px] uppercase tracking-widest"
          >
            <Plus className="w-3 h-3 mr-2" />
            New
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState label="Loading recurring bills..." />
          ) : isError ? (
            <ErrorState message="Failed to load recurring bills." />
          ) : bills && bills.length > 0 ? (
            <div className="divide-y-2 divide-homesync-sand bg-white">
              {bills.map((bill) => (
                <div key={bill.id} className="flex items-center gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-lg text-homesync-ink truncate">
                      {bill.description}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted mt-1">
                      ${Number(bill.amount).toFixed(2)} · {bill.frequency} · next {format(new Date(bill.next_due_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge
                    className={`rounded-none font-mono text-[9px] uppercase tracking-widest hover:bg-transparent ${
                      bill.is_active
                        ? 'bg-transparent border-2 border-homesync-olive text-homesync-olive'
                        : 'bg-transparent border-2 border-homesync-sand text-homesync-muted'
                    }`}
                  >
                    {bill.is_active ? 'Active' : 'Paused'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={bill.is_active ? 'Pause bill' : 'Resume bill'}
                    onClick={() => handleToggleActive(bill.id, bill.is_active)}
                    disabled={updateBill.isPending}
                    className="h-8 w-8 rounded-none border-2 border-homesync-ink text-homesync-ink hover:bg-homesync-ink hover:text-white"
                  >
                    {bill.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Delete recurring bill"
                    onClick={() => handleDelete(bill.id, bill.description)}
                    disabled={deleteBill.isPending}
                    className="h-8 w-8 rounded-none border-2 border-homesync-rust text-homesync-rust hover:bg-homesync-rust hover:text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-homesync-muted bg-white">
              <Repeat className="w-10 h-10 mb-3 text-homesync-sand opacity-50" />
              <p className="font-mono text-[10px] uppercase tracking-widest">
                No recurring bills yet — set up rent or utilities to auto-generate monthly.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md rounded-none border-2 border-homesync-ink bg-homesync-cream p-0 shadow-[8px_8px_0px_rgba(26,18,9,1)]">
          <DialogHeader className="p-6 border-b-2 border-homesync-ink bg-homesync-tan">
            <DialogTitle className="font-display text-3xl font-black text-homesync-ink">New Recurring Bill</DialogTitle>
            <DialogDescription className="font-body text-homesync-muted text-sm mt-2">
              Auto-generates a split expense on schedule, e.g. monthly rent.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Description</Label>
              <Input
                placeholder="e.g. Rent, Internet, Electric"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-none border-2 border-homesync-sand bg-white focus-visible:border-homesync-ink focus-visible:ring-0 font-body h-12"
              />
            </div>
            <div className="space-y-3">
              <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-homesync-muted font-mono">$</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 rounded-none border-2 border-homesync-sand bg-white focus-visible:border-homesync-ink focus-visible:ring-0 font-mono text-lg h-12"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as 'weekly' | 'monthly')}>
                  <SelectTrigger className="rounded-none border-2 border-homesync-sand bg-white focus:ring-0 focus:border-homesync-ink h-12 font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-homesync-ink bg-homesync-cream font-body">
                    <SelectItem value="weekly" className="focus:bg-homesync-tan rounded-none cursor-pointer">Weekly</SelectItem>
                    <SelectItem value="monthly" className="focus:bg-homesync-tan rounded-none cursor-pointer">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">First Due Date</Label>
                <Input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="rounded-none border-2 border-homesync-sand bg-white focus-visible:border-homesync-ink focus-visible:ring-0 font-body h-12"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 border-t-2 border-homesync-ink bg-homesync-tan flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="rounded-none border-2 border-homesync-ink bg-transparent text-homesync-ink hover:bg-homesync-cream font-mono text-xs uppercase tracking-widest px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createBill.isPending}
              className="rounded-none border-2 border-homesync-ink bg-homesync-rust text-white hover:bg-homesync-bark font-mono text-xs uppercase tracking-widest px-6"
            >
              {createBill.isPending ? 'Saving...' : 'Create Bill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
