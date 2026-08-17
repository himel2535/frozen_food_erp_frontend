'use client';

import { employeeAvatarClass, employeeInitials } from '@/lib/services/hrm-service';

export function PmPersonCell({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string;
}) {
  const label = name.trim() || '—';
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
      ) : (
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${employeeAvatarClass(label)}`}>
          {employeeInitials(label)}
        </span>
      )}
      <span className="truncate font-medium text-slate-800">{label}</span>
    </span>
  );
}
