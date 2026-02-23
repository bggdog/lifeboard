'use client';

import { useState, useEffect } from 'react';

/**
 * Returns whether the viewport matches the media query.
 * Includes delayed re-checks on mount to work around PWA viewport bugs
 * (e.g. macOS dock launch reporting wrong initial size until after interaction).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);

    // Initial check
    update();

    // Listen for changes
    mq.addEventListener('change', update);

    // PWA fix: re-check after delays - viewport can be wrong on launch from dock
    const t1 = setTimeout(update, 100);
    const t2 = setTimeout(update, 400);

    return () => {
      mq.removeEventListener('change', update);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [query]);

  return matches;
}
