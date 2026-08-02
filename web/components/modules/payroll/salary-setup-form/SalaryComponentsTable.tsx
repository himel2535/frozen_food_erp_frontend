'use client';

import { Plus } from 'lucide-react';
import { TableIconAction } from '@/components/shared/TableIconAction';
import {
  CALCULATION_OPTIONS,
  COMPONENT_TYPE_OPTIONS,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-options';
import {
  SS_ADD_ITEM_BTN_CLS,
  SS_CELL_INPUT_CLS,
  SS_CELL_SELECT_CLS,
  SS_SECTION_TITLE_CLS,
  SS_TABLE_HEAD_CLS,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-styles';
import type { SalaryComponentRow } from '@/lib/services/payroll-service';
import { computeTotalFixed, formatMoney } from '@/lib/services/payroll-service';
import { createComponentId } from '@/components/modules/payroll/salary-setup-form/salary-setup-form-types';

export function SalaryComponentsTable({
  components,
  onChange,
}: {
  components: SalaryComponentRow[];
  onChange: (rows: SalaryComponentRow[]) => void;
}) {
  const totalFixed = computeTotalFixed(components);

  const updateRow = (id: string, patch: Partial<SalaryComponentRow>) => {
    onChange(components.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    onChange([
      ...components,
      { id: createComponentId(), name: '', type: 'Fixed Amount', calculation: 'Fixed', amount: '0' },
    ]);
  };

  const removeRow = (id: string) => {
    if (components.length <= 1) return;
    onChange(components.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-3">
      <h4 className={SS_SECTION_TITLE_CLS}>Salary Components</h4>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className={SS_TABLE_HEAD_CLS}>
              <th className="px-3 py-2.5 text-left font-bold">Component Name</th>
              <th className="px-3 py-2.5 text-left font-bold">Type</th>
              <th className="px-3 py-2.5 text-left font-bold">Calculation</th>
              <th className="px-3 py-2.5 text-left font-bold">Amount</th>
              <th className="px-3 py-2.5 text-center font-bold w-12">Action</th>
            </tr>
          </thead>
          <tbody>
            {components.map((row) => (
              <tr key={row.id} className="border-t border-slate-50">
                <td className="px-2 py-1.5">
                  <input
                    className={SS_CELL_INPUT_CLS}
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    className={SS_CELL_SELECT_CLS}
                    value={row.type}
                    onChange={(e) => updateRow(row.id, { type: e.target.value })}
                  >
                    {COMPONENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <select
                    className={SS_CELL_SELECT_CLS}
                    value={row.calculation}
                    onChange={(e) => updateRow(row.id, { calculation: e.target.value })}
                  >
                    {CALCULATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className={SS_CELL_INPUT_CLS}
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <TableIconAction variant="delete" label="Remove" onClick={() => removeRow(row.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={addRow} className={SS_ADD_ITEM_BTN_CLS}>
          <Plus className="w-4 h-4" /> Add Component
        </button>
        <div className="text-sm font-extrabold text-blue-700">
          Total Fixed: {formatMoney(totalFixed)}
        </div>
      </div>
    </div>
  );
}
