'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { PO_INPUT_CLS, PO_LABEL_CLS } from '@/components/modules/purchases/purchase-order-form/po-form-styles';

export function PoSupplierSearch({
  suppliers,
  supplierId,
  supplierName,
  error,
  onSelect,
}: {
  suppliers: Array<{ id: string; name: string }>;
  supplierId: string;
  supplierName: string;
  error?: string;
  onSelect: (supplierId: string, label: string) => void;
}) {
  const [query, setQuery] = useState(supplierName || '');

  useEffect(() => {
    setQuery(supplierName || '');
  }, [supplierId, supplierName]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers.slice(0, 8);
    return suppliers.filter((s) => `${s.name} ${s.id}`.toLowerCase().includes(q));
  }, [suppliers, query]);

  const pick = (supplier: { id: string; name: string }) => {
    setQuery(supplier.name);
    onSelect(supplier.id, supplier.name);
  };

  const handleChange = (value: string) => {
    const exact = suppliers.find((s) => s.name.toLowerCase() === value.trim().toLowerCase());
    if (exact) {
      pick(exact);
      return;
    }
    setQuery(value);
    if (supplierId && value.trim() !== supplierName.trim()) onSelect('', '');
  };

  return (
    <div id="po-field-supplierId">
      <label className={PO_LABEL_CLS}>
        Supplier <span className="text-rose-500 normal-case">*</span>
      </label>
      <div className="relative">
        <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
        <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
        <input
          type="text"
          list="po-supplier-options"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search supplier..."
          className={`${PO_INPUT_CLS} pl-9 pr-9${error ? ' border-rose-400' : ''}`}
        />
        <datalist id="po-supplier-options">
          {filtered.slice(0, 30).map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
      </div>
      {!supplierId && query.trim() && filtered.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {filtered.slice(0, 5).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer"
            >
              {s.name}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p className="mt-1 text-[10px] font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
