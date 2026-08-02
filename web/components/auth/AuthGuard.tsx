'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/state/app-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useAppStore((s) => s.appState.isLoggedIn);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn && pathname !== '/login') {
      router.replace('/login');
    }
  }, [hydrated, isLoggedIn, pathname, router]);

  if (!hydrated) {
    return null;
  }

  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}

export function LoginGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const isLoggedIn = useAppStore((s) => s.appState.isLoggedIn);

  useEffect(() => {
    if (hydrated && isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [hydrated, isLoggedIn, router]);

  return <>{children}</>;
}
