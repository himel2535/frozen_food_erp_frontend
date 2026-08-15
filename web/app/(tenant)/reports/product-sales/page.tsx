import { ReportsProductSalesPage } from '@/lib/modules/reports-pages';
import { prefetchReportPage } from '@/lib/server/prefetch-report-page';

export default async function Page() {
  return prefetchReportPage('product-sales', <ReportsProductSalesPage />);
}
