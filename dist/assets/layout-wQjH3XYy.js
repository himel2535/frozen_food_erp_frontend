import{$ as e,A as t,C as n,E as r,J as i,M as a,O as o,S as s,T as c,V as l,Y as u,_ as d,a as f,b as p,h as m,i as h,j as g,k as _,lt as v,m as y,n as b,nt as x,o as S,p as C,r as w,st as T,t as E}from"./lucide-CU5-AOMs.js";var D={LayoutDashboard:t,Users:h,User:f,UserPlus:S,Receipt:d,CreditCard:l,Settings:y,ChevronRight:i,LogOut:o,ArrowDownToLine:v,Building:e,Layers:a,Package:s,PackagePlus:n,Wallet:w,LifeBuoy:_,Menu:r,Search:m,Plus:p,Bell:x,MessageSquare:c,ChevronDown:u,ArrowLeft:T,X:b,LayoutGrid:g,ShoppingBag:C};function O(){if(typeof document>`u`||document.querySelector(`script[data-iconify-cdn]`))return;let e=document.createElement(`script`);e.type=`module`,e.src=`https://code.iconify.design/iconify-icon/3.0.1/iconify-icon.min.js`,e.setAttribute(`data-iconify-cdn`,`1`),document.head.appendChild(e)}function k(e,t=``){let n=String(t).includes(`sidebar-icon-lg`)?36:String(t).includes(`sidebar-icon-primary-sm`)?32:String(t).includes(`sidebar-icon-primary`)?40:String(t).includes(`sidebar-icon-sm`)?24:32,r=typeof e==`object`&&e?.imageIcon?e.imageIcon:null;return r?`<img src="${r}" alt="" width="${n}" height="${n}" class="sidebar-icon ${t} object-contain">`:`<iconify-icon class="sidebar-icon ${t}" icon="${typeof e==`string`?e:e?.iconifyIcon}" width="${n}" height="${n}"></iconify-icon>`}O();var A=[{id:`dashboard`,label:`Dashboard`,href:`/dashboard.html`,iconifyIcon:`fluent-color:apps-24`,color:`text-slate-600`,items:[]},{id:`sales-crm`,label:`Sales & CRM`,href:`/crm-leads.html`,imageIcon:`/images/sidebar/sales-crm.png`,iconifyIcon:`fluent-color:people-interwoven-24`,color:`text-emerald-600`,items:[{label:`Customers`,href:`/crm-customers.html`,view:`customers`,imageIcon:`/images/sidebar/sales-crm/customers.png`,iconifyIcon:`fluent-color:people-24`},{label:`Leads`,href:`/crm-leads.html`,view:`leads`,imageIcon:`/images/sidebar/sales-crm/leads.png`,iconifyIcon:`fluent-color:person-add-24`},{label:`Deals & Pipeline`,href:`/crm-deals.html`,view:`deals`,imageIcon:`/images/sidebar/sales-crm/deals.png`,iconifyIcon:`fluent-color:arrow-trending-lines-24`},{label:`Quotations`,href:`/sales-quotations.html`,view:`quotations`,imageIcon:`/images/sidebar/sales-crm/quotations.png`,iconifyIcon:`fluent-color:document-text-24`},{label:`Sales Orders`,href:`/sales-orders.html`,view:`orders`,imageIcon:`/images/sidebar/sales-crm/orders.png`,iconifyIcon:`fluent-color:clipboard-task-24`},{label:`Delivery Challan`,href:`/sales-deliveries.html`,view:`deliveries`,imageIcon:`/images/sidebar/sales-crm/deliveries.png`,iconifyIcon:`flat-color-icons:shipped`},{label:`Dispatch`,href:`/sales-dispatch.html`,view:`dispatch`,imageIcon:`/images/sidebar/sales-crm/dispatch.png`,iconifyIcon:`fluent-color:send-24`},{label:`Invoices`,href:`/sales-invoices.html`,view:`invoices`,imageIcon:`/images/sidebar/sales-crm/invoices.png`,iconifyIcon:`fluent-color:receipt-24`},{label:`Payments`,href:`/sales-payments.html`,view:`payments`,imageIcon:`/images/sidebar/sales-crm/payments.png`,iconifyIcon:`fluent-color:gift-card-24`},{label:`Sales Returns`,href:`/sales-returns.html`,view:`returns`,imageIcon:`/images/sidebar/sales-crm/returns.png`,iconifyIcon:`fluent-color:arrow-clockwise-dashes-24`},{label:`POS`,href:`/sales-pos.html`,view:`pos`,imageIcon:`/images/sidebar/sales-crm/pos.png`,iconifyIcon:`fluent-color:apps-list-24`},{label:`Complaints`,href:`/crm-complaints.html`,view:`complaints`,imageIcon:`/images/sidebar/sales-crm/complaints.png`,iconifyIcon:`fluent-color:megaphone-loud-24`}]},{id:`inventory`,label:`Inventory`,href:`/inventory-products.html`,imageIcon:`/images/sidebar/inventory.png`,iconifyIcon:`flat-color-icons:package`,color:`text-blue-600`,items:[{label:`Products`,href:`/inventory-products.html`,view:`products`,imageIcon:`/images/sidebar/inventory/products.png`,iconifyIcon:`flat-color-icons:filing-cabinet`},{label:`Stock In`,href:`/inventory-stock-in.html`,view:`stock-in`,imageIcon:`/images/sidebar/inventory/stock-in.png`,iconifyIcon:`flat-color-icons:download`},{label:`Stock Out`,href:`/inventory-stock-out.html`,view:`stock-out`,imageIcon:`/images/sidebar/inventory/stock-out.png`,iconifyIcon:`flat-color-icons:upload`},{label:`Stock Transfers`,href:`/inventory-transfers.html`,view:`transfers`,imageIcon:`/images/sidebar/inventory/transfers.png`,iconifyIcon:`flat-color-icons:synchronize`},{label:`Stock Correction`,href:`/inventory-adjustments.html`,view:`adjustments`,imageIcon:`/images/sidebar/inventory/adjustments.png`,iconifyIcon:`flat-color-icons:data-configuration`},{label:`Warehouse`,href:`/inventory-warehouses.html`,view:`warehouses`,imageIcon:`/images/sidebar/inventory/warehouses.png`,iconifyIcon:`fluent-color:building-24`},{label:`Categories`,href:`/inventory-categories.html`,view:`categories`,imageIcon:`/images/sidebar/inventory/categories.png`,iconifyIcon:`fluent-color:bookmark-24`},{label:`Units`,href:`/inventory-units.html`,view:`units`,imageIcon:`/images/sidebar/inventory/units.png`,iconifyIcon:`flat-color-icons:ruler`}]},{id:`purchases`,label:`Purchases`,href:`/purchases-suppliers.html`,imageIcon:`/images/sidebar/purchases.png`,iconifyIcon:`flat-color-icons:shop`,color:`text-amber-600`,items:[{label:`Suppliers`,href:`/purchases-suppliers.html`,view:`suppliers`,imageIcon:`/images/sidebar/purchases/suppliers.png`,iconifyIcon:`fluent-color:building-store-24`},{label:`Purchase Orders`,href:`/purchases-orders.html`,view:`orders`,imageIcon:`/images/sidebar/purchases/orders.png`,iconifyIcon:`fluent-color:document-add-24`},{label:`Goods Received`,href:`/purchases-goods-received.html`,view:`goods-received`,imageIcon:`/images/sidebar/purchases/goods-received.png`,iconifyIcon:`fluent-color:arrow-square-down-24`},{label:`Vendor Bills`,href:`/purchases-bills.html`,view:`bills`,imageIcon:`/images/sidebar/purchases/bills.png`,iconifyIcon:`fluent-color:notebook-24`},{label:`Payments`,href:`/purchases-payments.html`,view:`payments`,imageIcon:`/images/sidebar/purchases/payments.png`,iconifyIcon:`flat-color-icons:paid`},{label:`Purchase Returns`,href:`/purchases-returns.html`,view:`returns`,imageIcon:`/images/sidebar/purchases/returns.png`,iconifyIcon:`flat-color-icons:undo`}]},{id:`factory`,label:`Factory`,href:`/manufacturing-orders.html`,imageIcon:`/images/sidebar/factory.png`,iconifyIcon:`flat-color-icons:factory`,color:`text-rose-600`,items:[{label:`Production`,href:`/manufacturing-orders.html`,view:`orders`,imageIcon:`/images/sidebar/factory/orders.png`,iconifyIcon:`flat-color-icons:serial-tasks`},{label:`Raw Materials BOM`,href:`/manufacturing-bom.html`,view:`bom`,imageIcon:`/images/sidebar/factory/bom.png`,iconifyIcon:`flat-color-icons:tree-structure`},{label:`Machine Maintenance`,href:`/manufacturing-machine-maintenance.html`,view:`machine-maintenance`,imageIcon:`/images/sidebar/factory/machine-maintenance.png`,iconifyIcon:`fluent-color:wrench-24`},{label:`Mold Management`,href:`/manufacturing-mold-management.html`,view:`mold-management`,imageIcon:`/images/sidebar/factory/mold-management.png`,iconifyIcon:`fluent-color:puzzle-piece-24`},{label:`Wastage`,href:`/manufacturing-wastage.html`,view:`wastage`,imageIcon:`/images/sidebar/factory/wastage.png`,iconifyIcon:`flat-color-icons:full-trash`},{label:`Packing`,href:`/manufacturing-packing.html`,view:`packing`,imageIcon:`/images/sidebar/factory/packing.png`,iconifyIcon:`fluent-color:gift-24`}]},{id:`accounts`,label:`Accounts`,href:`/accounting-receivables.html`,imageIcon:`/images/sidebar/accounts.png`,iconifyIcon:`flat-color-icons:money-transfer`,color:`text-indigo-600`,items:[{label:`Due Management`,href:`/accounting-dues.html`,view:`dues`,imageIcon:`/images/sidebar/accounts/dues.png`,iconifyIcon:`fluent-color:alert-badge-24`},{label:`Customer Due (Cash)`,href:`/accounting-receivables.html`,view:`receivables`,imageIcon:`/images/sidebar/accounts/receivables.png`,iconifyIcon:`flat-color-icons:positive-dynamic`},{label:`Supplier Due (Bank)`,href:`/accounting-payables.html`,view:`payables`,imageIcon:`/images/sidebar/accounts/payables.png`,iconifyIcon:`flat-color-icons:negative-dynamic`},{label:`Journal Entries`,href:`/accounting-journals.html`,view:`journals`,imageIcon:`/images/sidebar/accounts/journals.png`,iconifyIcon:`fluent-color:book-open-24`},{label:`General Ledger`,href:`/accounting-ledger.html`,view:`ledger`,imageIcon:`/images/sidebar/accounts/ledger.png`,iconifyIcon:`fluent-color:book-24`},{label:`Trial Balance`,href:`/accounting-trial.html`,view:`trial`,imageIcon:`/images/sidebar/accounts/trial.png`,iconifyIcon:`flat-color-icons:calculator`},{label:`Profit & Loss`,href:`/accounting-pl.html`,view:`pl`,imageIcon:`/images/sidebar/accounts/pl.png`,iconifyIcon:`fluent-color:data-trending-24`},{label:`Balance Sheet`,href:`/accounting-balance.html`,view:`balance`,imageIcon:`/images/sidebar/accounts/balance.png`,iconifyIcon:`fluent-color:building-government-24`}]},{id:`hrm`,label:`HR`,href:`/hrm-employees.html`,imageIcon:`/images/sidebar/hr.png`,iconifyIcon:`fluent-color:contact-card-24`,color:`text-teal-600`,items:[{label:`Employees`,href:`/hrm-employees.html`,view:`employees`,imageIcon:`/images/sidebar/hr/employees.png`,iconifyIcon:`fluent-color:person-24`},{label:`Departments`,href:`/hrm-departments.html`,view:`departments`,imageIcon:`/images/sidebar/hr/departments.png`,iconifyIcon:`fluent-color:org-24`},{label:`Designations`,href:`/hrm-designations.html`,view:`designations`,imageIcon:`/images/sidebar/hr/designations.png`,iconifyIcon:`fluent-color:ribbon-24`},{label:`Attendance`,href:`/hrm-attendance.html`,view:`attendance`,imageIcon:`/images/sidebar/hr/attendance.png`,iconifyIcon:`fluent-color:clock-24`},{label:`Leave Management`,href:`/hrm-leave.html`,view:`leave`,imageIcon:`/images/sidebar/hr/leave.png`,iconifyIcon:`fluent-color:calendar-cancel-24`}]},{id:`payroll`,label:`Payroll`,href:`/payroll-structures.html`,imageIcon:`/images/sidebar/payroll.png`,iconifyIcon:`fluent-color:coin-multiple-24`,color:`text-cyan-600`,items:[{label:`Salary Structures`,href:`/payroll-structures.html`,view:`structures`,imageIcon:`/images/sidebar/payroll/structures.png`,iconifyIcon:`fluent-color:table-24`},{label:`Payroll Runs`,href:`/payroll-runs.html`,view:`runs`,imageIcon:`/images/sidebar/payroll/runs.png`,iconifyIcon:`flat-color-icons:start`},{label:`Payslips`,href:`/payroll-slips.html`,view:`slips`,imageIcon:`/images/sidebar/payroll/slips.png`,iconifyIcon:`flat-color-icons:print`}]},{id:`projects`,label:`Projects`,href:`/projects.html`,iconifyIcon:`fluent-color:document-folder-24`,color:`text-orange-500`,items:[]},{id:`assets`,label:`Assets`,href:`/asset-management.html`,imageIcon:`/images/sidebar/assets.png`,iconifyIcon:`fluent-color:toolbox-24`,color:`text-fuchsia-600`,items:[]},{id:`approvals`,label:`Approvals`,href:`/workflow-approvals.html`,iconifyIcon:`fluent-color:approvals-app-24`,color:`text-rose-500`,items:[]},{id:`reports`,label:`Reports`,href:`/reports-sales.html`,imageIcon:`/images/sidebar/reports.png`,iconifyIcon:`fluent-color:chart-multiple-24`,color:`text-slate-600`,items:[{label:`Sales Reports`,href:`/reports-sales.html`,view:`sales`,iconifyIcon:`fluent-color:data-bar-vertical-ascending-24`},{label:`Purchase Reports`,href:`/reports-purchases.html`,view:`purchases`,iconifyIcon:`fluent-color:data-pie-24`},{label:`Inventory Reports`,href:`/reports-inventory.html`,view:`inventory`,iconifyIcon:`flat-color-icons:bar-chart`},{label:`Customer Reports`,href:`/reports-customers.html`,view:`customers`,iconifyIcon:`fluent-color:scan-person-24`},{label:`Supplier Reports`,href:`/reports-suppliers.html`,view:`suppliers`,iconifyIcon:`fluent-color:briefcase-24`},{label:`Financial Reports`,href:`/reports-financial.html`,view:`financial`,iconifyIcon:`flat-color-icons:combo-chart`},{label:`HR Reports`,href:`/reports-hr.html`,view:`hr`,iconifyIcon:`fluent-color:people-community-24`}]},{id:`settings`,label:`Administration`,href:`/settings-users.html`,imageIcon:`/images/sidebar/administration.png`,iconifyIcon:`fluent-color:shield-24`,color:`text-slate-500`,items:[{label:`Users`,href:`/settings-users.html`,view:`users`,iconifyIcon:`fluent-color:people-team-24`},{label:`Roles`,href:`/settings-roles.html`,view:`roles`,iconifyIcon:`fluent-color:person-key-24`},{label:`Permissions`,href:`/settings-permissions.html`,view:`permissions`,iconifyIcon:`fluent-color:checkmark-circle-24`},{label:`Documents`,href:`/settings-documents.html`,view:`documents`,iconifyIcon:`fluent-color:document-lock-24`},{label:`Company Settings`,href:`/settings-company.html`,view:`company`,iconifyIcon:`fluent-color:building-home-24`},{label:`Audit Logs`,href:`/settings-audit-logs.html`,view:`audit-logs`,iconifyIcon:`fluent-color:history-24`}]}];function j(){let e=window.location.pathname.split(`/`).pop()||`dashboard.html`;for(let t of[`crm`,`sales`,`inventory`,`purchases`,`accounting`,`hrm`,`payroll`,`reports`,`settings`,`manufacturing`,`asset`,`workflow`])if(e.startsWith(t+`-`))return t===`crm`||t===`sales`?`sales-crm`:t===`accounting`?`accounts`:t===`manufacturing`?`factory`:t===`asset`?`assets`:t===`workflow`?`approvals`:t;return e.replace(`.html`,``)||`dashboard`}function M(){let e=window.location.pathname.split(`/`).pop()||``;for(let t of[`crm`,`sales`,`inventory`,`purchases`,`accounting`,`hrm`,`payroll`,`manufacturing`,`reports`,`settings`,`asset`,`workflow`])if(e.startsWith(t+`-`))return e.replace(t+`-`,``).replace(`.html`,``);return new URLSearchParams(window.location.search).get(`view`)}function N(e,t){let n=document.getElementById(`submenu-${e}`),r=document.getElementById(`chevron-${e}`);n&&(n.classList.toggle(`hidden`,!t),r&&(r.style.transform=t?`rotate(180deg)`:`rotate(0deg)`))}window.toggleSidebarSubmenu=function(e,t){e.stopPropagation(),e.preventDefault(),window.appState?.sidebarCollapsed&&typeof window.toggleSidebar==`function`&&window.toggleSidebar();let n=document.getElementById(t);if(!n)return;let r=t.replace(`submenu-`,``),i=n.classList.contains(`hidden`);document.querySelectorAll(`[data-sidebar-submenu]`).forEach(e=>{let t=e.id.replace(`submenu-`,``);N(t,t===r?i:!1)})};function P(e,t,n){let r=e.items.length>0,i=t===e.id,a=`submenu-${e.id}`,o=e.color?e.color.replace(`text-`,``).replace(`-600`,``).replace(`-500`,``):`blue`,s={emerald:{bg:`bg-emerald-50/80`,ring:`ring-emerald-100`,text:`text-emerald-700`,border:`border-emerald-200/60`},blue:{bg:`bg-blue-50/80`,ring:`ring-blue-100`,text:`text-blue-700`,border:`border-blue-200/60`},amber:{bg:`bg-amber-50/80`,ring:`ring-amber-100`,text:`text-amber-700`,border:`border-amber-200/60`},rose:{bg:`bg-rose-50/80`,ring:`ring-rose-100`,text:`text-rose-700`,border:`border-rose-200/60`},indigo:{bg:`bg-indigo-50/80`,ring:`ring-indigo-100`,text:`text-indigo-700`,border:`border-indigo-200/60`},teal:{bg:`bg-teal-50/80`,ring:`ring-teal-100`,text:`text-teal-700`,border:`border-teal-200/60`},cyan:{bg:`bg-cyan-50/80`,ring:`ring-cyan-100`,text:`text-cyan-700`,border:`border-cyan-200/60`},fuchsia:{bg:`bg-fuchsia-50/80`,ring:`ring-fuchsia-100`,text:`text-fuchsia-700`,border:`border-fuchsia-200/60`},slate:{bg:`bg-slate-100/80`,ring:`ring-slate-200`,text:`text-slate-800`,border:`border-slate-300/60`}},c=s[o]||s.blue,l=i?`${c.bg} ring-1 ${c.ring} shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]`:`hover:bg-slate-100/60`,u=i?c.text:`text-slate-500 hover:text-slate-900`,d=e.id===`dashboard`||e.id===`projects`||e.id===`approvals`?`sidebar-icon-primary-sm`:`sidebar-icon-primary`,f=r?`
    <div id="${a}" data-sidebar-submenu class="sidebar-submenu sidebar-label ${i?``:`hidden`} ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-5">
      ${e.items.map(e=>{let t=i&&n===e.view?`${c.bg} ${c.text} border ${c.border} shadow-sm`:`text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent`;return`
          <a href="${e.href}" class="group/item rounded-xl px-3 py-1.5 text-[13px] font-semibold tracking-[0.01em] transition-all ${t}">
            ${k(e,`sidebar-icon-sm`)}
            <span data-i18n="sidebar.${e.view}">${window.t?window.t(`sidebar.`+e.view):e.label}</span>
          </a>
        `}).join(``)}
    </div>
  `:``;return`
    <div class="sidebar-group flex flex-col">
      <div class="sidebar-main-row flex items-center justify-between rounded-2xl transition-all ${l}">
        <a href="${e.href}" id="side-${e.id}" class="side-btn sidebar-primary-link flex min-w-0 flex-1 items-center px-3 py-1 text-sm font-semibold tracking-[0.01em] transition-all ${u}">
          <span class="flex items-center justify-center shrink-0">
            ${k(e,d)}
          </span>
          <span class="sidebar-label truncate" data-i18n="sidebar.${e.id}">${window.t?window.t(`sidebar.`+e.id):e.label}</span>
        </a>
        ${r?`
          <button type="button" onclick="window.toggleSidebarSubmenu(event, '${a}')" class="sidebar-trigger sidebar-label mr-1 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 focus:outline-none" aria-label="Toggle ${e.label} submenu">
            <i data-lucide="chevron-down" id="chevron-${e.id}" class="w-4 h-4 transition-transform ${i?`rotate-180`:``}"></i>
          </button>
        `:``}
      </div>
      ${f}
    </div>
  `}function F(){let e=j(),t=M();return`
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
        ${A.map(n=>P(n,e,t)).join(``)}
      </nav>

    </aside>
  `}var I=class extends HTMLElement{connectedCallback(){O();let e=this.getAttribute(`mode`)||`tenant`;if(this.render(e),E({icons:D}),e!==`super-admin`){let e=j(),t=A.find(t=>t.id===e);A.filter(e=>e.items.length>0).forEach(n=>{N(n.id,n.id===e&&t?.items.length>0)})}}render(e){e===`super-admin`?this.innerHTML=`
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
      `:this.innerHTML=F()}},L=class extends HTMLElement{connectedCallback(){let e=this.getAttribute(`title`)||`Dashboard`,t=this.getAttribute(`mode`)||`tenant`;this.render(t,e),E({icons:D})}render(e,t){e===`super-admin`?this.innerHTML=`
        <header class="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2 md:gap-4">
              <button onclick="window.toggleMobileSidebar()" class="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden">
                <i data-lucide="menu" class="w-5 h-5"></i>
              </button>
            <h2 class="text-sm font-bold text-slate-900 tracking-tight">${t}</h2>
          </div>
        </header>
      `:this.innerHTML=`
        <header class="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <button type="button" data-sidebar-toggle class="hidden md:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900" aria-label="Toggle sidebar">
              <i data-lucide="menu" class="w-4 h-4"></i>
            </button>
            <div class="min-w-0">
              <h2 class="text-sm font-bold text-slate-900 tracking-tight truncate">${t}</h2>
              <p class="text-[11px] font-medium text-slate-500 truncate max-md:hidden">Shared navigation and workspace tools</p>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="relative w-64 max-md:hidden">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
              <input type="text" data-i18n="header.search" placeholder="${window.t?window.t(`header.search`):`Global search...`}" class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all">
            </div>
            
            <button onclick="window.location.href='/notifications.html'" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all relative cursor-pointer">
              <i data-lucide="bell" class="w-4 h-4"></i>
              <span id="header-notification-dot" class="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full border border-white"></span>
            </button>
            <button class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
              <i data-lucide="message-square" class="w-4 h-4"></i>
            </button>
            
            <div class="h-8 w-px bg-slate-200"></div>
            
            <button onclick="window.toggleLanguage()" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold tracking-wider transition-colors cursor-pointer">
              <span class="${window.appState&&window.appState.lang===`en`?`text-slate-900`:`text-slate-400`}">EN</span> | <span class="${window.appState&&window.appState.lang===`bn`?`text-slate-900`:`text-slate-400`}">বাংলা</span>
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
      `}},R=class extends HTMLElement{connectedCallback(){this.render(),this.injectBottomNav()}render(){this.innerHTML=`
      <footer class="mt-auto py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-slate-50/30 pb-28 md:pb-6">
        © 2026 Toys Factory ERP Cloud. All rights reserved. • Powered by Enterprise SaaS Engine.
      </footer>
    `}injectBottomNav(){if(document.getElementById(`mobile-bottom-nav`))return;let e=document.createElement(`div`);if(e.id=`mobile-bottom-nav`,e.className=`fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:hidden z-[100]`,e.style.paddingBottom=`env(safe-area-inset-bottom)`,e.innerHTML=`
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
    `,document.body.appendChild(e),!document.getElementById(`mobile-quick-actions-sheet`)){let e=document.createElement(`div`);e.id=`mobile-quick-actions-sheet`,e.className=`fixed inset-0 z-[110] hidden`,e.innerHTML=`
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
      `,document.body.appendChild(e)}if(!document.getElementById(`mobile-menu-grid-sheet`)){let e=document.createElement(`div`);e.id=`mobile-menu-grid-sheet`,e.className=`fixed inset-0 z-[120] hidden`,e.innerHTML=`
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
                ${A.map(e=>{if(e.id===`dashboard`)return``;let t=e.color?e.color.replace(`text-`,``).replace(`-600`,``).replace(`-500`,``):`blue`,n={emerald:{bg:`bg-emerald-50 text-emerald-600`},blue:{bg:`bg-blue-50 text-blue-600`},amber:{bg:`bg-amber-50 text-amber-600`},rose:{bg:`bg-rose-50 text-rose-600`},indigo:{bg:`bg-indigo-50 text-indigo-600`},teal:{bg:`bg-teal-50 text-teal-600`},cyan:{bg:`bg-cyan-50 text-cyan-600`},fuchsia:{bg:`bg-fuchsia-50 text-fuchsia-600`},slate:{bg:`bg-slate-100 text-slate-700`}};n[t]||n.blue;let r=e.items&&e.items.length>0,i=r?`onclick="window.openMobileSubmenu('${e.id}')"`:`href="${e.href}"`;return`
          <${r?`button`:`a`} ${i} class="flex flex-col items-center justify-center p-4 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all gap-3 active:scale-95">
            <div class="flex items-center justify-center">
              ${k(e,`sidebar-icon-lg`)}
            </div>
            <span class="text-[11px] font-bold text-slate-700 text-center leading-tight truncate w-full px-1" data-i18n="sidebar.${e.id}">${window.t?window.t(`sidebar.`+e.id):e.label}</span>
          </${r?`button`:`a`}>
        `}).join(``)}
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
      `,document.body.appendChild(e),window.openMobileSubmenu=function(e){let t=A.find(t=>t.id===e);if(!t)return;let n=t.color?t.color.replace(`text-`,``).replace(`-600`,``).replace(`-500`,``):`blue`,r={emerald:{bg:`bg-emerald-50 text-emerald-600`},blue:{bg:`bg-blue-50 text-blue-600`},amber:{bg:`bg-amber-50 text-amber-600`},rose:{bg:`bg-rose-50 text-rose-600`},indigo:{bg:`bg-indigo-50 text-indigo-600`},teal:{bg:`bg-teal-50 text-teal-600`},cyan:{bg:`bg-cyan-50 text-cyan-600`},fuchsia:{bg:`bg-fuchsia-50 text-fuchsia-600`},slate:{bg:`bg-slate-100 text-slate-700`}},i=r[n]||r.blue,a=document.getElementById(`mobile-menu-sub-title`);a&&(a.setAttribute(`data-i18n`,`sidebar.${t.id}`),a.innerText=window.t?window.t(`sidebar.${t.id}`):t.label);let o=t.items.map(e=>`
          <a href="${e.href}" class="flex flex-col items-center justify-center p-4 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all gap-3 active:scale-95">
            <div class="w-16 h-16 rounded-2xl ${i.bg} flex items-center justify-center">
              ${k(e,`sidebar-icon-lg`)}
            </div>
            <span class="text-[11px] font-bold text-slate-700 text-center leading-tight truncate w-full px-1" data-i18n="sidebar.${e.view}">${window.t?window.t(`sidebar.`+e.view):e.label}</span>
          </a>
        `).join(``);document.getElementById(`mobile-menu-sub-grid`).innerHTML=o,typeof E==`function`&&D!==void 0&&E({icons:D}),typeof window.translatePage==`function`&&window.translatePage(),document.getElementById(`mobile-menu-main-view`).classList.add(`hidden`),document.getElementById(`mobile-menu-sub-view`).classList.remove(`hidden`),document.getElementById(`mobile-menu-sub-view`).classList.add(`flex`)},window.closeMobileSubmenu=function(){document.getElementById(`mobile-menu-sub-view`).classList.add(`hidden`),document.getElementById(`mobile-menu-sub-view`).classList.remove(`flex`),document.getElementById(`mobile-menu-main-view`).classList.remove(`hidden`)}}typeof E==`function`&&D!==void 0&&E({icons:D})}},z=class extends HTMLElement{connectedCallback(){let e=this.getAttribute(`title`)||`Form`,t=this.getAttribute(`subtitle`)||``,n=this.getAttribute(`back-action`)||``,r=this.getAttribute(`title-id`)||``,i=r?`id="${r}"`:``;this.innerHTML=`
      <div class="flex items-center gap-4 mb-6">
        <button type="button" onclick="${n}" class="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500 bg-white border border-slate-200 premium-shadow">
          <i data-lucide="arrow-left" class="w-5 h-5"></i>
        </button>
        <div>
          <h3 ${i} class="text-xl font-bold text-slate-900">${e}</h3>
          <p class="text-xs text-slate-500 mt-1">${t}</p>
        </div>
      </div>
    `,window.initIcons&&window.initIcons()}};document.addEventListener(`click`,e=>{let t=document.getElementById(`profile-dropdown-menu`);t&&!e.target.closest(`#profile-dropdown-menu`)&&!e.target.closest(`button[onclick*="profile-dropdown-menu"]`)&&t.classList.add(`opacity-0`,`invisible`)}),customElements.define(`app-form-header`,z),customElements.define(`app-sidebar`,I),customElements.define(`app-header`,L),customElements.define(`app-footer`,R),window.translatePage=function(){document.querySelectorAll(`[data-i18n]`).forEach(e=>{let t=e.getAttribute(`data-i18n`);if(window.t&&t){let n=window.t(t);if(n===t)return;e.tagName===`INPUT`||e.tagName===`TEXTAREA`?e.placeholder=n:(e.tagName,e.textContent=n)}})},document.addEventListener(`DOMContentLoaded`,()=>{setTimeout(()=>{typeof window.applyLanguage==`function`?window.applyLanguage():window.translatePage&&window.translatePage()},100)});