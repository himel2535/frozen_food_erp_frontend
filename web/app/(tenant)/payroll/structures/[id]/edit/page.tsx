import { SalarySetupFormPage } from '@/components/modules/payroll/SalarySetupFormPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SalarySetupFormPage mode="edit" structureId={id} />;
}
