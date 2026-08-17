import { PmProjectFormPage } from '@/components/modules/project-management/PmProjectFormPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PmProjectFormPage mode="edit" projectId={id} />;
}
