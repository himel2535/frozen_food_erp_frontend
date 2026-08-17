'use client';

import { addCollection } from '@iconify/react';
import type { IconifyJSON } from '@iconify/types';
import chrome from '@/lib/ui/iconify-chrome.json';

let registered = false;

/** Registers sidebar + dashboard chrome icons locally so Iconify does not hit the CDN. */
export function registerChromeIcons() {
  if (registered) return;
  registered = true;
  addCollection(chrome.fluentColor as IconifyJSON);
  addCollection(chrome.flatColorIcons as IconifyJSON);
}
