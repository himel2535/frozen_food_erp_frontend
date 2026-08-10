import { EmployeeFormPage } from '@/components/modules/hrm/employee-form/EmployeeFormPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeFormPage mode="edit" employeeId={id} />;
}
