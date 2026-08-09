import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFonts } from '@/hooks/useFonts';
import { GrainOverlay } from '@/components/shared/GrainOverlay';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ShoppingCart,
  Filter,
  Battery,
  Apple,
  Sparkles,
  Minus,
  Trash2
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
import {
  useInventory,
  useLowStockItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useRestockItem,
  useDeleteInventoryItem
} from '@/hooks/useQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';



const categories = [
  { value: 'groceries', label: 'Groceries', icon: Apple },
  { value: 'supplies', label: 'Household Supplies', icon: Sparkles },
  { value: 'appliances', label: 'Appliances', icon: Battery },
];

export default function Inventory() {
  useFonts();

  const { household } = useAuthStore();
  const { data: inventory, isLoading, isError } = useInventory();
  const { data: lowStockItems } = useLowStockItems();

  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const restockItem = useRestockItem();
  const deleteItem = useDeleteInventoryItem();

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
    <ScrollArea className="h-screen bg-homesync-cream font-body text-homesync-ink relative">
      <GrainOverlay />

      <div className="p-6 lg:p-10 max-w-[1200px] mx-auto relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 border-b-2 border-homesync-sand pb-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-homesync-rust flex items-center gap-3 mb-3">
              <div className="w-8 h-[1.5px] bg-homesync-rust" />
              Stock Management
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-homesync-ink tracking-tight">
              Shared Inventory
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Button
              onClick={() => setAddItemModalOpen(true)}
              className="rounded-none border-2 border-homesync-ink bg-homesync-ink text-homesync-cream hover:bg-homesync-rust hover:border-homesync-rust font-mono text-xs uppercase tracking-widest px-6 py-6 transition-colors"
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
          className="grid grid-cols-1 sm:grid-cols-3 gap-0 mb-12 border-t-2 border-l-2 border-homesync-sand"
        >
          {/* Card 1: Total Items */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-olive text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center mb-8">
                <Package className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/70 mb-2">Total Items</p>
              <p className="font-display text-4xl font-bold">{totalItems}</p>
            </CardContent>
          </Card>

          {/* Card 2: Low Stock */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-rust text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/30 flex items-center justify-center mb-8">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/70 mb-2">Low Stock</p>
              <p className="font-display text-4xl font-bold">{lowStockCount}</p>
            </CardContent>
          </Card>

          {/* Card 3: Groceries */}
          <Card className="rounded-none border-r-2 border-b-2 border-l-0 border-t-0 border-homesync-sand bg-homesync-ink text-white shadow-none hover:bg-homesync-bark transition-colors">
            <CardContent className="p-6 sm:p-8">
              <div className="w-12 h-12 border-2 border-white/20 flex items-center justify-center mb-8">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <p className="font-mono text-xs tracking-widest uppercase text-white/50 mb-2">Groceries</p>
              <p className="font-display text-4xl font-bold">{groceryItems}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alert */}
        {lowStockItems && lowStockItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <Card className="rounded-none border-2 border-homesync-rust bg-homesync-tan shadow-none">
              <CardHeader className="pb-4 border-b-2 border-homesync-rust bg-white dark:bg-homesync-tan">
                <CardTitle className="font-display text-2xl font-bold text-homesync-rust flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6" />
                  Restock Needed
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  {lowStockItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-homesync-tan border-2 border-homesync-rust"
                    >
                      <Package className="w-4 h-4 text-homesync-rust" />
                      <span className="font-bold font-body text-homesync-ink">
                        {item.name}
                      </span>
                      <Badge className="rounded-none bg-transparent border border-homesync-rust text-homesync-rust font-mono text-[9px] uppercase tracking-widest hover:bg-transparent ml-2">
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
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-homesync-muted" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-body text-base h-12"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-64 rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus:ring-0 focus:border-homesync-ink h-12 font-mono text-xs uppercase tracking-widest">
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-3 text-homesync-muted" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-none border-2 border-homesync-ink font-mono text-xs uppercase tracking-widest bg-homesync-cream">
              <SelectItem value="all" className="focus:bg-homesync-tan rounded-none">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="focus:bg-homesync-tan rounded-none">
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
          className="space-y-12 pb-12"
        >
          {isLoading ? (
            <LoadingState label="Loading inventory..." />
          ) : isError ? (
            <ErrorState message="Failed to load inventory. Please try again." />
          ) : (
          <>
          {Object.entries(itemsByCategory).map(([category, items]) => {
            const categoryInfo = categories.find((c) => c.value === category) || {
              label: category,
              icon: Package,
            };
            const Icon = categoryInfo.icon;

            return (
              <Card key={category} className="rounded-none border-2 border-homesync-sand bg-transparent shadow-none">
                <CardHeader className="border-b-2 border-homesync-sand bg-homesync-tan pb-6">
                  <CardTitle className="font-display text-2xl font-bold text-homesync-ink flex items-center gap-3">
                    <Icon className="w-6 h-6 text-homesync-ink" />
                    {categoryInfo.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-white dark:bg-homesync-tan">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          whileHover={{ scale: 1.01 }}
                          className={cn(
                            'flex flex-col p-5 border-2 transition-colors',
                            isLowStock
                              ? 'border-homesync-rust bg-homesync-rust/5'
                              : 'border-homesync-sand bg-homesync-cream hover:border-homesync-ink'
                          )}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 pr-4">
                              <p className="font-display font-bold text-xl text-homesync-ink truncate mb-1">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-[10px] uppercase tracking-widest text-homesync-muted font-bold">
                                  {item.quantity} {item.unit}
                                </p>
                                {isLowStock && (
                                  <Badge className="rounded-none bg-transparent border border-homesync-rust text-homesync-rust font-mono text-[9px] uppercase tracking-widest hover:bg-transparent px-1">
                                    Low
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Flat Brutalist Progress Bar */}
                          <div className="w-full h-2 bg-white dark:bg-homesync-tan border border-homesync-sand mb-4 flex-shrink-0">
                            <div
                              className={cn(
                                "h-full transition-all duration-300",
                                isLowStock ? "bg-homesync-rust" : "bg-homesync-olive"
                              )}
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between mt-auto">
                            <p className="font-mono text-[9px] uppercase tracking-widest text-homesync-sand">
                              {item.last_purchased ? (
                                <>
                                  Purchased{' '}
                                  {formatDistanceToNow(new Date(item.last_purchased), {
                                    addSuffix: true,
                                  })}
                                </>
                              ) : 'Never purchased'}
                            </p>

                            {/* Action Buttons: -, +, Delete */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label={`Decrease ${item.name} quantity`}
                                className="h-8 w-8 rounded-none border-2 border-homesync-ink text-homesync-ink hover:bg-homesync-ink hover:text-white transition-colors"
                                disabled={updateItem.isPending || item.quantity <= 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateItem.mutate(
                                    { id: item.id, quantity: Math.max(0, item.quantity - 1) },
                                    { onError: (error) => toast.error(error.message || 'Failed to update quantity') }
                                  );
                                }}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label={`Restock ${item.name}`}
                                className="h-8 w-8 rounded-none border-2 border-homesync-ink text-homesync-ink hover:bg-homesync-olive hover:text-white hover:border-homesync-olive transition-colors"
                                disabled={restockItem.isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  restockItem.mutate(
                                    { id: item.id, quantity: 1 },
                                    { onError: (error) => toast.error(error.message || 'Failed to restock item') }
                                  );
                                }}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label={`Delete ${item.name}`}
                                className="h-8 w-8 rounded-none border-2 border-homesync-rust text-homesync-rust hover:bg-homesync-rust hover:text-white ml-1 transition-colors"
                                disabled={deleteItem.isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                                    deleteItem.mutate(item.id, {
                                      onSuccess: () => toast.success(`${item.name} removed`),
                                      onError: (error) => toast.error(error.message || 'Failed to remove item'),
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-homesync-muted bg-white dark:bg-homesync-tan border-2 border-dashed border-homesync-sand m-4">
              <Package className="w-12 h-12 mb-4 text-homesync-sand opacity-50" />
              <p className="font-display text-2xl font-bold text-homesync-ink mb-2">
                No items found
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-homesync-muted text-center px-4">
                {searchQuery ? 'Adjust your search filters' : 'Add items to track your shared inventory'}
              </p>
            </div>
          )}
          </>
          )}
        </motion.div>

        {/* Add Item Modal */}
        <Dialog open={addItemModalOpen} onOpenChange={setAddItemModalOpen}>
          <DialogContent className="max-w-md rounded-none border-2 border-homesync-ink bg-homesync-cream p-0 shadow-[8px_8px_0px_rgba(26,18,9,1)]">
            <DialogHeader className="p-6 border-b-2 border-homesync-ink bg-homesync-tan">
              <DialogTitle className="font-display text-3xl font-black text-homesync-ink">Add New Item</DialogTitle>
              <DialogDescription className="font-body text-homesync-muted text-sm mt-2">
                Log a new item in your shared household inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">

              <div className="space-y-3">
                <Label htmlFor="item-name" className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Item Name</Label>
                <Input
                  id="item-name"
                  placeholder="e.g., Milk, Paper Towels"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-body h-12 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Category</Label>
                  <Select value={itemCategory} onValueChange={setItemCategory}>
                    <SelectTrigger className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus:ring-0 focus:border-homesync-ink h-12 font-body text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2 border-homesync-ink bg-homesync-cream font-body">
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="focus:bg-homesync-tan rounded-none cursor-pointer">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Unit</Label>
                  <Select value={itemUnit} onValueChange={setItemUnit}>
                    <SelectTrigger className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus:ring-0 focus:border-homesync-ink h-12 font-body text-base">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2 border-homesync-ink bg-homesync-cream font-body">
                      <SelectItem value="units" className="focus:bg-homesync-tan rounded-none cursor-pointer">Units</SelectItem>
                      <SelectItem value="liters" className="focus:bg-homesync-tan rounded-none cursor-pointer">Liters</SelectItem>
                      <SelectItem value="kg" className="focus:bg-homesync-tan rounded-none cursor-pointer">Kg</SelectItem>
                      <SelectItem value="gallons" className="focus:bg-homesync-tan rounded-none cursor-pointer">Gallons</SelectItem>
                      <SelectItem value="pieces" className="focus:bg-homesync-tan rounded-none cursor-pointer">Pieces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-mono h-12 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="font-mono text-xs uppercase tracking-widest text-homesync-ink font-bold">Low Alert At</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={itemMinQuantity}
                    onChange={(e) => setItemMinQuantity(e.target.value)}
                    className="rounded-none border-2 border-homesync-sand bg-white dark:bg-homesync-tan focus-visible:border-homesync-ink focus-visible:ring-0 font-mono h-12 text-base"
                  />
                </div>
              </div>

            </div>

            <div className="p-6 border-t-2 border-homesync-ink bg-homesync-tan flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setAddItemModalOpen(false)}
                disabled={createItem.isPending}
                className="rounded-none border-2 border-homesync-ink bg-transparent text-homesync-ink hover:bg-homesync-cream font-mono text-xs uppercase tracking-widest px-6"
              >
                Cancel
              </Button>
              <Button
                disabled={createItem.isPending}
                onClick={() => {
                  if (!household?.id) {
                    toast.error('Household ID is missing');
                    return;
                  }
                  if (!itemName || !itemQuantity) {
                    toast.error('Please fill in item name and quantity');
                    return;
                  }
                  createItem.mutate(
                    {
                      household_id: household.id,
                      name: itemName,
                      category: itemCategory as 'groceries' | 'supplies' | 'appliances',
                      quantity: Number(itemQuantity),
                      unit: itemUnit || 'units',
                      min_quantity: Number(itemMinQuantity) || 1,
                    },
                    {
                      onSuccess: () => {
                        toast.success('Item added to inventory');
                        setAddItemModalOpen(false);
                        setItemName('');
                        setItemQuantity('');
                        setItemMinQuantity('1');
                        setItemUnit('');
                        setItemCategory('groceries');
                      },
                      onError: (error) => {
                        toast.error(error.message || 'Failed to add item');
                      }
                    }
                  );
                }}
                className="rounded-none border-2 border-homesync-ink bg-homesync-rust text-white hover:bg-homesync-bark font-mono text-xs uppercase tracking-widest px-6"
              >
                {createItem.isPending ? 'Adding...' : 'Add Item'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}