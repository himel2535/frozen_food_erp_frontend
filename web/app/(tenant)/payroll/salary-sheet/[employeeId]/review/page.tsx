import { EmployeeReviewPayPage } from '@/components/modules/payroll/salary-sheet/review/EmployeeReviewPayPage';

export default async function Page({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  return <EmployeeReviewPayPage employeeId={employeeId} />;
}
