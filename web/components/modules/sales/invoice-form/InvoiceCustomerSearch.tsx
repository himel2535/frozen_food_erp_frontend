'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, User } from 'lucide-react';
import {
  INV_INPUT_CLS,
  INV_LABEL_CLS,
} from '@/components/modules/sales/invoice-form/inv-form-styles';

function formatCustomerLabel(customer: { name: string; company?: string }) {
  const name = String(customer.name ?? '').trim();
  const company = String(customer.company ?? '').trim();
  if (!name) return company;
  return company ? `${name} (${company})` : name;
}

export function InvoiceCustomerSearch({
  customers,
  customerId,
  customerName,
  error,
  onSelect,
}: {
  customers: Array<{ id: string; name: string; company?: string }>;
  customerId: string;
  customerName: string;
  error?: string;
  onSelect: (customerId: string, label: string) => void;
}) {
  const [query, setQuery] = useState(customerName || '');

  useEffect(() => {
    setQuery(customerName || '');
  }, [customerId, customerName]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers.filter((customer) => {
      const hay = `${customer.name} ${customer.company ?? ''} ${customer.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [customers, query]);

  const pickCustomer = (customer: { id: string; name: string; company?: string }) => {
    const label = formatCustomerLabel(customer);
    setQuery(label);
    onSelect(customer.id, label);
  };

  const handleChange = (value: string) => {
    const trimmed = value.trim();
    const exact = customers.find(
      (c) => formatCustomerLabel(c).toLowerCase() === trimmed.toLowerCase(),
    );
    if (exact) {
      pickCustomer(exact);
      return;
    }

    setQuery(value);
    if (!customerId) return;
    const selected = customers.find((c) => c.id === customerId);
    const selectedLabel = selected ? formatCustomerLabel(selected) : customerName;
    if (value.trim() !== selectedLabel.trim()) {
      onSelect('', '');
    }
  };

  const handleBlur = () => {
    if (customerId || !query.trim()) return;
    const exact = customers.find(
      (c) => formatCustomerLabel(c).toLowerCase() === query.trim().toLowerCase(),
    );
    if (exact) pickCustomer(exact);
  };

  const showSuggestions = query.trim().length > 0 && !customerId && filtered.length > 0;

  return (
    <div id="inv-customer">
      <label className={INV_LABEL_CLS}>
        Customer
        <span className="text-rose-500 normal-case"> *</span>
      </label>
      <div className="relative">
        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
        <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
        <input
          type="text"
          list="inv-customer-options"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Search customer or select from list"
          className={`${INV_INPUT_CLS} pl-9 pr-9${error ? ' border-rose-400' : ''}`}
          aria-invalid={error ? true : undefined}
        />
        <datalist id="inv-customer-options">
          {filtered.slice(0, 30).map((customer) => (
            <option key={customer.id} value={formatCustomerLabel(customer)} />
          ))}
        </datalist>
      </div>

      {showSuggestions ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {filtered.slice(0, 5).map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => pickCustomer(customer)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer"
            >
              {formatCustomerLabel(customer)}
            </button>
          ))}
        </div>
      ) : null}

      {!customerId && query.trim() && filtered.length === 0 ? (
        <p className="mt-1 text-[10px] font-semibold text-amber-700">No customers match your search.</p>
      ) : null}

      {error ? <p className="mt-1 text-[10px] font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
