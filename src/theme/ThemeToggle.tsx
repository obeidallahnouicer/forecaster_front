import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export const ThemeToggle = ({ className = '' }: { className?: string }) => {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const onClick = () => {
    // Cycle: system -> dark -> light -> system
    const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
    setTheme(next);
  };

  const title = theme === 'dark' ? 'Switch to light' : theme === 'light' ? 'Switch to system' : 'Switch to dark';

  return (
    <button
      aria-label="Toggle theme"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center p-2 rounded-lg hover:bg-muted/30 transition ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : theme === 'light' ? (
        <Monitor className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
