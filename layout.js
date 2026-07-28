import {
  createIcons,
  LayoutDashboard,
  Users,
  User,
  UserPlus,
  Receipt,
  CreditCard,
  Settings,
  ChevronRight,
  LogOut,
  ArrowDownToLine,
  Building,
  Layers,
  Package,
  PackagePlus,
  Wallet,
  LifeBuoy,
  Menu,
  Search,
  Plus,
  Bell,
  MessageSquare,
  ChevronDown,
  ArrowLeft,
  X,
  LayoutGrid,
  ShoppingBag
} from 'lucide';

const ICONS_MAP = {
  LayoutDashboard,
  Users,
  User,
  UserPlus,
  Receipt,
  CreditCard,
  Settings,
  ChevronRight,
  LogOut,
  ArrowDownToLine,
  Building,
  Layers,
  Package,
  PackagePlus,
  Wallet,
  LifeBuoy,
  Menu,
  Search,
  Plus,
  Bell,
  MessageSquare,
  ChevronDown,
  ArrowLeft,
  X,
  LayoutGrid,
  ShoppingBag
};

function ensureIconifyLoaded() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[data-iconify-cdn]')) return;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://code.iconify.design/iconify-icon/3.0.1/iconify-icon.min.js';
  script.setAttribute('data-iconify-cdn', '1');
  document.head.appendChild(script);
}

function renderSidebarIcon(iconOrSection, extraClass = '') {
  const size = String(extraClass).includes('sidebar-icon-lg') ? 36
    : String(extraClass).includes('sidebar-icon-primary-sm') ? 32
    : String(extraClass).includes('sidebar-icon-primary') ? 40
    : String(extraClass).includes('sidebar-icon-sm') ? 24
    : 32;
  const imageSrc = typeof iconOrSection === 'object' && iconOrSection?.imageIcon
    ? iconOrSection.imageIcon
    : null;
  if (imageSrc) {
    return `<img src="${imageSrc}" alt="" width="${size}" height="${size}" class="sidebar-icon ${extraClass} object-contain">`;
  }
  const icon = typeof iconOrSection === 'string' ? iconOrSection : iconOrSection?.iconifyIcon;
  return `<iconify-icon class="sidebar-icon ${extraClass}" icon="${icon}" width="${size}" height="${size}"></iconify-icon>`;
}

ensureIconifyLoaded();

