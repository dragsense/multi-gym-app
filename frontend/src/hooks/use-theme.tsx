import { createContext, useContext, useEffect, useState, useDeferredValue, useMemo, type ReactNode } from 'react';
import { useUserSettings } from './use-user-settings';
import { createOrUpdateMySettings } from '@/services/settings.api';
import { ETheme } from '@shared/enums/user-settings.enum';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const { settings } = useUserSettings();
  
  // Get theme from user settings or localStorage
  const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
      // Priority: user settings > localStorage > default
      if (settings?.theme?.theme) {
        return settings.theme.theme as Theme;
      }
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Sync theme when user settings change
  useEffect(() => {
    if (settings?.theme?.theme) {
      setTheme(settings.theme.theme as Theme);
    }
  }, [settings?.theme?.theme]);

  // React 19: Deferred theme for better performance
  const deferredTheme = useDeferredValue(theme);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    let resolved: 'light' | 'dark';
    
    if (deferredTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      resolved = systemTheme;
    } else {
      resolved = deferredTheme;
    }
    
    setResolvedTheme(resolved);
    root.classList.add(resolved);
    
    // Store in localStorage
    localStorage.setItem(storageKey, deferredTheme);
    
    // Update user settings if theme changed
    if (settings && deferredTheme !== settings.theme?.theme) {
      createOrUpdateMySettings({
        theme: {
          theme: deferredTheme as ETheme,
        },
      }).catch((error) => {
        console.error('Failed to update theme in settings:', error);
      });
    }
  }, [deferredTheme, storageKey, settings]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      setResolvedTheme(systemTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Custom setTheme that also updates user settings
  const setThemeWithSync = (newTheme: Theme) => {
    setTheme(newTheme);
    // Update will happen in the useEffect above
  };

  // React 19: Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    theme,
    setTheme: setThemeWithSync,
    resolvedTheme,
  }), [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
