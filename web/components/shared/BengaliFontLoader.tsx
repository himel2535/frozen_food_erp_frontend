'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/state/app-store';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap';

export function BengaliFontLoader() {
  const lang = useAppStore((s) => s.appState.lang);

  useEffect(() => {
    if (lang !== 'bn') return;

    let link = document.querySelector<HTMLLinkElement>('link[data-bengali-font="true"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_HREF;
      link.dataset.bengaliFont = 'true';
      document.head.appendChild(link);
    }

    document.documentElement.style.setProperty(
      '--font-bengali',
      "'Noto Sans Bengali', var(--font-nunito), sans-serif",
    );
    document.body.classList.add('lang-bn');
  }, [lang]);

  return null;
}
