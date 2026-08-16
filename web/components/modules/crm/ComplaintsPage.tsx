'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PaginationBar } from '@/components/modules/inventory/shared/inventory-ui';
import { ComplaintForm, EMPTY_COMPLAINT_FORM, type ComplaintFormValues } from '@/components/modules/crm/complaints/ComplaintForm';
import { ComplaintKanbanView } from '@/components/modules/crm/complaints/ComplaintKanbanView';
import { ComplaintOverviewDonut } from '@/components/modules/crm/complaints/ComplaintOverviewDonut';
import { ComplaintTopCategories } from '@/components/modules/crm/complaints/ComplaintTopCategories';
import {
  categoryBadgeClass,
  categoryLabel,
  formatComplaintDateTime,
  formatDueDate,
  formatDueRelative,
  priorityBadgeClass,
} from '@/components/modules/crm/complaints/complaint-display-utils';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { useAppStore } from '@/lib/state/app-store';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  createComplaint,
  deleteComplaint,
  getComplaintCategoryBreakdown,
  getComplaintList,
  getComplaintMetrics,
  getComplaintStatusSummary,
  type ComplaintRecord,
  updateComplaintStatus,
} from '@/lib/services/complaints-service';
import { isModuleApiMode } from '@/lib/config/data-source';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { mapApiComplaintRow, mapComplaintToApi, resolveApiRowId } from '@/lib/services/entity-api-mappers';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { useCustomersOptions } from '@/hooks/use-form-options';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';
import { confirmAction, toast } from '@/lib/ui/feedback';
import { translateStatus } from '@/lib/i18n/resolve-label';

const PAGE_SIZE = 8;

