import { ProjectSetupPage } from '@/components/modules/projects/project-form/ProjectSetupPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectSetupPage projectId={id} />;
}
