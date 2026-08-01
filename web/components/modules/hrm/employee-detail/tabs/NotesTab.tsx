'use client';

import { Clock, FileText } from 'lucide-react';
import {
  ED_BODY,
  ED_CAPTION,
  ED_CARD_COMPACT,
  ED_SECTION_HEADER_COMPACT,
  ED_TITLE,
} from '@/components/modules/hrm/employee-detail/employee-detail-styles';
import {
  employeeStatusLabel,
  formatEmployeeDate,
} from '@/components/modules/hrm/employee-detail/employee-detail-utils';
import { formatMoney } from '@/lib/services/hrm-service';

type NotesTabProps = {
  employee: Record<string, unknown>;
  attendanceCount: number;
  payrollCount: number;
  projectCount: number;
};

export function NotesTab({ employee, attendanceCount, payrollCount, projectCount }: NotesTabProps) {
  const notes = String(employee.notes ?? '').trim();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className={ED_CARD_COMPACT}>
        <div className={ED_SECTION_HEADER_COMPACT}>
          <FileText className="w-4 h-4 text-blue-500" />
          <h3 className={ED_TITLE}>Employee Notes</h3>
        </div>
        {notes ? (
          <p className={`${ED_BODY} whitespace-pre-wrap leading-relaxed`}>{notes}</p>
        ) : (
          <p className={ED_CAPTION}>No notes recorded for this employee.</p>
        )}
      </div>

      <div className={ED_CARD_COMPACT}>
        <div className={ED_SECTION_HEADER_COMPACT}>
          <Clock className="w-4 h-4 text-blue-500" />
          <h3 className={ED_TITLE}>Profile Summary</h3>
        </div>
        <ul className="space-y-2">
          <li className="flex justify-between gap-3 py-2 border-b border-slate-50">
            <span className={ED_CAPTION}>Status</span>
            <span className={ED_BODY}>{employeeStatusLabel(employee.status)}</span>
          </li>
          <li className="flex justify-between gap-3 py-2 border-b border-slate-50">
            <span className={ED_CAPTION}>Joined</span>
            <span className={ED_BODY}>{formatEmployeeDate(employee.joiningDate)}</span>
          </li>
          <li className="flex justify-between gap-3 py-2 border-b border-slate-50">
            <span className={ED_CAPTION}>Salary (Monthly)</span>
            <span className={ED_BODY}>{employee.salary ? formatMoney(Number(employee.salary)) : '—'}</span>
          </li>
          <li className="flex justify-between gap-3 py-2 border-b border-slate-50">
            <span className={ED_CAPTION}>Attendance Records</span>
            <span className={ED_BODY}>{attendanceCount}</span>
          </li>
          <li className="flex justify-between gap-3 py-2 border-b border-slate-50">
            <span className={ED_CAPTION}>Payroll Slips</span>
            <span className={ED_BODY}>{payrollCount}</span>
          </li>
          <li className="flex justify-between gap-3 py-2">
            <span className={ED_CAPTION}>Projects as Lead</span>
            <span className={ED_BODY}>{projectCount}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