export function ComplaintsPage() {
  const t = useAppStore((s) => s.t);
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const { formatCount } = useLocaleFormat();
  const apiMode = isModuleApiMode('complaints');
  const apiStore = usePaginatedApiResource('complaints', mapApiComplaintRow, { pageSize: PAGE_SIZE });
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);

  const [view, setView] = useState<'main' | 'form'>('main');
  const [layout, setLayout] = useState<'table' | 'kanban'>('table');
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [localPage, setLocalPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const allRows = useMemo(() => {
    const local = getComplaintList(appState);
    return pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, local) as ComplaintRecord[];
  }, [apiMode, apiStore.initialized, apiStore.rows, appState]);
  const metrics = useMemo(() => {
    if (apiMode) {
      return {
        total: apiStore.meta.total,
        open: allRows.filter((r) => r.status === 'open').length,
        inProgress: allRows.filter((r) => r.status === 'in-progress').length,
        resolved: allRows.filter((r) => r.status === 'resolved').length,
        overdue: 0,
        thisMonth: allRows.length,
      };
    }
    return getComplaintMetrics(appState);
  }, [apiMode, allRows, appState]);
  const statusSummary = useMemo(() => {
    if (apiMode) {
      return {
        open: metrics.open,
        inProgress: metrics.inProgress,
        resolved: metrics.resolved,
        overdue: metrics.overdue,
        total: metrics.total,
      };
    }
    return getComplaintStatusSummary(appState);
  }, [apiMode, metrics, appState]);
  const categorySlices = useMemo(() => {
    if (apiMode) {
      const counts = new Map<string, number>();
      allRows.forEach((r) => {
        const cat = String(r.category ?? 'other');
        counts.set(cat, (counts.get(cat) ?? 0) + 1);
      });
      const total = allRows.length || 1;
      return COMPLAINT_CATEGORIES.map((cat) => ({
        key: cat.value,
        label: cat.label,
        count: counts.get(cat.value) ?? 0,
        pct: Math.round(((counts.get(cat.value) ?? 0) / total) * 1000) / 10,
        color: '#64748b',
      })).filter((s) => s.count > 0);
    }
    return getComplaintCategoryBreakdown(appState);
  }, [apiMode, allRows, appState]);
  const customers = useCustomersOptions();

  const pct = (n: number) => (metrics.total > 0 ? `${Math.round((n / metrics.total) * 1000) / 10}%` : '0%');

  const filtered = useMemo(() => {
    const q = apiMode ? '' : localSearch.trim().toLowerCase();
    return allRows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && row.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && row.category !== categoryFilter) return false;
      if (!q) return true;
      const hay = [row.ticketNo, row.customerName, row.customerPhone, row.subject, row.sku ?? ''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [allRows, apiMode, apiStore.search, localSearch, statusFilter, priorityFilter, categoryFilter]);

  const displayRows = apiMode
    ? filtered
    : filtered.slice((localPage - 1) * PAGE_SIZE, localPage * PAGE_SIZE);
  const listTotal = apiMode ? apiStore.meta.total : filtered.length;
  const listPage = apiMode ? apiStore.page : localPage;

  const onPageChange = (p: number) => {
    if (apiMode) apiStore.setPage(p);
    else setLocalPage(p);
  };

  const paged = displayRows;

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (paged.every((r) => prev.has(r.id))) {
        const next = new Set(prev);
        paged.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      paged.forEach((r) => next.add(r.id));
      return next;
    });
  }, [paged]);

  const handleCreate = async (values: ComplaintFormValues) => {
    if (!values.subject.trim()) {
      toast.error('Subject is required', { module: 'Complaints' });
      return;
    }
    const customerId = values.customerId && values.customerId !== 'walk-in' ? values.customerId : undefined;
    const payload = {
      customerId,
      customerName: values.customerName || 'Walk-in Customer',
      customerPhone: values.customerPhone,
      subject: values.subject.trim(),
      description: values.description.trim(),
      category: values.category,
      priority: values.priority,
      sku: values.sku.trim() || undefined,
      slaDueAt: values.slaDueAt ? new Date(values.slaDueAt).toISOString() : undefined,
      evidenceImageUrl: values.evidenceImageUrl.trim() || undefined,
    };
    if (apiMode) {
      const result = await apiStore.create(mapComplaintToApi(payload as unknown as Record<string, unknown>));
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Complaints', description: 'error' in result ? String(result.error) : 'Create failed' });
        return;
      }
      setView('main');
      toast.success('Complaint logged successfully', { module: 'Complaints' });
      return;
    }
    createComplaint(appState, payload);
    saveAppState();
    setView('main');
    toast.success('Complaint logged successfully', { module: 'Complaints' });
  };

  const setStatus = async (id: string, status: string) => {
    if (apiMode) {
      const row = allRows.find((r) => String(r.id) === id);
      if (!row) return;
      const result = await apiStore.update(resolveApiRowId(row), mapComplaintToApi({ ...row, status }, String(row.id)));
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Complaints', description: 'error' in result ? String(result.error) : 'Update failed' });
        return;
      }
      setMenuOpenId(null);
      toast.success(`Status updated to ${translateStatus(t, status)}`, { module: 'Complaints' });
      return;
    }
    updateComplaintStatus(appState, id, status);
    saveAppState();
    setMenuOpenId(null);
    toast.success(`Status updated to ${translateStatus(t, status)}`, { module: 'Complaints' });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: 'Delete complaint?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
      module: 'Complaints',
    });
    if (!ok) return;
    if (apiMode) {
      const row = allRows.find((r) => String(r.id) === id);
      if (!row) return;
      const result = await apiStore.remove(resolveApiRowId(row));
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Complaints', description: 'error' in result ? String(result.error) : 'Delete failed' });
        return;
      }
      setMenuOpenId(null);
      toast.success('Complaint deleted', { module: 'Complaints' });
      return;
    }
    deleteComplaint(appState, id);
    saveAppState();
    setMenuOpenId(null);
    toast.success('Complaint deleted', { module: 'Complaints' });
  };

  const columns = useMemo<AppTableColumn<ComplaintRecord>[]>(() => [
    {
      key: 'ticketNo',
      label: 'Ticket ID',
      render: (row) => (
        <button type="button" className="text-blue-600 font-bold hover:underline cursor-pointer">
          {row.ticketNo}
        </button>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-bold text-slate-800 truncate">{row.customerName}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{row.customerPhone || '—'}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (row) => (
        <div className="min-w-0 max-w-[220px]">
          <p className="font-semibold text-slate-800 truncate">{row.subject}</p>
          {row.sku ? <p className="text-[10px] text-slate-400 mt-0.5">SKU: {row.sku}</p> : null}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold border ${categoryBadgeClass(row.category)}`}>
          {categoryLabel(row.category)}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold border capitalize ${priorityBadgeClass(row.priority)}`}>
          {row.priority}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'openedAt',
      label: 'Date',
      render: (row) => {
        const dt = formatComplaintDateTime(row.openedAt);
        if (typeof dt === 'string') return dt;
        return (
          <div>
            <p className="font-semibold text-slate-700">{dt.date}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{dt.time}</p>
          </div>
        );
      },
    },
    {
      key: 'slaDueAt',
      label: 'Due Date',
      render: (row) => {
        const rel = formatDueRelative(row.slaDueAt, row.status);
        return (
          <div>
            <p className="font-semibold text-slate-700">{formatDueDate(row.slaDueAt)}</p>
            <p className={`text-[10px] mt-0.5 font-semibold ${rel.tone === 'danger' ? 'text-rose-600' : rel.tone === 'success' ? 'text-emerald-600' : rel.tone === 'warning' ? 'text-amber-600' : 'text-slate-400'}`}>
              {rel.text}
            </p>
          </div>
        );
      },
    },
  ], [t]);

  useChromeSuppressed(view === 'form');

  useRegisterModuleActions(
    view === 'main' ? (
      <button
        type="button"
        onClick={() => setView('form')}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> {t('crm.add_complaint')}
      </button>
    ) : null,
    [view, t],
  );

  if (view === 'form') {
    return (
      <ComplaintForm
        mode="create"
        customers={customers}
        initialValues={EMPTY_COMPLAINT_FORM}
        onCancel={() => setView('main')}
        onSubmit={handleCreate}
      />
    );
  }

  return (
    <>
      {apiMode && <ApiModeBanner module="complaints" />}
      <ModuleKpiSection
        gridClassName="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2"
        kpiCount={5}
        loading={bootLoading}
        items={[
          {
            key: 'total',
            label: 'Total Complaints',
            value: formatCount(metrics.total),
            sub: `+${metrics.thisMonth} this month`,
            iconify: 'flat-color-icons:feedback',
          },
          {
            key: 'open',
            label: 'Open',
            value: formatCount(metrics.open),
            sub: pct(metrics.open),
            iconify: 'flat-color-icons:opened-folder',
          },
          {
            key: 'progress',
            label: 'In Progress',
            value: formatCount(metrics.inProgress),
            sub: pct(metrics.inProgress),
            iconify: 'flat-color-icons:process',
          },
          {
            key: 'resolved',
            label: 'Resolved',
            value: formatCount(metrics.resolved),
            sub: pct(metrics.resolved),
            iconify: 'flat-color-icons:approval',
          },
          {
            key: 'overdue',
            label: 'Overdue',
            value: formatCount(metrics.overdue),
            sub: pct(metrics.overdue),
            alert: metrics.overdue > 0,
            iconify: 'flat-color-icons:alarm-clock',
          },
        ]}
      />

      <ModuleFilterBar
        search={apiMode ? apiStore.search : localSearch}
        onSearchChange={(v) => {
          if (apiMode) apiStore.setSearchTerm(v);
          else setLocalSearch(v);
          onPageChange(1);
        }}
        searchPlaceholder="Search by ticket ID, customer name, subject or product..."
        filters={
          <>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); onPageChange(1); }} className={MODULE_FILTER_INPUT}>
              <option value="all">All Status</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>{translateStatus(t, s)}</option>
              ))}
            </select>
            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); onPageChange(1); }} className={MODULE_FILTER_INPUT}>
              <option value="all">All Priority</option>
              {COMPLAINT_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); onPageChange(1); }} className={MODULE_FILTER_INPUT}>
              <option value="all">All Categories</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button type="button" className={`${MODULE_FILTER_INPUT} inline-flex items-center gap-1.5`}>
              <SlidersHorizontal className="w-3.5 h-3.5" /> More Filters
            </button>
            <div className="inline-flex rounded-xl border border-blue-100/70 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setLayout('table')}
                className={`px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${layout === 'table' ? 'bg-blue-600 text-white' : 'bg-white/45 text-slate-600 hover:bg-blue-50'}`}
              >
                <List className="w-3.5 h-3.5" /> Table View
              </button>
              <button
                type="button"
                onClick={() => setLayout('kanban')}
                className={`px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${layout === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white/45 text-slate-600 hover:bg-blue-50'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Kanban View
              </button>
            </div>
            <button type="button" onClick={() => toast.info('Export coming soon', { module: 'Complaints' })} className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-blue-100/70 bg-white/45 text-blue-700 cursor-pointer shrink-0">
              <Download className="w-4 h-4" />
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-3 items-start flex-1 min-h-0">
        <div className="flex flex-col gap-3 min-h-0">
          {layout === 'table' ? (
            <>
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && paged.every((r) => selectedIds.has(r.id))}
                  onChange={toggleSelectAll}
                  className="cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Select page</span>
              </div>
              <AppTable
                columns={columns}
                rows={paged}
                loading={bootLoading}
                rowKey={(row) => row.id}
                emptyMessage={t('crm.select_complaint')}
                renderActions={(row) => (
                  <div className="relative">
                    <button
                      type="button"
                      className="app-table-icon-btn cursor-pointer"
                      onClick={() => setMenuOpenId(menuOpenId === row.id ? null : row.id)}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuOpenId === row.id ? (
                      <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1">
                        <button type="button" onClick={() => setStatus(row.id, 'in-progress')} className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">
                          Mark In Progress
                        </button>
                        <button type="button" onClick={() => setStatus(row.id, 'resolved')} className="w-full text-left px-3 py-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer">
                          Mark Resolved
                        </button>
                        <button type="button" onClick={() => handleDelete(row.id)} className="w-full text-left px-3 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              />
              <PaginationBar page={listPage} pageSize={PAGE_SIZE} total={listTotal} onPageChange={onPageChange} />
            </>
          ) : (
            <ComplaintKanbanView
              rows={filtered}
              onStatusChange={setStatus}
              onOpen={(row) => toast.info(row.subject, { module: row.ticketNo, description: row.description || 'No description' })}
            />
          )}
        </div>

        <aside className="premium-card premium-shadow p-4 space-y-5 shrink-0 xl:sticky xl:top-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Complaint Overview</h3>
            <ComplaintOverviewDonut summary={statusSummary} />
          </div>
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Top Complaint Categories</h3>
            <ComplaintTopCategories slices={categorySlices} />
          </div>
          <Link href="/reports/customers" className="inline-flex text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
            View All Reports →
          </Link>
        </aside>
      </div>

      <Footer />
    </>
  );
}
