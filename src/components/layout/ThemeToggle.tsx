import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';
import Button from '../ui/Button';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="rounded-full w-9 h-9"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun size={18} className="text-yellow-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon size={18} className="text-slate-700 transition-transform hover:rotate-12" />
      )}
    </Button>
  );
};

export default ThemeToggle;