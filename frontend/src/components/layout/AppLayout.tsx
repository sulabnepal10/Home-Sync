import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Wallet,
  ArrowLeftRight,
  CheckSquare,
  UtensilsCrossed,
  Package,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  Command,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CommandPalette from '@/components/shared/CommandPalette';

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

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/expenses', label: 'Expenses', icon: Wallet },
  { path: '/loans', label: 'Loans', icon: ArrowLeftRight },
  { path: '/chores', label: 'Chores', icon: CheckSquare },
  { path: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface AppLayoutProps {
  children?: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  useFonts();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, household, members, signOut } = useAuthStore();
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      {/* Global Grain Overlay (Placed here to cover the entire app cleanly) */}
      <div
        className="fixed inset-0 pointer-events-none z-[999] opacity-40 mix-blend-overlay"
        style={{ backgroundImage: grainSvg }}
        aria-hidden="true"
      />

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-homesync-cream border-b-2 border-homesync-ink z-50 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="rounded-none hover:bg-homesync-tan text-homesync-ink">
          <Menu className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-homesync-ink bg-homesync-rust flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-black text-xl text-homesync-ink uppercase tracking-tight">HomeSync</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-none hover:bg-homesync-tan text-homesync-ink">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-homesync-ink/80 backdrop-blur-sm z-50"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-homesync-cream border-r-2 border-homesync-ink z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b-2 border-homesync-ink bg-homesync-tan">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-homesync-ink bg-homesync-rust flex items-center justify-center">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-black text-xl text-homesync-ink uppercase tracking-tight">HomeSync</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="rounded-none hover:bg-white text-homesync-ink border-2 border-transparent hover:border-homesync-ink">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <nav className="flex flex-col py-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-4 px-6 py-4 font-mono text-xs uppercase tracking-widest transition-colors border-l-4',
                        isActive
                          ? 'bg-homesync-tan border-homesync-rust text-homesync-ink font-bold'
                          : 'border-transparent text-homesync-muted hover:bg-white hover:text-homesync-ink hover:border-homesync-sand'
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 88 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-homesync-cream border-r-2 border-homesync-sand z-40 overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b-2 border-homesync-sand h-20 bg-homesync-tan">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 border-2 border-homesync-ink bg-homesync-rust flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-black text-2xl text-homesync-ink uppercase tracking-tight truncate">HomeSync</span>
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-10 h-10 border-2 border-homesync-ink bg-homesync-rust flex items-center justify-center mx-auto flex-shrink-0"
              >
                <Home className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex rounded-none hover:bg-white text-homesync-ink absolute right-2"
          >
            <ChevronDown
              className={cn('w-4 h-4 transition-transform', sidebarOpen ? 'rotate-90' : '-rotate-90')}
            />
          </Button>
        </div>

        {household && (
          <div className={cn("py-4 border-b-2 border-homesync-sand bg-white transition-all", sidebarOpen ? "px-6" : "px-0 text-center")}>
            {sidebarOpen ? (
              <>
                <p className="font-mono text-[9px] uppercase tracking-widest text-homesync-muted mb-1">Household</p>
                <p className="font-display font-bold text-lg text-homesync-ink truncate">
                  {household.name}
                </p>
                <p className="font-mono text-[10px] text-homesync-muted mt-1">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </p>
              </>
            ) : (
              <div className="w-10 h-10 border-2 border-homesync-ink bg-homesync-cream mx-auto flex items-center justify-center font-display font-bold text-homesync-ink text-sm">
                {getInitials(household.name).slice(0, 1)}
              </div>
            )}
          </div>
        )}

        <ScrollArea className="flex-1">
          <nav className="flex flex-col py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-4 py-4 transition-all border-l-4 font-mono text-xs uppercase tracking-widest',
                    sidebarOpen ? 'px-6' : 'px-0 justify-center',
                    isActive
                      ? 'bg-homesync-tan border-homesync-rust text-homesync-ink font-bold'
                      : 'border-transparent text-homesync-muted hover:bg-white hover:text-homesync-ink hover:border-homesync-sand'
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t-2 border-homesync-sand bg-white">
          <button
            onClick={() => setCommandOpen(true)}
            className={cn(
              "flex items-center border-2 border-homesync-sand bg-homesync-cream hover:border-homesync-ink hover:bg-homesync-tan transition-colors text-homesync-ink rounded-none",
              sidebarOpen ? "w-full px-4 py-3 gap-3" : "w-12 h-12 justify-center mx-auto p-0"
            )}
          >
            <Command className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 text-left font-mono text-[10px] uppercase tracking-widest font-bold"
                >
                  Search...
                </motion.span>
              )}
            </AnimatePresence>
            {sidebarOpen && (
              <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 border-2 border-homesync-sand bg-white px-1.5 font-mono text-[9px] font-bold text-homesync-ink rounded-none">
                <span className="text-[9px]">Ctrl</span>K
              </kbd>
            )}
          </button>
        </div>

        <div className="p-4 border-t-2 border-homesync-sand bg-homesync-tan">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full border-2 border-transparent hover:bg-white transition-colors p-2 rounded-none",
                !sidebarOpen && "justify-center"
              )}>
                <Avatar className="w-10 h-10 rounded-none border-2 border-homesync-ink flex-shrink-0">
                  <AvatarImage src={user?.avatar_url} className="rounded-none" />
                  <AvatarFallback className="bg-homesync-ink text-white font-mono text-xs rounded-none">
                    {getInitials(user?.full_name || 'User')}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 text-left overflow-hidden"
                    >
                      <p className="font-display font-bold text-sm text-homesync-ink truncate">
                        {user?.full_name || 'User'}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-homesync-muted truncate">
                        View profile
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-none border-2 border-homesync-ink bg-homesync-cream font-mono text-xs uppercase tracking-widest p-0 shadow-[4px_4px_0px_rgba(26,18,9,1)]">
              <div className="p-4 bg-homesync-tan border-b-2 border-homesync-ink">
                <p className="font-display font-bold text-sm text-homesync-ink truncate">
                  {user?.full_name}
                </p>
              </div>
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-none p-3 focus:bg-white cursor-pointer">
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 mr-3" />
                    Light mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-3" />
                    Dark mode
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-none p-3 focus:bg-white cursor-pointer">
                <NavLink to="/settings">
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-homesync-ink m-0 h-[2px]" />
              <DropdownMenuItem
                onClick={signOut}
                className="rounded-none p-3 text-homesync-rust focus:bg-homesync-rust focus:text-white cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      {/* Main content */}
      <main
        className={cn(
          'min-h-screen bg-homesync-cream text-homesync-ink font-body transition-all duration-200 ease-in-out',
          sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[88px]',
          'pt-16 lg:pt-0'
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}