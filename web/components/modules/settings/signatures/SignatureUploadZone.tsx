'use client';

import { useRef, useState, type DragEvent } from 'react';
import { CloudUpload, ImageIcon, Trash2 } from 'lucide-react';
import { toast } from '@/lib/ui/feedback';
import { readSignatureFile } from '@/components/modules/settings/signatures/signature-upload-utils';
import { ST_BODY, ST_CAPTION, ST_LABEL } from '@/components/modules/settings/settings-styles';

type SignatureUploadZoneProps = {
  value: string;
  onChange: (dataUrl: string) => void;
  labels: {
    title: string;
    hint: string;
    replace: string;
    remove: string;
    invalid: string;
    tooLarge: string;
  };
};

export function SignatureUploadZone({ value, onChange, labels }: SignatureUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await readSignatureFile(file);
      onChange(dataUrl);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'too_large') {
        toast.error(labels.tooLarge, { module: 'Signatures' });
      } else {
        toast.error(labels.invalid, { module: 'Signatures' });
      }
    }
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    await handleFile(file);
  };

  return (
    <div className="space-y-2">
      <span className={ST_LABEL}>{labels.title}</span>
      {value ? (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
          <div
            className="relative min-h-[160px] flex items-center justify-center p-6"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="max-h-28 max-w-full object-contain drop-shadow-sm" />
          </div>
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/80">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              {labels.replace}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-100 bg-rose-50 text-xs font-bold text-rose-600 hover:bg-rose-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {labels.remove}
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-blue-400 bg-blue-50/60'
              : 'border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40'
          }`}
        >
          <span className="inline-flex w-14 h-14 rounded-2xl bg-white border border-slate-200 items-center justify-center text-blue-600 shadow-sm">
            <ImageIcon className="w-7 h-7" />
          </span>
          <p className={`${ST_BODY} mt-4`}>{labels.title}</p>
          <p className={`${ST_CAPTION} mt-1 max-w-sm mx-auto`}>{labels.hint}</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          void handleFile(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}
