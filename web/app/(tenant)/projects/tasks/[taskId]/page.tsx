import { PmTaskDetailPage } from '@/components/modules/project-management/PmTaskDetailPage';

export default async function Page({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return <PmTaskDetailPage taskId={taskId} />;
}
