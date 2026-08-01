import { PurchaseOrderFormPage } from '@/components/modules/purchases/PurchaseOrderFormPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PurchaseOrderFormPage mode="edit" orderId={id} />;
}