const TENANT_SIDEBAR_SECTIONS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard.html',
    iconifyIcon: 'fluent-color:apps-24',
    color: 'text-slate-600',
    items: []
  },
  {
    id: 'sales-crm',
    label: 'Sales & CRM',
    href: '/crm-leads.html',
    imageIcon: '/images/sidebar/sales-crm.png',
    iconifyIcon: 'fluent-color:people-interwoven-24',
    color: 'text-emerald-600',
    items: [
      { label: 'Customers', href: '/crm-customers.html', view: 'customers', imageIcon: '/images/sidebar/sales-crm/customers.png', iconifyIcon: 'fluent-color:people-24' },
      { label: 'Leads', href: '/crm-leads.html', view: 'leads', imageIcon: '/images/sidebar/sales-crm/leads.png', iconifyIcon: 'fluent-color:person-add-24' },
      { label: 'Deals & Pipeline', href: '/crm-deals.html', view: 'deals', imageIcon: '/images/sidebar/sales-crm/deals.png', iconifyIcon: 'fluent-color:arrow-trending-lines-24' },
      { label: 'Quotations', href: '/sales-quotations.html', view: 'quotations', imageIcon: '/images/sidebar/sales-crm/quotations.png', iconifyIcon: 'fluent-color:document-text-24' },
      { label: 'Sales Orders', href: '/sales-orders.html', view: 'orders', imageIcon: '/images/sidebar/sales-crm/orders.png', iconifyIcon: 'fluent-color:clipboard-task-24' },
      { label: 'Delivery Challan', href: '/sales-deliveries.html', view: 'deliveries', imageIcon: '/images/sidebar/sales-crm/deliveries.png', iconifyIcon: 'flat-color-icons:shipped' },
      { label: 'Dispatch', href: '/sales-dispatch.html', view: 'dispatch', imageIcon: '/images/sidebar/sales-crm/dispatch.png', iconifyIcon: 'fluent-color:send-24' },
      { label: 'Invoices', href: '/sales-invoices.html', view: 'invoices', imageIcon: '/images/sidebar/sales-crm/invoices.png', iconifyIcon: 'fluent-color:receipt-24' },
      { label: 'Payments', href: '/sales-payments.html', view: 'payments', imageIcon: '/images/sidebar/sales-crm/payments.png', iconifyIcon: 'fluent-color:gift-card-24' },
      { label: 'Sales Returns', href: '/sales-returns.html', view: 'returns', imageIcon: '/images/sidebar/sales-crm/returns.png', iconifyIcon: 'fluent-color:arrow-clockwise-dashes-24' },
      { label: 'POS', href: '/sales-pos.html', view: 'pos', imageIcon: '/images/sidebar/sales-crm/pos.png', iconifyIcon: 'fluent-color:apps-list-24' },
      { label: 'Complaints', href: '/crm-complaints.html', view: 'complaints', imageIcon: '/images/sidebar/sales-crm/complaints.png', iconifyIcon: 'fluent-color:megaphone-loud-24' }
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    href: '/inventory-products.html',
    imageIcon: '/images/sidebar/inventory.png',
    iconifyIcon: 'flat-color-icons:package',
    color: 'text-blue-600',
    items: [
      { label: 'Products', href: '/inventory-products.html', view: 'products', imageIcon: '/images/sidebar/inventory/products.png', iconifyIcon: 'flat-color-icons:filing-cabinet' },
      { label: 'Raw Materials', href: '/inventory-raw-materials.html', view: 'raw-materials', imageIcon: '/images/sidebar/inventory/products.png', iconifyIcon: 'flat-color-icons:tree-structure' },
      { label: 'Stock In', href: '/inventory-stock-in.html', view: 'stock-in', imageIcon: '/images/sidebar/inventory/stock-in.png', iconifyIcon: 'flat-color-icons:download' },
      { label: 'Stock Out', href: '/inventory-stock-out.html', view: 'stock-out', imageIcon: '/images/sidebar/inventory/stock-out.png', iconifyIcon: 'flat-color-icons:upload' },
      { label: 'Stock Transfers', href: '/inventory-transfers.html', view: 'transfers', imageIcon: '/images/sidebar/inventory/transfers.png', iconifyIcon: 'flat-color-icons:synchronize' },
      { label: 'Stock Correction', href: '/inventory-adjustments.html', view: 'adjustments', imageIcon: '/images/sidebar/inventory/adjustments.png', iconifyIcon: 'flat-color-icons:data-configuration' },
      { label: 'Warehouse', href: '/inventory-warehouses.html', view: 'warehouses', imageIcon: '/images/sidebar/inventory/warehouses.png', iconifyIcon: 'fluent-color:building-24' },
      { label: 'Categories', href: '/inventory-categories.html', view: 'categories', imageIcon: '/images/sidebar/inventory/categories.png', iconifyIcon: 'fluent-color:bookmark-24' },
      { label: 'Units', href: '/inventory-units.html', view: 'units', imageIcon: '/images/sidebar/inventory/units.png', iconifyIcon: 'flat-color-icons:ruler' }
    ]
  },

  {
    id: 'purchases',
    label: 'Purchases',
    href: '/purchases-suppliers.html',
    imageIcon: '/images/sidebar/purchases.png',
    iconifyIcon: 'flat-color-icons:shop',
    color: 'text-amber-600',
    items: [
      { label: 'Suppliers', href: '/purchases-suppliers.html', view: 'suppliers', imageIcon: '/images/sidebar/purchases/suppliers.png', iconifyIcon: 'fluent-color:building-store-24' },
      { label: 'Purchase Orders', href: '/purchases-orders.html', view: 'orders', imageIcon: '/images/sidebar/purchases/orders.png', iconifyIcon: 'fluent-color:document-add-24' },
      { label: 'Goods Received', href: '/purchases-goods-received.html', view: 'goods-received', imageIcon: '/images/sidebar/purchases/goods-received.png', iconifyIcon: 'fluent-color:arrow-square-down-24' },
      { label: 'Vendor Bills', href: '/purchases-bills.html', view: 'bills', imageIcon: '/images/sidebar/purchases/bills.png', iconifyIcon: 'fluent-color:notebook-24' },
      { label: 'Payments', href: '/purchases-payments.html', view: 'payments', imageIcon: '/images/sidebar/purchases/payments.png', iconifyIcon: 'flat-color-icons:paid' },
      { label: 'Purchase Returns', href: '/purchases-returns.html', view: 'returns', imageIcon: '/images/sidebar/purchases/returns.png', iconifyIcon: 'flat-color-icons:undo' },
      { label: 'Recipes (BOM)', href: '/purchases-recipes.html', view: 'recipes', imageIcon: '/images/sidebar/inventory/products.png', iconifyIcon: 'fluent-color:puzzle-piece-24' }
    ]
  },
  {
    id: 'factory',
    label: 'Factory',
    href: '/manufacturing-orders.html',
    imageIcon: '/images/sidebar/factory.png',
    iconifyIcon: 'flat-color-icons:factory',
    color: 'text-rose-600',
    items: [
      { label: 'Production', href: '/manufacturing-orders.html', view: 'orders', imageIcon: '/images/sidebar/factory/orders.png', iconifyIcon: 'flat-color-icons:serial-tasks' },
      { label: 'Raw Materials BOM', href: '/manufacturing-bom.html', view: 'bom', imageIcon: '/images/sidebar/factory/bom.png', iconifyIcon: 'flat-color-icons:tree-structure' },
      { label: 'Machine Maintenance', href: '/manufacturing-machine-maintenance.html', view: 'machine-maintenance', imageIcon: '/images/sidebar/factory/machine-maintenance.png', iconifyIcon: 'fluent-color:wrench-24' },
      { label: 'Mold Management', href: '/manufacturing-mold-management.html', view: 'mold-management', imageIcon: '/images/sidebar/factory/mold-management.png', iconifyIcon: 'fluent-color:puzzle-piece-24' },
      { label: 'Wastage', href: '/manufacturing-wastage.html', view: 'wastage', imageIcon: '/images/sidebar/factory/wastage.png', iconifyIcon: 'flat-color-icons:full-trash' },
      { label: 'Packing', href: '/manufacturing-packing.html', view: 'packing', imageIcon: '/images/sidebar/factory/packing.png', iconifyIcon: 'fluent-color:gift-24' }
    ]
  },
  {
    id: 'accounts',
    label: 'Accounts',
    href: '/accounting-receivables.html',
    imageIcon: '/images/sidebar/accounts.png',
    iconifyIcon: 'flat-color-icons:money-transfer',
    color: 'text-indigo-600',
    items: [
      { label: 'Due Management', href: '/accounting-dues.html', view: 'dues', imageIcon: '/images/sidebar/accounts/dues.png', iconifyIcon: 'fluent-color:alert-badge-24' },
      { label: 'Customer Due (Cash)', href: '/accounting-receivables.html', view: 'receivables', imageIcon: '/images/sidebar/accounts/receivables.png', iconifyIcon: 'flat-color-icons:positive-dynamic' },
      { label: 'Supplier Due (Bank)', href: '/accounting-payables.html', view: 'payables', imageIcon: '/images/sidebar/accounts/payables.png', iconifyIcon: 'flat-color-icons:negative-dynamic' },
      { label: 'Journal Entries', href: '/accounting-journals.html', view: 'journals', imageIcon: '/images/sidebar/accounts/journals.png', iconifyIcon: 'fluent-color:book-open-24' },
      { label: 'General Ledger', href: '/accounting-ledger.html', view: 'ledger', imageIcon: '/images/sidebar/accounts/ledger.png', iconifyIcon: 'fluent-color:book-24' },
      { label: 'Trial Balance', href: '/accounting-trial.html', view: 'trial', imageIcon: '/images/sidebar/accounts/trial.png', iconifyIcon: 'flat-color-icons:calculator' },
      { label: 'Profit & Loss', href: '/accounting-pl.html', view: 'pl', imageIcon: '/images/sidebar/accounts/pl.png', iconifyIcon: 'fluent-color:data-trending-24' },
      { label: 'Balance Sheet', href: '/accounting-balance.html', view: 'balance', imageIcon: '/images/sidebar/accounts/balance.png', iconifyIcon: 'fluent-color:building-government-24' }
    ]
  },
  {
    id: 'hrm',
    label: 'HR',
    href: '/hrm-employees.html',
    imageIcon: '/images/sidebar/hr.png',
    iconifyIcon: 'fluent-color:contact-card-24',
    color: 'text-teal-600',
    items: [
      { label: 'Employees', href: '/hrm-employees.html', view: 'employees', imageIcon: '/images/sidebar/hr/employees.png', iconifyIcon: 'fluent-color:person-24' },
      { label: 'Departments', href: '/hrm-departments.html', view: 'departments', imageIcon: '/images/sidebar/hr/departments.png', iconifyIcon: 'fluent-color:org-24' },
      { label: 'Designations', href: '/hrm-designations.html', view: 'designations', imageIcon: '/images/sidebar/hr/designations.png', iconifyIcon: 'fluent-color:ribbon-24' },
      { label: 'Attendance', href: '/hrm-attendance.html', view: 'attendance', imageIcon: '/images/sidebar/hr/attendance.png', iconifyIcon: 'fluent-color:clock-24' },
      { label: 'Leave Management', href: '/hrm-leave.html', view: 'leave', imageIcon: '/images/sidebar/hr/leave.png', iconifyIcon: 'fluent-color:calendar-cancel-24' }
    ]
  },
  {
    id: 'payroll',
    label: 'Payroll',
    href: '/payroll-structures.html',
    imageIcon: '/images/sidebar/payroll.png',
    iconifyIcon: 'fluent-color:coin-multiple-24',
    color: 'text-cyan-600',
    items: [
      { label: 'Salary Structures', href: '/payroll-structures.html', view: 'structures', imageIcon: '/images/sidebar/payroll/structures.png', iconifyIcon: 'fluent-color:table-24' },
      { label: 'Payroll Runs', href: '/payroll-runs.html', view: 'runs', imageIcon: '/images/sidebar/payroll/runs.png', iconifyIcon: 'flat-color-icons:start' },
      { label: 'Payslips', href: '/payroll-slips.html', view: 'slips', imageIcon: '/images/sidebar/payroll/slips.png', iconifyIcon: 'flat-color-icons:print' }
    ]
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects.html',
    iconifyIcon: 'fluent-color:document-folder-24',
    color: 'text-orange-500',
    items: []
  },
  {
    id: 'assets',
    label: 'Assets',
    href: '/asset-management.html',
    imageIcon: '/images/sidebar/assets.png',
    iconifyIcon: 'fluent-color:toolbox-24',
    color: 'text-fuchsia-600',
    items: []
  },
  {
    id: 'approvals',
    label: 'Approvals',
    href: '/workflow-approvals.html',
    iconifyIcon: 'fluent-color:approvals-app-24',
    color: 'text-rose-500',
    items: []
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/reports-sales.html',
    imageIcon: '/images/sidebar/reports.png',
    iconifyIcon: 'fluent-color:chart-multiple-24',
    color: 'text-slate-600',
    items: [
      { label: 'Sales Reports', href: '/reports-sales.html', view: 'sales', iconifyIcon: 'fluent-color:data-bar-vertical-ascending-24' },
      { label: 'Purchase Reports', href: '/reports-purchases.html', view: 'purchases', iconifyIcon: 'fluent-color:data-pie-24' },
      { label: 'Inventory Reports', href: '/reports-inventory.html', view: 'inventory', iconifyIcon: 'flat-color-icons:bar-chart' },
      { label: 'Customer Reports', href: '/reports-customers.html', view: 'customers', iconifyIcon: 'fluent-color:scan-person-24' },
      { label: 'Supplier Reports', href: '/reports-suppliers.html', view: 'suppliers', iconifyIcon: 'fluent-color:briefcase-24' },
      { label: 'Financial Reports', href: '/reports-financial.html', view: 'financial', iconifyIcon: 'flat-color-icons:combo-chart' },
      { label: 'HR Reports', href: '/reports-hr.html', view: 'hr', iconifyIcon: 'fluent-color:people-community-24' }
    ]
  },
  {
    id: 'settings',
    label: 'Administration',
    href: '/settings-users.html',
    imageIcon: '/images/sidebar/administration.png',
    iconifyIcon: 'fluent-color:shield-24',
    color: 'text-slate-500',
    items: [
      { label: 'Users', href: '/settings-users.html', view: 'users', iconifyIcon: 'fluent-color:people-team-24' },
      { label: 'Roles', href: '/settings-roles.html', view: 'roles', iconifyIcon: 'fluent-color:person-key-24' },
      { label: 'Permissions', href: '/settings-permissions.html', view: 'permissions', iconifyIcon: 'fluent-color:checkmark-circle-24' },
      { label: 'Documents', href: '/settings-documents.html', view: 'documents', iconifyIcon: 'fluent-color:document-lock-24' },
      { label: 'Company Settings', href: '/settings-company.html', view: 'company', iconifyIcon: 'fluent-color:building-home-24' },
      { label: 'Audit Logs', href: '/settings-audit-logs.html', view: 'audit-logs', iconifyIcon: 'fluent-color:history-24' }
    ]
  }
];

