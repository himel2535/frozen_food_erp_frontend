'use client';

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function DateField({ label, value, onChange, required }: DateFieldProps) {
  return (
    <div>
      <label className="block mb-2 text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      <input
        type="date"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  );
}
