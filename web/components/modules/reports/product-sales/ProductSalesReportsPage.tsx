'use client';

import { useMemo, useState } from 'react';
import { Download, Filter, Printer } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useProductSalesReportApiRows } from '@/hooks/use-report-api-data';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isMongoDbBackend } from '@/lib/config/data-source';
import { isKpiBootLoading, pickApiReportRows } from '@/lib/ui/kpi-loading';
import { useAppStore } from '@/lib/state/app-store';
import { toast } from '@/lib/ui/feedback';
import { DateInput } from '@/components/shared/DateInput';
import { SalesReportMetrics } from '@/components/modules/reports/sales/SalesReportMetrics';
import { ProductSalesShareDonut } from '@/components/modules/reports/product-sales/ProductSalesShareDonut';
import { ProductSalesTopList } from '@/components/modules/reports/product-sales/ProductSalesTopList';
import { ProductSalesTable } from '@/components/modules/reports/product-sales/ProductSalesTable';
import { ProductSalesLinesTable } from '@/components/modules/reports/product-sales/ProductSalesLinesTable';
import { ProductSalesPrintFrame } from '@/components/modules/reports/product-sales/ProductSalesPrintFrame';
import { useReportPrint } from '@/components/modules/reports/shared/useReportPrint';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_ACTION_BTN, MODULE_PRINT_BTN } from '@/lib/ui/module-chrome-styles';
import {
  ReportDonutSkeleton,
  ReportTableSkeleton,
  ReportTopListSkeleton,
} from '@/components/modules/reports/shared/ReportSectionSkeleton';
import {
  PSR_CHARTS_ROW,
  PSR_FILTER_INPUT,
  type ProductSalesPrintSectionId,
} from '@/components/modules/reports/product-sales/product-sales-report-styles';
import {
  aggregateProductSales,
  buildCustomerShareSlices,
  buildProductCustomerRows,
  buildProductSalesKpis,
  buildProductShareSlices,
  buildSingleProductKpis,
  filterProductSaleLines,
  formatFilterSummary,
  invoicesToProductSaleLines,
  listProductSaleLines,
  uniqueProductOptions,
  type ProductSalesRow,
} from '@/components/modules/reports/product-sales/product-sales-report-utils';
import {
  exportProductSalesLinesCsv,
  exportProductSalesReportCsv,
} from '@/lib/services/report-export';