function getActiveSidebarModule() {
  const path = window.location.pathname.split('/').pop() || 'dashboard.html';
  const prefixes = ['crm', 'sales', 'inventory', 'purchases', 'accounting', 'hrm', 'payroll', 'reports', 'settings', 'manufacturing', 'asset', 'workflow'];
  for (const p of prefixes) {
    if (path.startsWith(p + '-')) {
      if (p === 'crm' || p === 'sales') return 'sales-crm';
      if (p === 'accounting') return 'accounts';
      if (p === 'manufacturing') return 'factory';
      if (p === 'asset') return 'assets';
      if (p === 'workflow') return 'approvals';
      return p;
    }
  }
  return path.replace('.html', '') || 'dashboard';
}

function getActiveSidebarView() {
  const path = window.location.pathname.split('/').pop() || '';
  const prefixes = ['crm', 'sales', 'inventory', 'purchases', 'accounting', 'hrm', 'payroll', 'manufacturing', 'reports', 'settings', 'asset', 'workflow'];
  for (const p of prefixes) {
    if (path.startsWith(p + '-')) {
      return path.replace(p + '-', '').replace('.html', '');
    }
  }
  return new URLSearchParams(window.location.search).get('view');
}

function setSidebarSubmenuState(moduleId, isOpen) {
  const submenu = document.getElementById(`submenu-${moduleId}`);
  const chevron = document.getElementById(`chevron-${moduleId}`);

  if (!submenu) return;

  submenu.classList.toggle('hidden', !isOpen);

  if (chevron) {
    chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  }
}

