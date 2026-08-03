'use client';

import { SD_CARD, SD_CARD_TITLE } from './supplier-detail-styles';

export function SupplierPlaceholderTab({ label }: { label: string }) {
  return (
    <div className={`${SD_CARD} mt-4 text-center py-12`}>
      <h3 className={SD_CARD_TITLE}>{label}</h3>
      <p className="text-xs text-slate-500 mt-2">This section is coming soon.</p>
    </div>
  );
}
