'use client';

import { Icon } from '@iconify/react';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import { formatMoney, type getRecipeBomKpiMetrics } from '@/lib/services/recipes-service';

type RecipeVariant = 'finished-goods' | 'semi-finished';
type Metrics = ReturnType<typeof getRecipeBomKpiMetrics>;

const KPI_GRID = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2';

export function RecipesBomMetrics({
  variant,
  metrics,
}: {
  variant: RecipeVariant;
  metrics: Metrics;
}) {
  const totalLabel = variant === 'finished-goods' ? 'Total FG BOMs' : 'Total SF BOMs';

  const items: KpiCardItem[] = [
    {
      key: 'total',
      label: totalLabel,
      value: String(metrics.total),
      sub: 'Recipes in this collection',
      icon: <Icon icon="flat-color-icons:todo-list" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'active',
      label: 'Active BOMs',
      value: String(metrics.active),
      sub: metrics.inactive > 0 ? `${metrics.inactive} inactive` : 'All active',
      icon: <Icon icon="fluent-color:checkmark-circle-24" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'withMaterials',
      label: 'With Materials',
      value: String(metrics.withMaterials),
      sub: 'BOMs with parts listed',
      icon: <Icon icon="flat-color-icons:serial-tasks" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'materialLines',
      label: 'Material Lines',
      value: String(metrics.totalMaterialLines),
      sub: 'Total BOM line items',
      icon: <Icon icon="flat-color-icons:tree-structure" width={38} height={38} className="shrink-0" />,
    },
    {
      key: 'avgCost',
      label: 'Avg BOM Cost',
      value: formatMoney(metrics.avgBomCost),
      sub: 'Per product average',
      icon: <Icon icon="flat-color-icons:currency-exchange" width={38} height={38} className="shrink-0" />,
    },
  ];

  return <ModuleKpiSection items={items} gridClassName={KPI_GRID} />;
}
