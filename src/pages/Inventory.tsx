import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Droplets,
  ShoppingCart,
  Check,
  Filter,
  Battery,
  Apple,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';
import { useInventory, useLowStockItems } from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const categories = [
  { value: 'groceries', label: 'Groceries', icon: Apple },
  { value: 'supplies', label: 'Household Supplies', icon: Sparkles },
  { value: 'appliances', label: 'Appliances', icon: Battery },
];

export default function Inventory() {
  const { user, household } = useAuthStore();
  const { data: inventory, isLoading } = useInventory();
  const { data: lowStockItems } = useLowStockItems();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);

  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('groceries');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [itemMinQuantity, setItemMinQuantity] = useState('1');

  const filteredItems = inventory?.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Group items by category
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'groceries';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof filteredItems>);

  // Calculate stats
  const totalItems = inventory?.length || 0;
  const lowStockCount = lowStockItems?.length || 0;
  const groceryItems = inventory?.filter((i) => i.category === 'groceries').length || 0;

  return (
    <ScrollArea className="h-screen">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Shared Inventory
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Track and manage your household items
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Button
              onClick={() => setAddItemModalOpen(true)}
              className="bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-cyan-500 to-sky-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-cyan-100">Total Items</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500 to-pink-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-rose-100">Low Stock</p>
                  <p className="text-2xl font-bold">{lowStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-teal-100">Groceries</p>
                  <p className="text-2xl font-bold">{groceryItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alert */}
        {lowStockItems && lowStockItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-rose-900 dark:text-rose-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {lowStockItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-700"
                    >
                      <Package className="w-4 h-4 text-rose-500" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0">
                        {item.quantity} {item.unit} left
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Inventory Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          {Object.entries(itemsByCategory).map(([category, items]) => {
            const categoryInfo = categories.find((c) => c.value === category) || {
              label: category,
              icon: Package,
            };
            const Icon = categoryInfo.icon;

            return (
              <Card key={category} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {categoryInfo.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item, index) => {
                      const isLowStock = item.quantity <= item.min_quantity;
                      const stockPercentage = Math.min(
                        (item.quantity / (item.min_quantity * 3)) * 100,
                        100
                      );

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          className={cn(
                            'p-4 rounded-xl border transition-all cursor-pointer',
                            isLowStock
                              ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {item.name}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {item.quantity} {item.unit}
                              </p>
                            </div>
                            {isLowStock && (
                              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low
                              </Badge>
                            )}
                          </div>

                          <Progress
                            value={stockPercentage}
                            className={cn(
                              'h-2',
                              isLowStock && '[&>div]:bg-rose-500'
                            )}
                          />

                          {item.last_purchased && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              Last purchased{' '}
                              {formatDistanceToNow(new Date(item.last_purchased), {
                                addSuffix: true,
                              })}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredItems.length === 0 && (
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-slate-200 dark:border-slate-700">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-slate-500">
                  <Package className="w-16 h-16 mb-4 text-slate-300" />
                  <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                    No items found
                  </p>
                  <p className="text-sm">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : 'Add items to track your shared inventory'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Add Item Modal */}
        <Dialog open={addItemModalOpen} onOpenChange={setAddItemModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Add an item to your shared inventory.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input
                  id="item-name"
                  placeholder="e.g., Milk, Paper Towels, Water Jars"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={itemCategory} onValueChange={setItemCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={itemUnit} onValueChange={setItemUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="gallons">Gallons</SelectItem>
                      <SelectItem value="pieces">Pieces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Low Stock Threshold</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={itemMinQuantity}
                    onChange={(e) => setItemMinQuantity(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAddItemModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!itemName || !itemQuantity) {
                    toast.error('Please fill in all required fields');
                    return;
                  }
                  toast.success('Item added to inventory');
                  setAddItemModalOpen(false);
                }}
                className="bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white border-0"
              >
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}
