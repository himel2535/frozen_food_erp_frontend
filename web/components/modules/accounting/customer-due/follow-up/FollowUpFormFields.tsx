'use client';

import { useRef, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PhoneOff,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import type { CustomerReceivable } from '@/lib/services/customer-receivables-service';
import { ImgBBUploadError, uploadImageToImgBB, validateImageFile } from '@/lib/services/imgbb-service';
import { getCompanyInitials } from '@/lib/utils/communication-utils';
import { toast } from '@/lib/ui/feedback';
import { DUE_AVATAR_CLS } from '../customer-due-styles';
import type { ContactMethod, FollowUpOutcome, StaffOption } from './follow-up-form-types';
import {
  FU_FORM_INPUT_CLS,
  FU_FORM_LABEL_CLS,
  FU_PILL_ACTIVE,
  FU_PILL_INACTIVE,
  FU_UPLOAD_ZONE_CLS,
} from './follow-up-styles';

const CONTACT_METHODS: { id: ContactMethod; label: string; icon: typeof Phone }[] = [
  { id: 'call', label: 'Call', icon: Phone },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: MessageCircle },
  { id: 'meeting', label: 'Meeting', icon: Users },
];

const OUTCOMES: { id: FollowUpOutcome; label: string; icon: typeof Phone }[] = [
  { id: 'connected', label: 'Connected', icon: CheckCircle2 },
  { id: 'no_answer', label: 'No Answer', icon: PhoneOff },
  { id: 'busy', label: 'Busy', icon: Clock },
  { id: 'call_later', label: 'Call Later', icon: CalendarClock },
  { id: 'payment_promised', label: 'Payment Promised', icon: Banknote },
  { id: 'payment_sent', label: 'Payment Sent', icon: CheckCircle2 },
  { id: 'dispute', label: 'Dispute', icon: AlertCircle },
  { id: 'wrong_number', label: 'Wrong Number', icon: XCircle },
];

export function CustomerReadOnlyCard({ customer }: { customer: CustomerReceivable }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 flex items-start gap-3">
      <span className={`${DUE_AVATAR_CLS} h-10 w-10 text-xs shrink-0`}>{getCompanyInitials(customer.company)}</span>
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-slate-900">{customer.company}</p>
        <p className="text-xs text-slate-500 mt-0.5">{customer.phone}</p>
        {customer.location && (
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            {customer.location}
          </p>
        )}
      </div>
    </div>
  );
}

export function ContactMethodPills({
  value,
  onChange,
}: {
  value: ContactMethod;
  onChange: (v: ContactMethod) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CONTACT_METHODS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold cursor-pointer transition-colors ${
            value === id ? FU_PILL_ACTIVE : FU_PILL_INACTIVE
          }`}
          onClick={() => onChange(id)}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

export function OutcomeGrid({
  value,
  onChange,
}: {
  value: FollowUpOutcome;
  onChange: (v: FollowUpOutcome) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {OUTCOMES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`inline-flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-[10px] font-bold cursor-pointer transition-colors min-h-[72px] ${
            value === id ? FU_PILL_ACTIVE : FU_PILL_INACTIVE
          }`}
          onClick={() => onChange(id)}
        >
          <Icon className="w-4 h-4" />
          <span className="text-center leading-tight">{label}</span>
        </button>
      ))}
    </div>
  );
}

export function CharCountTextarea({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  rows = 3,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className={FU_FORM_LABEL_CLS}>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className={FU_FORM_INPUT_CLS}
      />
      <p className="text-[10px] text-slate-400 text-right">{value.length}/{maxLength}</p>
    </label>
  );
}

export function StaffSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: StaffOption[];
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className={FU_FORM_LABEL_CLS}>{label}{required ? ' *' : ''}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`${FU_FORM_INPUT_CLS} cursor-pointer pl-9`}
        >
          <option value="">Select staff…</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.name}>{opt.name}</option>
          ))}
        </select>
        {value && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">
            {options.find((o) => o.name === value)?.initials ?? '?'}
          </span>
        )}
      </div>
    </label>
  );
}

export function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
          checked ? 'bg-blue-600' : 'bg-slate-200'
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

export function FileUploadZone({
  fileName,
  previewUrl,
  onFileSelect,
}: {
  fileName: string;
  previewUrl?: string;
  onFileSelect: (result: { name: string; url: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || uploading) return;

    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);

    if (isPdf) {
      onFileSelect({ name: file.name, url: '' });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (!isImage) {
      toast.error('Unsupported file', { module: 'Customer Due', description: 'Use PNG, JPG, WebP, or PDF.' });
      return;
    }

    const localError = validateImageFile(file);
    if (localError) {
      toast.error('Invalid image', { module: 'Customer Due', description: localError });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImageToImgBB(file);
      onFileSelect({ name: file.name, url: result.url });
      toast.success('Image uploaded', { module: 'Customer Due', description: 'Attachment saved to ImgBB.' });
    } catch (err) {
      const message = err instanceof ImgBBUploadError ? err.message : 'Image upload failed.';
      toast.error('Upload failed', { module: 'Customer Due', description: message });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <p className={`${FU_FORM_LABEL_CLS} mb-2`}>Attach Document / Screenshot</p>
      <button
        type="button"
        disabled={uploading}
        className={`${FU_UPLOAD_ZONE_CLS} w-full disabled:opacity-60 disabled:cursor-not-allowed`}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-spin" />
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="w-16 h-16 object-cover rounded-lg mx-auto mb-2" />
        ) : (
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        )}
        <p className="text-xs font-bold text-slate-700">
          {uploading ? 'Uploading…' : fileName || 'Click to upload or drag and drop'}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, PDF (Max. 5MB) — images upload to ImgBB</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
        className="hidden"
        disabled={uploading}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

export function FormFieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className={FU_FORM_LABEL_CLS}>
      {children}{required ? ' *' : ''}
    </span>
  );
}

export { FU_FORM_INPUT_CLS };