window.toggleSidebarSubmenu = function(event, id) {
  event.stopPropagation();
  event.preventDefault();

  if (window.appState?.sidebarCollapsed && typeof window.toggleSidebar === 'function') {
    window.toggleSidebar();
  }

  const target = document.getElementById(id);
  if (!target) return;

  const moduleId = id.replace('submenu-', '');
  const shouldOpen = target.classList.contains('hidden');

  document.querySelectorAll('[data-sidebar-submenu]').forEach((submenu) => {
    const currentModuleId = submenu.id.replace('submenu-', '');
    setSidebarSubmenuState(currentModuleId, currentModuleId === moduleId ? shouldOpen : false);
  });
};

function renderTenantSidebarSection(section, activeModule, activeView) {
  const hasSubmenu = section.items.length > 0;
  const isActiveModule = activeModule === section.id;
  const submenuId = `submenu-${section.id}`;
  
  const baseColor = section.color ? section.color.replace('text-', '').replace('-600', '').replace('-500', '') : 'blue';
  
  const colorMap = {
    'emerald': { bg: 'bg-emerald-50/80', ring: 'ring-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200/60' },
    'blue': { bg: 'bg-blue-50/80', ring: 'ring-blue-100', text: 'text-blue-700', border: 'border-blue-200/60' },
    'amber': { bg: 'bg-amber-50/80', ring: 'ring-amber-100', text: 'text-amber-700', border: 'border-amber-200/60' },
    'rose': { bg: 'bg-rose-50/80', ring: 'ring-rose-100', text: 'text-rose-700', border: 'border-rose-200/60' },
    'indigo': { bg: 'bg-indigo-50/80', ring: 'ring-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200/60' },
    'teal': { bg: 'bg-teal-50/80', ring: 'ring-teal-100', text: 'text-teal-700', border: 'border-teal-200/60' },
    'cyan': { bg: 'bg-cyan-50/80', ring: 'ring-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200/60' },
    'fuchsia': { bg: 'bg-fuchsia-50/80', ring: 'ring-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200/60' },
    'slate': { bg: 'bg-slate-100/80', ring: 'ring-slate-200', text: 'text-slate-800', border: 'border-slate-300/60' }
  };
  
  const c = colorMap[baseColor] || colorMap['blue'];

  const rowClasses = isActiveModule
    ? `${c.bg} ring-1 ${c.ring} shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]`
    : 'hover:bg-slate-100/60';
  const linkClasses = isActiveModule
    ? c.text
    : 'text-slate-500 hover:text-slate-900';

  const subIconClass = 'sidebar-icon-sm';
  const primaryIconClass = (section.id === 'dashboard' || section.id === 'projects' || section.id === 'approvals')
    ? 'sidebar-icon-primary-sm'
    : 'sidebar-icon-primary';
  const submenuMarkup = hasSubmenu ? `
    <div id="${submenuId}" data-sidebar-submenu class="sidebar-submenu sidebar-label ${isActiveModule ? '' : 'hidden'} ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-5">
      ${section.items.map((item) => {
        const isActiveItem = isActiveModule && activeView === item.view;
        const itemClasses = isActiveItem
          ? `${c.bg} ${c.text} border ${c.border} shadow-sm`
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent';
        return `
          <a href="${item.href}" class="group/item rounded-xl px-3 py-1.5 text-[13px] font-semibold tracking-[0.01em] transition-all ${itemClasses}">
            ${renderSidebarIcon(item, subIconClass)}
            <span data-i18n="sidebar.${item.view}">${window.t ? window.t('sidebar.'+item.view) : item.label}</span>
          </a>
        `;
      }).join('')}
    </div>
  ` : '';

  return `
    <div class="sidebar-group flex flex-col">
      <div class="sidebar-main-row flex items-center justify-between rounded-2xl transition-all ${rowClasses}">
        <a href="${section.href}" id="side-${section.id}" class="side-btn sidebar-primary-link flex min-w-0 flex-1 items-center px-3 py-1 text-sm font-semibold tracking-[0.01em] transition-all ${linkClasses}">
          <span class="flex items-center justify-center shrink-0">
            ${renderSidebarIcon(section, primaryIconClass)}
          </span>
          <span class="sidebar-label truncate" data-i18n="sidebar.${section.id}">${window.t ? window.t('sidebar.' + section.id) : section.label}</span>
        </a>
        ${hasSubmenu ? `
          <button type="button" onclick="window.toggleSidebarSubmenu(event, '${submenuId}')" class="sidebar-trigger sidebar-label mr-1 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 focus:outline-none" aria-label="Toggle ${section.label} submenu">
            <i data-lucide="chevron-down" id="chevron-${section.id}" class="w-4 h-4 transition-transform ${isActiveModule ? 'rotate-180' : ''}"></i>
          </button>
        ` : ''}
      </div>
      ${submenuMarkup}
    </div>
  `;
}

