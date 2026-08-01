import { SalesOrderFormPage } from '@/components/modules/sales/SalesOrderFormPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SalesOrderFormPage mode="edit" orderId={id} />;
}
