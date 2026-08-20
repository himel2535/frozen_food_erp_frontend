'use client';

import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { InvoicePrint } from '@/components/modules/sales/invoice-form/InvoicePrint';
import type { InvoicePayload } from '@/components/modules/sales/invoice-form/inv-form-types';
import { Button } from '@/components/shared/Button';

export function InvoicePrintPreview({
  invoiceNo,
  data,
  onClose,
}: {
  invoiceNo: string;
  data: InvoicePayload;
  onClose: () => void;
}) {
  const handlePrint = useCallback(async () => {
    document.body.classList.add('print-invoice-active');
    try {
      await document.fonts.ready;
    } catch {
      /* fonts API unavailable */
    }
    await new Promise((resolve) => window.setTimeout(resolve, 200));
    window.print();
  }, []);

  useEffect(() => {
    const onAfterPrint = () => {
      document.body.classList.remove('print-invoice-active');
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('afterprint', onAfterPrint);
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('afterprint', onAfterPrint);
      window.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('print-invoice-active');
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="invoice-print-preview-root fixed inset-0 z-[100] flex flex-col bg-slate-900/60 backdrop-blur-sm">
      <div className="print:hidden flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Invoice Preview</h3>
          <p className="text-[11px] font-medium text-slate-500">{invoiceNo}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={onClose} variant="ghost" leftIcon={<X className="w-4 h-4" />}>
            Close
          </Button>
          <Button type="button" onClick={() => void handlePrint()} variant="primary" leftIcon={<Printer className="w-4 h-4" />}>
            Print Invoice
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
        <InvoicePrint invoiceNo={invoiceNo} data={data} />
      </div>
    </div>,
    document.body,
  );
}