function renderTenantSidebar() {
  const activeModule = getActiveSidebarModule();
  const activeView = getActiveSidebarView();

  return `
    <div id="sidebar-backdrop" class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-20 hidden md:hidden transition-opacity" data-sidebar-toggle></div>
    <aside id="sidebar" class="sidebar-transition w-72 bg-white text-slate-600 hidden md:flex flex-col shrink-0 sticky top-0 z-30 h-[100dvh] border-r border-slate-200/80">
      <div class="h-16 px-5 border-b border-slate-100 flex items-center justify-between overflow-hidden">
        <div class="flex items-center gap-3 min-w-0">
          <div class="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-500/20 shrink-0">
            H
          </div>
          <div class="sidebar-label min-w-0">
            <span class="block truncate text-lg font-bold tracking-tight text-slate-900">Toys Factory ERP</span>
            <span class="block truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Enterprise Workspace</span>
          </div>
        </div>
        <button type="button" data-sidebar-toggle class="md:hidden p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0">
        ${TENANT_SIDEBAR_SECTIONS.map((section) => renderTenantSidebarSection(section, activeModule, activeView)).join('')}
      </nav>

    </aside>
  `;
}

class AppSidebar extends HTMLElement {
  connectedCallback() {
    ensureIconifyLoaded();
    const mode = this.getAttribute('mode') || 'tenant';
    this.render(mode);
    createIcons({ icons: ICONS_MAP });

    if (mode !== 'super-admin') {
      const activeModule = getActiveSidebarModule();
      const activeSection = TENANT_SIDEBAR_SECTIONS.find((section) => section.id === activeModule);

      TENANT_SIDEBAR_SECTIONS
        .filter((section) => section.items.length > 0)
        .forEach((section) => {
          setSidebarSubmenuState(section.id, section.id === activeModule && activeSection?.items.length > 0);
        });
    }
  }

  render(mode) {
    if (mode === 'super-admin') {
      this.innerHTML = `
        <aside id="sidebar" class="sidebar-transition w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 sticky top-0 z-30 h-[100dvh]">
          <div class="h-16 px-6 border-b border-slate-800 flex items-center justify-between overflow-hidden">
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shrink-0">
                H
              </div>
              <span class="text-sm font-bold tracking-tight text-white sidebar-label">Toys Factory ERP Cloud</span>
            </div>
          </div>
          <nav class="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
            <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white transition-all">
              <i data-lucide="layout-dashboard" class="w-4 h-4 shrink-0"></i>
              <span class="sidebar-label">Dashboard</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
              <i data-lucide="building" class="w-4 h-4 shrink-0"></i>
              <span class="sidebar-label">Companies</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
              <i data-lucide="layers" class="w-4 h-4 shrink-0"></i>
              <span class="sidebar-label">Plans</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
              <i data-lucide="credit-card" class="w-4 h-4 shrink-0"></i>
              <span class="sidebar-label">Subscriptions</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
              <i data-lucide="package" class="w-4 h-4 shrink-0"></i>
              <span class="sidebar-label">Modules</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
              <i data-lucide="users" class="w-4 h-4 shrink-0"></i>
              <span class="sidebar-label">Users</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
              <i data-lucide="wallet" class="w-4 h-4 shrink-0"></i>
              <span class="sidebar-label">Billing</span>
            </a>
            <a href="#" class="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all group">
              <span class="flex items-center gap-3">
                <i data-lucide="life-buoy" class="w-4 h-4 shrink-0"></i>
                <span class="sidebar-label">Support</span>
              </span>
              <span class="bg-indigo-500/20 text-indigo-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md sidebar-label">12</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
              <i data-lucide="settings" class="w-4 h-4 shrink-0"></i>
              <span class="sidebar-label">Settings</span>
            </a>
          </nav>
        </aside>
      `;
    } else {
      this.innerHTML = renderTenantSidebar();
    }
  }
}

