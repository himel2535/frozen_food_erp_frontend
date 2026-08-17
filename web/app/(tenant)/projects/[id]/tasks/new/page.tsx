import { PmTaskFormPage } from '@/components/modules/project-management/PmTaskFormPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PmTaskFormPage mode="create" projectId={id} />;
}
