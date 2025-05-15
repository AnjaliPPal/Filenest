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

// Preset breakpoints that match tailwind defaults
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

// Example usage:
// const isMobile = !useMediaQuery(breakpoints.md); 