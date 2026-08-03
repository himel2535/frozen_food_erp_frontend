'use client';

import { ChevronRight, Download, FolderOpen, Pencil, Upload } from 'lucide-react';
import { toast } from '@/lib/ui/feedback';
import { Icon } from '@iconify/react';
import {
  ST_BODY,
  ST_CAPTION,
  ST_CARD_COMPACT,
  ST_LABEL,
  ST_SECTION_HEADER_COMPACT,
  ST_TITLE,
} from '@/components/modules/settings/settings-styles';
import type { CompanyDocument } from '@/lib/services/settings-service';

type CompanyDocumentsCardProps = {
  documents: CompanyDocument[];
  labels: {
    title: string;
    subtitle: string;
    upload: string;
    uploaded: string;
  };
};

export function CompanyDocumentsCard({ documents, labels }: CompanyDocumentsCardProps) {
  const handleUpload = () => {
    toast.info(labels.uploaded, {
      module: 'Company Settings',
      description: 'Document upload will be available in a future release.',
    });
  };

  return (
    <div className={ST_CARD_COMPACT}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
        <div>
          <div className={ST_SECTION_HEADER_COMPACT}>
            <FolderOpen className="w-4 h-4 text-teal-500" />
            <h3 className={ST_TITLE}>{labels.title}</h3>
          </div>
          <p className={`${ST_CAPTION} ml-6`}>{labels.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleUpload}
          className="inline-flex items-center gap-2 border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors shrink-0 self-start"
        >
          <Upload className="w-4 h-4" />
          {labels.upload}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/80 hover:bg-white hover:border-slate-200 transition-colors min-w-[180px]"
          >
            <Icon icon="flat-color-icons:document" width={28} height={28} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <span className={`${ST_BODY} block truncate`}>{doc.name}</span>
              <span className="inline-flex mt-0.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold uppercase">
                {doc.type}
              </span>
            </div>
            <button
              type="button"
              title="Download"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompanyOverviewCard({
  icon,
  title,
  children,
  editLabel,
  onEdit,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  editLabel: string;
  onEdit: () => void;
}) {
  return (
    <div className={`${ST_CARD_COMPACT} flex flex-col h-full`}>
      <div className={ST_SECTION_HEADER_COMPACT}>
        {icon}
        <h3 className={ST_TITLE}>{title}</h3>
      </div>
      <div className="flex-1">{children}</div>
      <button
        type="button"
        onClick={onEdit}
        className="mt-2 w-full inline-flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-100 text-blue-700 text-xs font-bold cursor-pointer transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <Pencil className="w-3.5 h-3.5" />
          {editLabel}
        </span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function CompanyInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 border-b border-slate-50 last:border-0">
      <span className={ST_LABEL}>{label}</span>
      <span className={`${ST_BODY} text-right sm:text-left`}>{value || '—'}</span>
    </div>
  );
}

export function CompanyStatusPill({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
        enabled
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : 'bg-slate-50 text-slate-600 border-slate-100'
      }`}
    >
      {label}
    </span>
  );
}
