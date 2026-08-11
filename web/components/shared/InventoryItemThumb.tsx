'use client';

import type { ReactNode } from 'react';

export function InventoryItemThumb({
  imageUrl,
  fallback,
  alt = '',
  className = 'w-9 h-9 rounded-lg border border-slate-200 object-cover shrink-0',
}: {
  imageUrl?: string | null;
  fallback: ReactNode;
  alt?: string;
  className?: string;
}) {
  const src = String(imageUrl ?? '').trim();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} />
    );
  }
  return <>{fallback}</>;
}
