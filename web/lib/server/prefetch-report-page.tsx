import { ReportInitialDataProvider } from '@/components/providers/ReportInitialDataProvider';
import type { ReportType } from '@/lib/services/report-api-service';

/** Client `use-report-api-data` fetches the report — do not block navigation on Railway. */
export async function prefetchReportPage(
  _reportType: ReportType,
  children: React.ReactNode,
  _revalidateSeconds = 30,
) {
  return (
    <ReportInitialDataProvider data={null}>
      {children}
    </ReportInitialDataProvider>
  );
}
