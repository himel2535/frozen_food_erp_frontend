'use client';

import { useState, type ReactNode } from 'react';

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
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
    );
  }
  return <>{fallback}</>;
}