class AppHeader extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title') || 'Dashboard';
    const mode = this.getAttribute('mode') || 'tenant';
    this.render(mode, title);
    createIcons({ icons: ICONS_MAP });
  }

  render(mode, title) {
    if (mode === 'super-admin') {
      this.innerHTML = `
        <header class="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2 md:gap-4">
              <button onclick="window.toggleMobileSidebar()" class="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden">
                <i data-lucide="menu" class="w-5 h-5"></i>
              </button>
            <h2 class="text-sm font-bold text-slate-900 tracking-tight">${title}</h2>
          </div>
        </header>
      `;
    } else {
      this.innerHTML = `
        <header class="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <button type="button" data-sidebar-toggle class="hidden md:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900" aria-label="Toggle sidebar">
              <i data-lucide="menu" class="w-4 h-4"></i>
            </button>
            <div class="min-w-0">
              <h2 class="text-sm font-bold text-slate-900 tracking-tight truncate">${title}</h2>
              <p class="text-[11px] font-medium text-slate-500 truncate max-md:hidden">Shared navigation and workspace tools</p>
            </div>
          </div>
          
          <div class="flex-1 max-w-xl px-4 md:px-8">
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
              </div>
              <input type="text" 
                class="w-full bg-slate-100/50 border border-transparent text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                placeholder="Global search...">
              <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <span class="text-[10px] font-medium text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">Ctrl K</span>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <button onclick="window.location.href='/notifications.html'" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all relative cursor-pointer">
              <i data-lucide="bell" class="w-4 h-4"></i>
              <span id="header-notification-dot" class="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full border border-white"></span>
            </button>
            <button class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
              <i data-lucide="message-square" class="w-4 h-4"></i>
            </button>
            
            <div class="h-8 w-px bg-slate-200"></div>
            
            <button onclick="window.toggleLanguage()" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold tracking-wider transition-colors cursor-pointer">
              <span class="${(window.appState && window.appState.lang === 'en') ? 'text-slate-900' : 'text-slate-400'}">EN</span> | <span class="${(window.appState && window.appState.lang === 'bn') ? 'text-slate-900' : 'text-slate-400'}">বাংলা</span>
            </button>

            <div class="h-8 w-px bg-slate-200"></div>

            <div class="flex items-center gap-2 cursor-pointer group relative">
              <button onclick="document.getElementById('profile-dropdown-menu').classList.toggle('opacity-0'); document.getElementById('profile-dropdown-menu').classList.toggle('invisible'); event.stopPropagation();" class="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                <div class="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  JD
                </div>
                <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400"></i>
              </button>
              
              <div id="profile-dropdown-menu" class="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white border border-slate-200 shadow-lg opacity-0 invisible transition-all z-50">
                <div class="p-3 border-b border-slate-100">
                  <p class="text-sm font-semibold text-slate-800">John Doe</p>
                  <p class="text-xs text-slate-500">Administrator</p>
                </div>
                <div class="p-1">
                  <a href="/settings-profile.html" class="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                    <i data-lucide="user" class="w-4 h-4"></i> Profile
                  </a>
                  <a href="/settings-company.html" class="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                    <i data-lucide="settings" class="w-4 h-4"></i> Settings
                  </a>
                </div>
                <div class="p-1 border-t border-slate-100">
                  <button id="logout-action" class="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left cursor-pointer">
                    <i data-lucide="log-out" class="w-4 h-4"></i> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      `;
    }
  }
}

class AppFooter extends HTMLElement {
  connectedCallback() {
    this.render();
    this.injectBottomNav();
  }

  render() {
    this.innerHTML = `
      <footer class="mt-auto py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-slate-50/30 pb-28 md:pb-6">
        © 2026 Toys Factory ERP Cloud. All rights reserved. • Powered by Enterprise SaaS Engine.
      </footer>
    `;
  }

