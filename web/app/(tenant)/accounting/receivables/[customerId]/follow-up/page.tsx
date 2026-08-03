import { CustomerDueFollowUpPage } from '@/components/modules/accounting/customer-due/follow-up/CustomerDueFollowUpPage';

export default async function Page({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  return <CustomerDueFollowUpPage customerId={customerId} />;
}
