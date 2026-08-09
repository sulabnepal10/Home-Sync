import {
  Home,
  Wallet,
  ArrowLeftRight,
  CheckSquare,
  UtensilsCrossed,
  Package,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  shortcut: string;
}

/**
 * Single source of truth for the app's primary navigation, shared between
 * AppLayout's sidebar/mobile nav and CommandPalette (previously two
 * independently-maintained copies that could drift when a route changed).
 */
export const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: Home, shortcut: 'G D' },
  { path: '/expenses', label: 'Expenses', icon: Wallet, shortcut: 'G E' },
  { path: '/loans', label: 'Loans', icon: ArrowLeftRight, shortcut: 'G L' },
  { path: '/chores', label: 'Chores', icon: CheckSquare, shortcut: 'G C' },
  { path: '/meals', label: 'Meals', icon: UtensilsCrossed, shortcut: 'G M' },
  { path: '/inventory', label: 'Inventory', icon: Package, shortcut: 'G I' },
  { path: '/settings', label: 'Settings', icon: Settings, shortcut: 'G S' },
];
