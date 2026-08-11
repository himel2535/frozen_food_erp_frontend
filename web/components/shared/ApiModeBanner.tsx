'use client';

import type { ApiModule } from '@/lib/config/data-source';
import { API_MODULE_LABELS } from '@/lib/config/data-source';

/** Shows API load errors only — no backend/connection info in the UI. */
export function ApiModeBanner({
  module,
  error,
}: {
  module: ApiModule;
  error?: string | null;
}) {
  const message = String(error ?? '').trim();
  if (!message) return null;

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800">
      {API_MODULE_LABELS[module]}: {message}
    </div>
  );
}
