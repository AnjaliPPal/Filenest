import { useState, useEffect } from 'react';

/**
 * Custom hook that tells you whether a given media query is active.
 * Useful for creating responsive designs.
 * 
 * @param query - Media query string to evaluate
 * @returns boolean - Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Safety check for SSR
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    
    // Initial check
    setMatches(media.matches);
    
    // Set up listener for changes
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } 
    // For older browsers
    else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}

// Enhanced breakpoints that match tailwind configuration
export const breakpoints = {
  xs: '(min-width: 475px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  '3xl': '(min-width: 1920px)',
};

// Max-width breakpoints for mobile-first approach
export const maxBreakpoints = {
  xs: '(max-width: 474px)',
  sm: '(max-width: 639px)',
  md: '(max-width: 767px)',
  lg: '(max-width: 1023px)',
  xl: '(max-width: 1279px)',
  '2xl': '(max-width: 1535px)',
};

// Common device queries
export const deviceQueries = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  touch: '(pointer: coarse)',
  hover: '(hover: hover)',
  landscape: '(orientation: landscape)',
  portrait: '(orientation: portrait)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
};

// Convenience hooks for common use cases
export const useIsMobile = () => useMediaQuery(deviceQueries.mobile);
export const useIsTablet = () => useMediaQuery(deviceQueries.tablet);
export const useIsDesktop = () => useMediaQuery(deviceQueries.desktop);
export const useIsTouchDevice = () => useMediaQuery(deviceQueries.touch);
export const useHasHover = () => useMediaQuery(deviceQueries.hover);
export const useIsLandscape = () => useMediaQuery(deviceQueries.landscape);
export const useIsPortrait = () => useMediaQuery(deviceQueries.portrait);
export const usePrefersReducedMotion = () => useMediaQuery(deviceQueries.reducedMotion);
export const usePrefersDarkMode = () => useMediaQuery(deviceQueries.darkMode);

// Screen size hook that returns current breakpoint
export const useScreenSize = () => {
  const isXs = useMediaQuery(maxBreakpoints.xs);
  const isSm = useMediaQuery(breakpoints.sm) && useMediaQuery(maxBreakpoints.sm);
  const isMd = useMediaQuery(breakpoints.md) && useMediaQuery(maxBreakpoints.md);
  const isLg = useMediaQuery(breakpoints.lg) && useMediaQuery(maxBreakpoints.lg);
  const isXl = useMediaQuery(breakpoints.xl) && useMediaQuery(maxBreakpoints.xl);
  const is2xl = useMediaQuery(breakpoints['2xl']) && useMediaQuery(maxBreakpoints['2xl']);
  const is3xl = useMediaQuery(breakpoints['3xl']);

  if (isXs) return 'xs';
  if (isSm) return 'sm';
  if (isMd) return 'md';
  if (isLg) return 'lg';
  if (isXl) return 'xl';
  if (is2xl) return '2xl';
  if (is3xl) return '3xl';
  return 'xs'; // fallback
};

// Example usage:
// const isMobile = useIsMobile(); 
// const screenSize = useScreenSize();
// const isTouch = useIsTouchDevice(); 