import { SupplierDetailPage } from '@/components/modules/purchases/suppliers/detail/SupplierDetailPage';

export default async function Page({ params }: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await params;
  return <SupplierDetailPage supplierId={supplierId} />;
}