export function ProductSalesReportsPage() {
  const appState = useAppStore((s) => s.appState);
  const apiMode = isMongoDbBackend();
  const apiReport = useProductSalesReportApiRows();
  const kpiLoading = isKpiBootLoading(apiMode, apiReport.initialized);
  const t = useAppStore((s) => s.t);
  const { printSection, printTarget } = useReportPrint<ProductSalesPrintSectionId>();

  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [productKey, setProductKey] = useState('');

  const allLines = useMemo(
    () => {
      const apiLines = listProductSaleLines(apiReport.rows);
      const localLines = invoicesToProductSaleLines(
        Array.isArray(appState.invoices) ? appState.invoices : [],
      );
      return pickApiReportRows(apiMode, apiReport.initialized, apiLines, localLines);
    },
    [apiMode, apiReport.initialized, apiReport.rows, appState.invoices],
  );

  const productOptions = useMemo(() => uniqueProductOptions(allLines), [allLines]);
  const selectedProduct = useMemo(
    () => productOptions.find((item) => item.key === productKey),
    [productOptions, productKey],
  );
  const productMode = Boolean(productKey);
  useChromeSuppressed(productMode);

  const filters = useMemo(
    () => ({ search, dateStart, dateEnd, productKey }),
    [search, dateStart, dateEnd, productKey],
  );

  const filteredLines = useMemo(() => filterProductSaleLines(allLines, filters), [allLines, filters]);
  const productRows = useMemo(() => aggregateProductSales(filteredLines), [filteredLines]);
  const customerRows = useMemo(() => buildProductCustomerRows(filteredLines), [filteredLines]);
  const slices = useMemo(
    () => (productMode ? buildCustomerShareSlices(filteredLines) : buildProductShareSlices(productRows)),
    [productMode, filteredLines, productRows],
  );
  const totalRevenue = useMemo(
    () => (productMode
      ? filteredLines.reduce((sum, line) => sum + line.revenue, 0)
      : productRows.reduce((sum, row) => sum + row.revenue, 0)),
    [productMode, filteredLines, productRows],
  );

  const kpis = useMemo(() => {
    if (productMode) {
      const items = buildSingleProductKpis(filteredLines);
      const labelKeys: Record<string, string> = {
        revenue: 'reports.product_sales_kpi_revenue',
        qty: 'reports.product_sales_kpi_qty',
        avg: 'reports.product_sales_kpi_avg',
        invoices: 'reports.product_sales_kpi_invoices',
        customers: 'reports.product_sales_kpi_customers',
      };
      return items.map((item) => ({ ...item, label: t(labelKeys[item.key] ?? item.label) }));
    }
    const items = buildProductSalesKpis(productRows);
    const labelKeys: Record<string, string> = {
      revenue: 'reports.product_sales_kpi_revenue',
      products: 'reports.product_sales_kpi_products',
      qty: 'reports.product_sales_kpi_qty',
      avg: 'reports.product_sales_kpi_avg',
      topShare: 'reports.product_sales_kpi_share',
    };
    return items.map((item) => ({ ...item, label: t(labelKeys[item.key] ?? item.label) }));
  }, [productMode, filteredLines, productRows, t]);

  const filterSummary = useMemo(
    () => formatFilterSummary(filters, selectedProduct?.productName),
    [filters, selectedProduct],
  );

  const reportTitle = productMode && selectedProduct
    ? t('reports.product_sales_product_title', { name: selectedProduct.productName })
    : t('reports.product_sales_title');

  const handleExport = () => {
    const count = productMode
      ? exportProductSalesLinesCsv({
          title: reportTitle,
          filterSummary,
          kpis,
          rows: filteredLines,
        })
      : exportProductSalesReportCsv({
          title: reportTitle,
          filterSummary,
          kpis,
          rows: productRows,
        });
    if (count === 0) {
      toast.warning(t('reports.export_empty'), { module: 'Reports' });
      return;
    }
    toast.success(t('reports.export_success', { rows: count }), { module: 'Reports' });
  };

  const handleResetFilters = () => {
    setSearch('');
    setDateStart('');
    setDateEnd('');
    setProductKey('');
  };

  const openProductReport = (row: ProductSalesRow) => {
    setSearch('');
    setProductKey(row.key);
  };

  const sectionTitles: Record<ProductSalesPrintSectionId, string> = {
    metrics: t('reports.product_sales_print_metrics'),
    share: productMode ? t('reports.product_sales_customers') : t('reports.product_sales_share'),
    top: productMode ? t('reports.product_sales_top_customers') : t('reports.product_sales_top'),
    products: t('reports.product_sales_table'),
    lines: t('reports.product_sales_lines'),
    full: reportTitle,
  };

  const headerActions = (
    <>
      <button type="button" onClick={() => printSection('full')} className={MODULE_PRINT_BTN}>
        <Printer className="w-4 h-4" />
        {t('reports.print_full')}
      </button>
      <button
        type="button"
        onClick={handleExport}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        {t('reports.product_sales_export')}
      </button>
    </>
  );

  useRegisterModuleActions(headerActions, [printSection, handleExport, t]);

  return (
    <div className={`space-y-2 ${productMode ? 'px-2 md:px-4' : ''}`.trim()}>
      {productMode ? (
        <div className="pt-3 md:pt-4 mb-3 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
          <FormHeader
            compact
            title={reportTitle}
            subtitle={selectedProduct?.sku || undefined}
            onBack={() => setProductKey('')}
            backLabel={t('reports.product_sales_back')}
          />
          <div className="flex flex-wrap items-center gap-2 shrink-0">{headerActions}</div>
        </div>
      ) : null}
      {apiReport.error ? <ApiModeBanner module="invoices" error={apiReport.error} /> : null}
      <SalesReportMetrics items={kpis} loading={kpiLoading} />

      <ModuleFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={
          productMode
            ? t('reports.product_sales_search_lines')
            : t('reports.product_sales_search_placeholder')
        }
        filters={
          <>
            <select
              value={productKey}
              onChange={(e) => {
                setSearch('');
                setProductKey(e.target.value);
              }}
              className={`${PSR_FILTER_INPUT} max-w-[220px]`}
              aria-label={t('reports.product_sales_all_products')}
            >
              <option value="">{t('reports.product_sales_all_products')}</option>
              {productOptions.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.sku ? `${item.productName} (${item.sku})` : item.productName}
                </option>
              ))}
            </select>
            <DateInput
              value={dateStart}
              onChange={setDateStart}
              className={PSR_FILTER_INPUT}
              aria-label={t('reports.product_sales_date_from')}
            />
            <DateInput
              value={dateEnd}
              onChange={setDateEnd}
              className={PSR_FILTER_INPUT}
              aria-label={t('reports.product_sales_date_to')}
            />
            <button type="button" onClick={handleResetFilters} className={MODULE_FILTER_ACTION_BTN}>
              <Filter className="w-4 h-4" />
              {t('reports.product_sales_filter')}
            </button>
          </>
        }
      />

      <div className={PSR_CHARTS_ROW}>
        {kpiLoading ? (
          <>
            <ReportDonutSkeleton />
            <ReportDonutSkeleton />
            <ReportTopListSkeleton />
          </>
        ) : (
          <>
            <ProductSalesShareDonut
              title={productMode ? t('reports.product_sales_customers') : t('reports.product_sales_share')}
              slices={slices}
              totalAmount={totalRevenue}
              onPrint={() => printSection('share')}
              printLabel={t('reports.print_section')}
              totalLabel={t('reports.product_sales_kpi_revenue')}
            />
            <ProductSalesTopList
              rows={productMode ? customerRows : productRows}
              title={productMode ? t('reports.product_sales_top_customers') : undefined}
              onPrint={() => printSection('top')}
              onSelect={productMode ? undefined : openProductReport}
            />
          </>
        )}
      </div>

      {kpiLoading ? (
        <ReportTableSkeleton columns={productMode ? 6 : 7} />
      ) : productMode ? (
        <ProductSalesLinesTable
          rows={filteredLines}
          onPrint={() => printSection('lines')}
          printLabel={t('reports.print_section')}
        />
      ) : (
        <ProductSalesTable
          rows={productRows}
          onPrint={() => printSection('products')}
          printLabel={t('reports.print_section')}
          onGenerateReport={openProductReport}
        />
      )}

      <Footer />

      <ProductSalesPrintFrame
        printTarget={printTarget}
        reportTitle={reportTitle}
        generatedLabel={t('reports.print_generated')}
        filterSummary={filterSummary}
        confidentialLabel={t('reports.print_confidential')}
        sectionTitles={sectionTitles}
        kpis={kpis}
        slices={slices}
        topRows={productMode ? customerRows.slice(0, 5) : productRows.slice(0, 5)}
        rows={productRows}
        lineRows={productMode ? filteredLines : undefined}
        tableHeaders={{
          product: productMode
            ? t('reports.product_sales_col_customer')
            : t('reports.product_sales_col_product'),
          sku: t('reports.product_sales_col_sku'),
          qty: t('reports.product_sales_col_qty'),
          avg: t('reports.product_sales_col_avg'),
          revenue: t('reports.product_sales_col_revenue'),
          invoices: t('reports.product_sales_col_invoices'),
          share: t('reports.product_sales_col_share'),
          date: t('reports.product_sales_col_date'),
          invoice: t('reports.product_sales_col_invoice'),
          customer: t('reports.product_sales_col_customer'),
          unit: t('reports.product_sales_col_unit'),
        }}
      />
    </div>
  );
}
