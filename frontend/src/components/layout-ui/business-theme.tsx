import { useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { useTheme } from '@/hooks/use-theme';
import type { IBusinessTheme } from '@shared/interfaces';
import type { TSingleHandlerStore } from '@/stores';
import { AppLoader } from './app-loader';

export const BUSINESS_THEME_STORE_KEY = 'business-theme';

interface IBusinessThemeLoaderProps {
  storeKey: string;
  store: TSingleHandlerStore<IBusinessTheme | null, {}>;
  children: React.ReactNode;
}

export function BusinessThemeComponent({ storeKey, store, children }: IBusinessThemeLoaderProps) {
  const { resolvedTheme } = useTheme();
  
  const theme = store(useShallow((state) => state.response));
  const isLoading = store(useShallow((state) => state.isLoading));

  // Apply theme to document based on resolved theme (light/dark)
  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    const isDark = resolvedTheme === 'dark';
    
    // Apply document title
    if (theme.title) {
      document.title = theme.title;
    }
    
    // Apply colors based on current theme mode
    if (isDark) {
      if (theme.primaryColorDark) {
        root.style.setProperty('--primary', theme.primaryColorDark);
      }
    } else {
      if (theme.primaryColorLight) {
        root.style.setProperty('--primary', theme.primaryColorLight);
      }
    }

    // Apply font
    if (theme.fontFamily && theme.fontUrl) {
      // Check if font link already exists
      let fontLink = document.querySelector(`link[data-font-family="${theme.fontFamily}"]`) as HTMLLinkElement;
      if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = theme.fontUrl;
        fontLink.setAttribute('data-font-family', theme.fontFamily);
        document.head.appendChild(fontLink);
      }
      root.style.setProperty('--font-sans', `"${theme.fontFamily}", sans-serif`);
    }

    // Apply favicon - always remove old and add new one for reliable updates
    if (theme.favicon?.url) {
      // Remove existing favicon link
      const existingFavicon = document.getElementById('favicon');
      if (existingFavicon) {
        existingFavicon.remove();
      }
      
      // Create new favicon link with cache-busting to force reload
      const faviconUrl = theme.favicon.url;
      const separator = faviconUrl.includes('?') ? '&' : '?';
      const newFaviconLink = document.createElement('link');
      newFaviconLink.id = 'favicon';
      newFaviconLink.rel = 'icon';
      newFaviconLink.type = 'image/x-icon';
      newFaviconLink.href = `${faviconUrl}${separator}`;
      newFaviconLink.crossOrigin = 'anonymous';
      document.head.appendChild(newFaviconLink);
    } 
  }, [theme, resolvedTheme]);

  // This component doesn't render anything, it just applies the theme
  return isLoading ? <AppLoader /> : children;
}