  injectBottomNav() {
    // Only inject if it doesn't already exist
    if (document.getElementById('mobile-bottom-nav')) return;

    const nav = document.createElement('div');
    nav.id = 'mobile-bottom-nav';
    nav.className = 'fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:hidden z-[100]';
    nav.style.paddingBottom = 'env(safe-area-inset-bottom)';
    
    nav.innerHTML = `
      <div class="flex items-center justify-around h-16 px-2">
        <a href="/dashboard.html" class="flex flex-col items-center justify-center w-16 gap-1 text-slate-400 hover:text-blue-600 transition-colors">
          <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
          <span class="text-[9px] font-semibold tracking-wider uppercase">Home</span>
        </a>
        <a href="/crm-customers.html" class="flex flex-col items-center justify-center w-16 gap-1 text-slate-400 hover:text-blue-600 transition-colors">
          <i data-lucide="users" class="w-5 h-5"></i>
          <span class="text-[9px] font-semibold tracking-wider uppercase">Customers</span>
        </a>
        <div class="relative -top-5">
          <button onclick="document.getElementById('mobile-quick-actions-sheet').classList.remove('hidden')" class="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all border-[6px] border-slate-50">
            <i data-lucide="plus" class="w-6 h-6"></i>
          </button>
        </div>
        <a href="/sales-quotations.html" class="flex flex-col items-center justify-center w-16 gap-1 text-slate-400 hover:text-blue-600 transition-colors">
          <i data-lucide="receipt" class="w-5 h-5"></i>
          <span class="text-[9px] font-semibold tracking-wider uppercase">Sales</span>
        </a>
        <button type="button" onclick="document.getElementById('mobile-menu-grid-sheet').classList.remove('hidden')" class="flex flex-col items-center justify-center w-16 gap-1 text-slate-400 hover:text-blue-600 transition-colors">
          <i data-lucide="layout-grid" class="w-5 h-5"></i>
          <span class="text-[9px] font-semibold tracking-wider uppercase">Menu</span>
        </button>
      </div>
    `;
    
    document.body.appendChild(nav);
    
    // Inject Quick Actions Sheet
    if (!document.getElementById('mobile-quick-actions-sheet')) {
      const sheet = document.createElement('div');
      sheet.id = 'mobile-quick-actions-sheet';
      sheet.className = 'fixed inset-0 z-[110] hidden';
      sheet.innerHTML = `
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="this.parentElement.classList.add('hidden')"></div>
        <div class="absolute bottom-0 left-0 w-full bg-white rounded-t-2xl shadow-2xl transition-transform transform translate-y-0 pb-8" style="padding-bottom: calc(2rem + env(safe-area-inset-bottom));">
          <div class="flex justify-center pt-3 pb-2">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full"></div>
          </div>
          <div class="px-6 py-4">
            <h3 class="text-sm font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div class="flex flex-col gap-3">
              <a href="/sales-invoices.html" class="flex items-center gap-4 p-3 bg-white border border-slate-100 shadow-sm rounded-2xl active:scale-[0.98] transition-all">
                <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <i data-lucide="plus" class="w-5 h-5"></i>
                </div>
                <div class="flex flex-col flex-1">
                  <span class="text-sm font-bold text-slate-900">New Sale</span>
                  <span class="text-[11px] font-medium text-slate-500">Record a new sales invoice</span>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 mr-2 shrink-0"></i>
              </a>

              <a href="/sales-payments.html" class="flex items-center gap-4 p-3 bg-white border border-slate-100 shadow-sm rounded-2xl active:scale-[0.98] transition-all">
                <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <i data-lucide="arrow-down-to-line" class="w-5 h-5"></i>
                </div>
                <div class="flex flex-col flex-1">
                  <span class="text-sm font-bold text-slate-900">Receive Payment</span>
                  <span class="text-[11px] font-medium text-slate-500">Log incoming customer payment</span>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 mr-2 shrink-0"></i>
              </a>

              <a href="/crm-customers.html" class="flex items-center gap-4 p-3 bg-white border border-slate-100 shadow-sm rounded-2xl active:scale-[0.98] transition-all">
                <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <i data-lucide="user-plus" class="w-5 h-5"></i>
                </div>
                <div class="flex flex-col flex-1">
                  <span class="text-sm font-bold text-slate-900">Add Customer</span>
                  <span class="text-[11px] font-medium text-slate-500">Register a new client or lead</span>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 mr-2 shrink-0"></i>
              </a>

              <a href="/purchases-orders.html" class="flex items-center gap-4 p-3 bg-white border border-slate-100 shadow-sm rounded-2xl active:scale-[0.98] transition-all">
                <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                </div>
                <div class="flex flex-col flex-1">
                  <span class="text-sm font-bold text-slate-900">Purchase Order</span>
                  <span class="text-[11px] font-medium text-slate-500">Create order from a supplier</span>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 mr-2 shrink-0"></i>
              </a>

              <a href="/inventory-stock-in.html" class="flex items-center gap-4 p-3 bg-white border border-slate-100 shadow-sm rounded-2xl active:scale-[0.98] transition-all">
                <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <i data-lucide="package-plus" class="w-5 h-5"></i>
                </div>
                <div class="flex flex-col flex-1">
                  <span class="text-sm font-bold text-slate-900">Stock In</span>
                  <span class="text-[11px] font-medium text-slate-500">Record incoming inventory</span>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 mr-2 shrink-0"></i>
              </a>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(sheet);
    }

    // Inject Mobile Menu Grid Drawer
    if (!document.getElementById('mobile-menu-grid-sheet')) {
      const menuSheet = document.createElement('div');
      menuSheet.id = 'mobile-menu-grid-sheet';
      menuSheet.className = 'fixed inset-0 z-[120] hidden';
      
      const sectionsHtml = TENANT_SIDEBAR_SECTIONS.map(section => {
        if (section.id === 'dashboard') return '';
        
        const baseColor = section.color ? section.color.replace('text-', '').replace('-600', '').replace('-500', '') : 'blue';
        const colorMap = {
          'emerald': { bg: 'bg-emerald-50 text-emerald-600' },
          'blue': { bg: 'bg-blue-50 text-blue-600' },
          'amber': { bg: 'bg-amber-50 text-amber-600' },
          'rose': { bg: 'bg-rose-50 text-rose-600' },
          'indigo': { bg: 'bg-indigo-50 text-indigo-600' },
          'teal': { bg: 'bg-teal-50 text-teal-600' },
          'cyan': { bg: 'bg-cyan-50 text-cyan-600' },
          'fuchsia': { bg: 'bg-fuchsia-50 text-fuchsia-600' },
          'slate': { bg: 'bg-slate-100 text-slate-700' }
        };
        const c = colorMap[baseColor] || colorMap['blue'];

        const hasSubmenu = section.items && section.items.length > 0;
        const action = hasSubmenu ? `onclick="window.openMobileSubmenu('${section.id}')"` : `href="${section.href}"`;

        return `
          <${hasSubmenu ? 'button' : 'a'} ${action} class="flex flex-col items-center justify-center p-4 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all gap-3 active:scale-95">
            <div class="flex items-center justify-center">
              ${renderSidebarIcon(section, 'sidebar-icon-lg')}
            </div>
            <span class="text-[11px] font-bold text-slate-700 text-center leading-tight truncate w-full px-1" data-i18n="sidebar.${section.id}">${window.t ? window.t('sidebar.' + section.id) : section.label}</span>
          </${hasSubmenu ? 'button' : 'a'}>
        `;
      }).join('');

      menuSheet.innerHTML = `
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="this.parentElement.classList.add('hidden')"></div>
        <div class="absolute bottom-0 left-0 w-full bg-slate-50/95 backdrop-blur-xl rounded-t-3xl shadow-2xl transition-transform transform translate-y-0 h-[85vh] flex flex-col overflow-hidden">
          
          <!-- MAIN VIEW -->
          <div id="mobile-menu-main-view" class="flex flex-col w-full h-full transition-transform duration-300">
            <div class="flex items-center justify-between px-6 pt-6 pb-4 bg-white/50 border-b border-slate-200/50 rounded-t-3xl shrink-0">
              <h3 class="text-lg font-extrabold text-slate-900">Modules</h3>
              <button class="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-600 active:scale-95" onclick="document.getElementById('mobile-menu-grid-sheet').classList.add('hidden')">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
              <div class="grid grid-cols-3 gap-4">
                ${sectionsHtml}
              </div>
              <div class="mt-8 mb-20 text-center">
                <a href="/settings-users.html" class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-xs font-bold shadow-sm active:scale-95">
                  <i data-lucide="settings" class="w-4 h-4"></i> System Settings
                </a>
              </div>
            </div>
          </div>

          <!-- SUBMENU VIEW -->
          <div id="mobile-menu-sub-view" class="hidden flex-col w-full h-full absolute top-0 left-0 bg-slate-50/95 backdrop-blur-xl rounded-t-3xl">
            <div class="flex items-center justify-between px-6 pt-6 pb-4 bg-white/50 border-b border-slate-200/50 rounded-t-3xl shrink-0">
              <div class="flex items-center gap-3">
                <button class="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-600 active:scale-95" onclick="window.closeMobileSubmenu()">
                  <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </button>
                <h3 id="mobile-menu-sub-title" class="text-lg font-extrabold text-slate-900">Submenu</h3>
              </div>
              <button class="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-600 active:scale-95" onclick="document.getElementById('mobile-menu-grid-sheet').classList.add('hidden')">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
              <div id="mobile-menu-sub-grid" class="grid grid-cols-3 gap-4">
                <!-- Injected via JS -->
              </div>
              <div class="mt-8 mb-20 h-4"></div>
            </div>
          </div>

        </div>
      `;
      document.body.appendChild(menuSheet);

      window.openMobileSubmenu = function(moduleId) {
        const section = TENANT_SIDEBAR_SECTIONS.find(s => s.id === moduleId);
        if (!section) return;

        const baseColor = section.color ? section.color.replace('text-', '').replace('-600', '').replace('-500', '') : 'blue';
        const colorMap = {
          'emerald': { bg: 'bg-emerald-50 text-emerald-600' },
          'blue': { bg: 'bg-blue-50 text-blue-600' },
          'amber': { bg: 'bg-amber-50 text-amber-600' },
          'rose': { bg: 'bg-rose-50 text-rose-600' },
          'indigo': { bg: 'bg-indigo-50 text-indigo-600' },
          'teal': { bg: 'bg-teal-50 text-teal-600' },
          'cyan': { bg: 'bg-cyan-50 text-cyan-600' },
          'fuchsia': { bg: 'bg-fuchsia-50 text-fuchsia-600' },
          'slate': { bg: 'bg-slate-100 text-slate-700' }
        };
        const c = colorMap[baseColor] || colorMap['blue'];

        const subTitle = document.getElementById('mobile-menu-sub-title');
        if (subTitle) {
          subTitle.setAttribute('data-i18n', `sidebar.${section.id}`);
          subTitle.innerText = window.t ? window.t(`sidebar.${section.id}`) : section.label;
        }

        const html = section.items.map(item => `
          <a href="${item.href}" class="flex flex-col items-center justify-center p-4 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all gap-3 active:scale-95">
            <div class="w-16 h-16 rounded-2xl ${c.bg} flex items-center justify-center">
              ${renderSidebarIcon(item, 'sidebar-icon-lg')}
            </div>
            <span class="text-[11px] font-bold text-slate-700 text-center leading-tight truncate w-full px-1" data-i18n="sidebar.${item.view}">${window.t ? window.t('sidebar.' + item.view) : item.label}</span>
          </a>
        `).join('');

        document.getElementById('mobile-menu-sub-grid').innerHTML = html;
        if (typeof createIcons === 'function' && typeof ICONS_MAP !== 'undefined') {
          createIcons({ icons: ICONS_MAP });
        }
        if (typeof window.translatePage === 'function') window.translatePage();

        document.getElementById('mobile-menu-main-view').classList.add('hidden');
        document.getElementById('mobile-menu-sub-view').classList.remove('hidden');
        document.getElementById('mobile-menu-sub-view').classList.add('flex');
      };

      window.closeMobileSubmenu = function() {
        document.getElementById('mobile-menu-sub-view').classList.add('hidden');
        document.getElementById('mobile-menu-sub-view').classList.remove('flex');
        document.getElementById('mobile-menu-main-view').classList.remove('hidden');
      };
    }

    // Ensure icons in the injected nav are created
    if (typeof createIcons === 'function' && typeof ICONS_MAP !== 'undefined') {
      createIcons({ icons: ICONS_MAP });
    }
  }
}

class AppFormHeader extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title') || 'Form';
    const subtitle = this.getAttribute('subtitle') || '';
    const backAction = this.getAttribute('back-action') || '';
    const titleId = this.getAttribute('title-id') || '';
    const titleIdAttr = titleId ? `id="${titleId}"` : '';
    
    this.innerHTML = `
      <div class="flex items-center gap-4 mb-6">
        <button type="button" onclick="${backAction}" class="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500 bg-white border border-slate-200 premium-shadow">
          <i data-lucide="arrow-left" class="w-5 h-5"></i>
        </button>
        <div>
          <h3 ${titleIdAttr} class="text-xl font-bold text-slate-900">${title}</h3>
          <p class="text-xs text-slate-500 mt-1">${subtitle}</p>
        </div>
      </div>
    `;
    
    if (window.initIcons) {
      window.initIcons();
    }
  }
}

document.addEventListener('click', (e) => {
  const profileMenu = document.getElementById('profile-dropdown-menu');
  
  if (profileMenu && !e.target.closest('#profile-dropdown-menu') && !e.target.closest('button[onclick*="profile-dropdown-menu"]')) {
    profileMenu.classList.add('opacity-0', 'invisible');
  }
});

customElements.define('app-form-header', AppFormHeader);
customElements.define('app-sidebar', AppSidebar);
customElements.define('app-header', AppHeader);
customElements.define('app-footer', AppFooter);




window.translatePage = function() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (window.t && key) {
      const translated = window.t(key);
      if (translated === key) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translated;
      } else if (el.tagName === 'OPTION') {
        el.textContent = translated;
      } else {
        el.textContent = translated;
      }
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (typeof window.applyLanguage === 'function') window.applyLanguage();
    else if (window.translatePage) window.translatePage();
  }, 100);
});
