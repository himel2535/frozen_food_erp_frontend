'use client';

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';

interface CurrencyFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  currency?: string;
}

export function CurrencyField(props: CurrencyFieldProps) {
  const { label, value, onChange, required, currency = 'BDT' } = props;
  return (
    <div>
      <label className="block mb-2 text-xs font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">{currency}</span>
        <input
          type="number"
          step="0.01"
          min="0"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} pl-12`}
        />
      </div>
    </div>
  );
}
