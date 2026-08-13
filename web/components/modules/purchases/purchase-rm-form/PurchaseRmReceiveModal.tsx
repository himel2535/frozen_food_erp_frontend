'use client';

import { toast } from '@/lib/ui/feedback';

import { useEffect, useState, type FormEvent } from 'react';
import { CloudUpload, X } from 'lucide-react';
import { AppFormModal } from '@/components/shared/AppForm';
import { FORM_LABEL_CLS, FORM_SELECT_CLS, FORM_TEXTAREA_CLS } from '@/lib/ui/form-styles';
import type { PurchaseRmReceiveAttachment } from '@/lib/services/purchase-rm-service';
import { formatPoMoney } from '@/lib/services/purchase-rm-service';

const PROOF_TYPES = [
  { value: 'receipt', label: 'Receipt (Roshid)' },
  { value: 'bank', label: 'Bank Transaction' },
  { value: 'other', label: 'Other' },
];

export type PurchaseRmReceiveSubmitPayload = {
  proofType: string;
  proofNote: string;
  attachments: PurchaseRmReceiveAttachment[];
};

export function PurchaseRmReceiveModal({
  open,
  order,
  onClose,
  onSubmit,
}: {
  open: boolean;
  order: Record<string, unknown> | null;
  onClose: () => void;
  onSubmit: (payload: PurchaseRmReceiveSubmitPayload) => void;
}) {
  const [proofType, setProofType] = useState('receipt');
  const [proofNote, setProofNote] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentDataUrl, setAttachmentDataUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    setProofType('receipt');
    setProofNote('');
    setAttachmentName('');
    setAttachmentDataUrl('');
  }, [open, order]);

  const handleAttachment = async (file: File | null) => {
    if (!file) {
      setAttachmentName('');
      setAttachmentDataUrl('');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Action required', { module: 'Purchase RM', description: "File must be 5MB or smaller." });
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Action required', { module: 'Purchase RM', description: "Only JPG, PNG, WebP and PDF files are allowed." });
      return;
    }
    
    // Use Cloudinary for images
    if (file.type.startsWith('image/')) {
      toast.info('Uploading image...', { module: 'Purchase RM' });
      try {
        const { uploadImageToCloudinary } = await import('@/lib/services/cloudinary-service');
        const res = await uploadImageToCloudinary(file);
        setAttachmentName(file.name);
        setAttachmentDataUrl(res.url); // save cloudinary URL here
        toast.success('Upload complete', { module: 'Purchase RM' });
      } catch (err: any) {
        toast.error('Upload failed', { module: 'Purchase RM', description: err.message });
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentName(file.name);
        setAttachmentDataUrl(String(reader.result ?? ''));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!attachmentName || !attachmentDataUrl) {
      toast.error('Action required', { module: 'Purchase RM', description: "Please upload a proof file (receipt or bank transaction)." });
      return;
    }
    onSubmit({
      proofType,
      proofNote: proofNote.trim(),
      attachments: [{ type: proofType, name: attachmentName, dataUrl: attachmentDataUrl }],
    });
  };

  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const firstItem = items[0] as Record<string, unknown> | undefined;

  return (
    <AppFormModal
      open={open}
      onClose={onClose}
      title="Receive Raw Materials"
      subtitle={`Upload purchase proof for ${String(order.id)} before confirming receive.`}
      onSubmit={handleSubmit}
      submitLabel="Submit Receive"
      cancelLabel="Cancel"
      size="lg"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
          <p><span className="font-bold text-slate-500">RM Order:</span> {String(order.id)}</p>
          <p><span className="font-bold text-slate-500">Supplier:</span> {String(order.supplierName ?? '—')}</p>
          <p><span className="font-bold text-slate-500">Warehouse:</span> {String(order.warehouseName ?? '—')}</p>
          <p><span className="font-bold text-slate-500">Item:</span> {String(firstItem?.productName ?? '—')}</p>
          <p className="sm:col-span-2"><span className="font-bold text-slate-500">Order Total:</span> {formatPoMoney(Number(order.grandTotal ?? order.total ?? 0))}</p>
        </div>

        <div>
          <label className={FORM_LABEL_CLS} htmlFor="proof-type">Proof Type</label>
          <select
            id="proof-type"
            value={proofType}
            onChange={(e) => setProofType(e.target.value)}
            className={`${FORM_SELECT_CLS} cursor-pointer`}
          >
            {PROOF_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={FORM_LABEL_CLS}>Upload Proof (required)</label>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50/30 text-xs font-semibold text-slate-600 cursor-pointer transition-colors">
              <CloudUpload className="w-4 h-4 text-blue-500 shrink-0" />
              Upload file
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => handleAttachment(e.target.files?.[0] ?? null)}
              />
            </label>
            {attachmentName && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold max-w-[12rem] truncate">
                {attachmentName}
                <button
                  type="button"
                  onClick={() => handleAttachment(null)}
                  className="cursor-pointer shrink-0"
                  aria-label="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">JPG, PNG, or PDF — max 2MB. Roshid ba bank slip upload korun.</p>
        </div>

        <div>
          <label className={FORM_LABEL_CLS} htmlFor="proof-note">Note (optional)</label>
          <textarea
            id="proof-note"
            value={proofNote}
            onChange={(e) => setProofNote(e.target.value)}
            rows={2}
            placeholder="Optional note about this receive..."
            className={FORM_TEXTAREA_CLS}
          />
        </div>
      </div>
    </AppFormModal>
  );
}
