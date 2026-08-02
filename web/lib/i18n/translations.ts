import type { Lang } from '@/lib/state/types';
import { en } from './translations/en';

type TranslationMap = Record<string, string>;

const cache: Partial<Record<Lang, TranslationMap>> = { en };

let bnLoadPromise: Promise<void> | null = null;

export async function ensureBnTranslations(): Promise<void> {
  if (cache.bn) return;
  if (!bnLoadPromise) {
    bnLoadPromise = import('./translations/bn').then((mod) => {
      cache.bn = { ...mod.bn, ...mod.phrases };
    });
  }
  await bnLoadPromise;
}

export function getTranslationMap(lang: Lang): TranslationMap {
  return cache[lang] ?? cache.en ?? en;
}

export function translate(key: string, vars?: Record<string, string | number>, lang: Lang = 'en'): string {
  const activeLang = lang ?? 'en';
  let text = getTranslationMap(activeLang)[key] ?? getTranslationMap('en')[key] ?? key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
    });
  }
  return text;
}

/** @deprecated Use getTranslationMap / translate instead. Kept for compatibility. */
export const translations = {
  get en() {
    return cache.en ?? en;
  },
  get bn() {
    return cache.bn;
  },
};
