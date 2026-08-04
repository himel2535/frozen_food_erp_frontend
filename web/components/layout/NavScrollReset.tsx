'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Reset module scroll position on route change without a loading skeleton flash. */
export function NavScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const scrollable = main.querySelector('.overflow-y-auto');
    if (scrollable instanceof HTMLElement) {
      scrollable.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}
