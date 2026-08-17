import { PmTaskFormPage } from '@/components/modules/project-management/PmTaskFormPage';

export default async function Page({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return <PmTaskFormPage mode="edit" taskId={taskId} />;
}
