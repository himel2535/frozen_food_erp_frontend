'use client';

import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FORM_LABEL_CLS } from '@/lib/ui/form-styles';
import { toast } from '@/lib/ui/feedback';
import { CloudinaryUploadError, uploadImageToCloudinary, validateImageFile, type PendingImageUpload } from '@/lib/services/cloudinary-service';

export type { PendingImageUpload };

export function ImageUploadField({
  value,
  onChange,
  onPendingUpload,
  label = 'Product Image',
  disabled = false,
}: {
  value: string;
  onChange: (url: string, publicId?: string) => void;
  onPendingUpload?: (promise: Promise<PendingImageUpload | null> | null) => void;
  label?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const localPreviewRef = useRef('');
  const generationRef = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [localPreview, setLocalPreview] = useState('');

  const revokePreview = () => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = '';
    }
    setLocalPreview('');
  };

  useEffect(() => () => {
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
  }, []);

  const handleFile = (file: File | undefined) => {
    if (!file || disabled) return;
    setError('');

    const localError = validateImageFile(file);
    if (localError) {
      setError(localError);
      toast.error('Invalid image', { module: 'Inventory', description: localError });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    localPreviewRef.current = objectUrl;
    setLocalPreview(objectUrl);

    const generation = ++generationRef.current;
    setUploading(true);

    const uploadPromise = (async (): Promise<PendingImageUpload | null> => {
      try {
        const result = await uploadImageToCloudinary(file);
        if (generation !== generationRef.current) return null;
        const publicId = result.publicId ?? '';
        onChange(result.url, publicId);
        toast.success('Image uploaded', { module: 'Inventory', description: 'Image saved to Cloudinary.' });
        return { url: result.url, publicId };
      } catch (err) {
        if (generation !== generationRef.current) return null;
        const message = err instanceof CloudinaryUploadError
          ? err.message
          : 'Image upload failed.';
        setError(message);
        toast.error('Upload failed', { module: 'Inventory', description: message });
        return null;
      } finally {
        if (generation === generationRef.current) {
          setUploading(false);
          if (inputRef.current) inputRef.current.value = '';
        }
      }
    })();

    onPendingUpload?.(uploadPromise);
  };

  const handleRemove = () => {
    generationRef.current += 1;
    revokePreview();
    setUploading(false);
    setError('');
    onPendingUpload?.(null);
    onChange('', '');
    if (inputRef.current) inputRef.current.value = '';
  };

  const displaySrc = localPreview || value;

  return (
    <div>
      <label className={FORM_LABEL_CLS}>{label}</label>
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
          {displaySrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displaySrc} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-6 h-6 text-slate-300" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading…' : displaySrc ? 'Change Image' : 'Upload Image'}
            </button>
            {displaySrc ? (
              <button
                type="button"
                disabled={disabled}
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            ) : null}
          </div>
          <p className="text-[11px] font-semibold text-slate-500">JPEG, PNG, or WebP · max 5 MB · optional</p>
          {error ? <p className="text-[11px] font-semibold text-rose-600">{error}</p> : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
