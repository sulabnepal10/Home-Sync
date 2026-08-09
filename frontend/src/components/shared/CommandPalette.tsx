import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { Plus, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/useAuthStore';
import { navItems } from '@/lib/navigation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuthStore();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => {
                navigate(item.path);
                onOpenChange(false);
              }}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
              <CommandShortcut>{item.shortcut}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => {
              navigate('/expenses');
              onOpenChange(false);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
            <CommandShortcut>E</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              navigate('/chores');
              onOpenChange(false);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Complete Chore
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Preferences">
          <CommandItem
            onSelect={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
              onOpenChange(false);
            }}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            Toggle Theme
          </CommandItem>
          <CommandItem
            onSelect={() => {
              signOut();
              onOpenChange(false);
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
