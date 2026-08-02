import { Suspense } from 'react';
import { EmployeeReviewPayPage } from '@/components/modules/payroll/salary-sheet/review/EmployeeReviewPayPage';

export default async function Page({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading...</div>}>
      <EmployeeReviewPayPage employeeId={employeeId} />
    </Suspense>
  );
}
