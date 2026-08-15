'use client';

import { useRef, useState, type DragEvent } from 'react';
import { CloudUpload, ImageIcon, Loader2, Trash2 } from 'lucide-react';
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
    processing: string;
    uploadFailed: string;
    compressFailed: string;
  };
};

export function SignatureUploadZone({ value, onChange, labels }: SignatureUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file || processing) return;
    setProcessing(true);
    try {
      const dataUrl = await readSignatureFile(file);
      onChange(dataUrl);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'too_large') {
        toast.error(labels.tooLarge, { module: 'Signatures' });
      } else if (code === 'compress_failed') {
        toast.error(labels.compressFailed, { module: 'Signatures' });
      } else if (code === 'read_failed') {
        toast.error(labels.uploadFailed, { module: 'Signatures' });
      } else {
        toast.error(labels.invalid, { module: 'Signatures' });
      }
    } finally {
      setProcessing(false);
    }
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (processing) return;
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
            {processing ? (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {labels.processing}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/80">
            <button
              type="button"
              disabled={processing}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
              {labels.replace}
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-100 bg-rose-50 text-xs font-bold text-rose-600 hover:bg-rose-100 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {labels.remove}
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={processing ? -1 : 0}
          aria-busy={processing}
          onKeyDown={(event) => {
            if (processing) return;
            if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
          }}
          onClick={() => {
            if (!processing) inputRef.current?.click();
          }}
          onDragOver={(event) => {
            if (processing) return;
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            processing
              ? 'border-slate-200 bg-slate-50/80 cursor-wait'
              : dragging
                ? 'border-blue-400 bg-blue-50/60 cursor-pointer'
                : 'border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer'
          }`}
        >
          <span className="inline-flex w-14 h-14 rounded-2xl bg-white border border-slate-200 items-center justify-center text-blue-600 shadow-sm">
            {processing ? <Loader2 className="w-7 h-7 animate-spin" /> : <ImageIcon className="w-7 h-7" />}
          </span>
          <p className={`${ST_BODY} mt-4`}>{processing ? labels.processing : labels.title}</p>
          <p className={`${ST_CAPTION} mt-1 max-w-sm mx-auto`}>{labels.hint}</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
        className="hidden"
        disabled={processing}
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          void handleFile(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}
