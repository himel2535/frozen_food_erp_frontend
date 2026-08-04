'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MODULE_SCROLL_ID } from '@/lib/ui/module-layout';

/** Reset module scroll position on route change (before paint to avoid visible jump). */
export function NavScrollReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const scrollable = document.getElementById(MODULE_SCROLL_ID);
    if (scrollable) {
      scrollable.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}
