import { ReportInitialDataProvider } from '@/components/providers/ReportInitialDataProvider';
import { isMongoDbBackend } from '@/lib/config/data-source';
import { fetchServerReportData, type ReportType } from '@/lib/services/report-api-service';

/** Server-side report prefetch — one aggregate API call instead of multi-module full lists. */
export async function prefetchReportPage(
  reportType: ReportType,
  children: React.ReactNode,
  revalidateSeconds = 30,
) {
  let payload = null;
  if (isMongoDbBackend()) {
    payload = await fetchServerReportData(reportType, revalidateSeconds);
  }

  return (
    <ReportInitialDataProvider data={payload ? { [reportType]: payload } : null}>
      {children}
    </ReportInitialDataProvider>
  );
}
