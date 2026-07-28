import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{$ as e,D as t,E as n,F as r,K as i,N as a,O as o,P as s,_ as c,g as l,j as u,n as d,o as f,s as p,t as m}from"./shared-Det_SasC.js";var h=10,g=null,_={searchQuery:``,sortKey:`name-asc`,status:`all`,tier:`all`,ownerId:`all`,territory:``,quickFilter:`all`,currentPage:1},v=[`bg-blue-100 text-blue-700`,`bg-emerald-100 text-emerald-700`,`bg-violet-100 text-violet-700`,`bg-amber-100 text-amber-700`,`bg-rose-100 text-rose-700`,`bg-indigo-100 text-indigo-700`];function y(e){return`৳${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function b(e){if(!e)return`—`;let t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`})}function x(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function S(e,t,n=`w-5 h-5`){return`<img src="/images/icons/actions/${e}" alt="${x(t)}" class="${n} object-contain pointer-events-none" />`}function C(e,t,n=`w-5 h-5`){return`<img src="/images/icons/metrics/${e}" alt="${x(t)}" class="${n} object-contain pointer-events-none shrink-0" />`}function w(e){let t=String(e||``).trim().split(/\s+/).filter(Boolean);return t.length===0?`?`:t.length===1?t[0].slice(0,2).toUpperCase():(t[0][0]+t[t.length-1][0]).toUpperCase()}function T(e){return v[String(e||``).split(``).reduce((e,t)=>e+t.charCodeAt(0),0)%v.length]}function E(e,t=`w-9 h-9`,n=`text-[10px]`){return`<div class="${t} rounded-full ${T(e)} ${n} font-bold flex items-center justify-center shrink-0">${x(w(e))}</div>`}function D(e){return e===`active`?`bg-emerald-50 text-emerald-600`:e===`overdue`?`bg-rose-50 text-rose-600`:e===`credit-hold`?`bg-amber-50 text-amber-700`:`bg-slate-100 text-slate-500`}function O(e){let t=String(e||`Standard`).toLowerCase();return t.includes(`enterprise`)||t.includes(`vip`)?`bg-violet-50 text-violet-700 border-violet-100`:t.includes(`wholesale`)?`bg-indigo-50 text-indigo-700 border-indigo-100`:`bg-slate-50 text-slate-600 border-slate-200`}function k(e){let t=e||`Standard`;return`<span class="inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${O(t)}">${x(t)}</span>`}function A(e){let t=String(e||``).toLowerCase();return t===`paid`?`bg-emerald-50 text-emerald-600`:t===`overdue`?`bg-rose-50 text-rose-600`:t===`partial`?`bg-amber-50 text-amber-700`:`bg-slate-100 text-slate-500`}function j(){p(),V(),L()}function M(e){let t=u(d,e.id),n=t.find(e=>e.primary)||t[0]||null;return{...e,contactName:n?.name||e.contactName||``}}function N(){return _.searchQuery||_.status!==`all`||_.tier!==`all`||_.ownerId!==`all`||_.territory||_.quickFilter!==`all`}function P(){let e=a(d).map(M),t=_.searchQuery;return e=e.filter(e=>{let n=!t||(e.name||``).toLowerCase().includes(t)||(e.company||``).toLowerCase().includes(t)||(e.phone||``).toLowerCase().includes(t)||(e.email||``).toLowerCase().includes(t)||(e.contactName||``).toLowerCase().includes(t),r=_.status===`all`||e.status===_.status,i=_.tier===`all`||e.pricingTier===_.tier,a=_.ownerId===`all`||e.ownerId===_.ownerId,o=_.territory,s=!o||(e.territory||``).toLowerCase().includes(o),c=!0;if(_.quickFilter===`active`)c=e.status===`active`;else if(_.quickFilter===`overdue`)c=e.status===`overdue`||e.status===`credit-hold`;else if(_.quickFilter===`has-due`)c=Number(e.totalDue||0)>0;else if(_.quickFilter===`enterprise`){let t=String(e.pricingTier||``).toLowerCase();c=t.includes(`enterprise`)||t.includes(`vip`)}return n&&r&&i&&a&&s&&c}),e.sort((e,t)=>_.sortKey===`name-desc`?String(t.name||``).localeCompare(String(e.name||``)):_.sortKey===`balance-desc`?Number(t.totalDue||0)-Number(e.totalDue||0):_.sortKey===`spending-desc`?Number(t.totalSales||0)-Number(e.totalSales||0):String(e.name||``).localeCompare(String(t.name||``))),e}function F(){document.querySelectorAll(`.crm-quick-chip`).forEach(e=>{e.className=e.getAttribute(`data-quick`)===_.quickFilter?`crm-quick-chip px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-500 bg-blue-50 text-blue-700 cursor-pointer`:`crm-quick-chip px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer`})}function I(){let e=document.getElementById(`crm-active-filters`);if(!e)return;let t=[];if(_.quickFilter!==`all`&&t.push({key:`quick`,label:`Quick: ${_.quickFilter}`}),_.searchQuery&&t.push({key:`search`,label:`Search: ${_.searchQuery}`}),_.status!==`all`&&t.push({key:`status`,label:`Status: ${_.status}`}),_.tier!==`all`&&t.push({key:`tier`,label:`Tier: ${_.tier}`}),_.ownerId!==`all`){let e=i(d).find(e=>e.id===_.ownerId);t.push({key:`owner`,label:`Owner: ${e?.name||_.ownerId}`})}if(_.territory&&t.push({key:`territory`,label:`Territory: ${_.territory}`}),!t.length){e.classList.add(`hidden`),e.innerHTML=``;return}e.classList.remove(`hidden`),e.innerHTML=`
    <span class="text-[10px] font-bold text-slate-400 uppercase">Active filters:</span>
    ${t.map(e=>`
      <button type="button" onclick="window.removeCustomerFilterChip('${e.key}')" class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 cursor-pointer hover:bg-blue-100">
        ${x(e.label)} <span class="text-blue-400">×</span>
      </button>
    `).join(``)}
    <button type="button" onclick="window.clearCustomerFilters()" class="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer underline">Reset all</button>
  `}function L(){let e=a(d),t=document.getElementById(`crm-metric-customers`);t&&(t.textContent=e.length);let n=new Set(e.map(e=>e.ownerId).filter(Boolean)).size,r=document.getElementById(`crm-metric-reps`);r&&(r.textContent=n);let i=e.reduce((e,t)=>e+(t.totalSales||0),0),o=e.length?i/e.length:0,s=document.getElementById(`crm-metric-avg-spend`);s&&(s.textContent=y(o));let c=e.reduce((e,t)=>e+((t.status===`overdue`||t.status===`credit-hold`)&&t.totalDue||0),0),l=document.getElementById(`crm-metric-risk`);l&&(l.textContent=y(c));let u=e.filter(e=>e.status===`overdue`||e.status===`credit-hold`).length,f=document.getElementById(`crm-metric-risk-sub`);f&&(f.textContent=`${u} customers on alert`);let p=document.getElementById(`crm-metric-customers-sub`);p&&(p.textContent=`${e.filter(e=>e.status===`active`).length} active accounts`)}function R(e,t=!1){let n=document.getElementById(e);if(!n)return;let r=i(d);n.innerHTML=t?`<option value="all">All owners</option>`:``,r.forEach(e=>{n.innerHTML+=`<option value="${e.id}">${x(e.name)}</option>`})}function z(e,t,n){let r=document.getElementById(`crm-table-info`);r&&(r.textContent=e===0?`Showing 0 to 0 of 0 records`:`Showing ${t} to ${n} of ${e} records`);let i=document.getElementById(`crm-page-number`);i&&(i.textContent=`Page ${_.currentPage}`);let a=document.getElementById(`crm-page-prev`),o=document.getElementById(`crm-page-next`);if(a&&(a.disabled=_.currentPage<=1),o){let t=Math.max(1,Math.ceil(e/h));o.disabled=_.currentPage>=t}}function B(e){let t=Number(e.creditLimit||0),n=Number(e.totalDue||0);if(!t)return``;let r=Math.min(100,Math.round(n/t*100));return`
    <div class="mt-1.5 w-24 ml-auto">
      <div class="h-1 rounded-full bg-slate-100 overflow-hidden">
        <div class="${r>=90?`bg-rose-500`:r>=60?`bg-amber-500`:`bg-emerald-500`} h-full rounded-full" style="width:${r}%"></div>
      </div>
      <div class="text-[8px] text-slate-400 font-semibold mt-0.5">Credit ${r}%</div>
    </div>
  `}function V(){let e=document.getElementById(`crm-customers-body`);if(!e)return;F(),I(),a(d);let t=P(),n=t.length,r=Math.max(1,Math.ceil(n/h)||1);_.currentPage>r&&(_.currentPage=r);let i=n===0?0:(_.currentPage-1)*h,o=Math.min(i+h,n),s=t.slice(i,o);if(e.innerHTML=``,n===0){let t=N();e.innerHTML=`
      <tr>
        <td colspan="8" class="p-12 text-center">
          <div class="flex flex-col items-center justify-center">
            <div class="w-16 h-16 rounded-2xl ${t?`bg-amber-50 text-amber-600`:`bg-blue-50 text-blue-600`} flex items-center justify-center mb-4">
              <i data-lucide="${t?`search`:`users`}" class="w-8 h-8"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-900">${t?`No Results Match Your Filters`:`No Customers Yet`}</h3>
            <p class="text-xs text-slate-500 font-medium mt-1 mb-4">${t?`Try adjusting your search or filter criteria.`:`Add your first customer to start tracking sales and dues.`}</p>
            ${t?`<button onclick="window.clearCustomerFilters()" class="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer">Clear Filters</button>`:`<button onclick="window.openCustomerModal()" class="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">Add Customer</button>`}
          </div>
        </td>
      </tr>
    `,z(0,0,0),f();return}s.forEach(t=>{let n=Number(t.totalDue||0)>0,r=t.status===`overdue`||t.status===`credit-hold`?`border-l-2 border-rose-400`:``;e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors ${r}">
        <td class="p-4 text-center"><input type="checkbox" class="crm-row-select cursor-pointer" data-id="${x(t.id)}" onclick="window.updateBulkSelection()"></td>
        <td class="p-4">
          <div class="flex items-center gap-3">
            ${E(t.name)}
            <div class="min-w-0">
              <div class="font-bold text-slate-900 cursor-pointer hover:text-blue-600 truncate" onclick="window.openCRMDrawer('${x(t.id)}')">${x(t.name)}</div>
              <div class="text-[10px] text-slate-400 font-semibold truncate">${x(t.company)}</div>
              <div class="mt-1">${k(t.pricingTier)}</div>
            </div>
          </div>
        </td>
        <td class="p-4">${x(t.contactName||`—`)}</td>
        <td class="p-4">${x(t.phone||`—`)}<br><span class="text-[10px] text-slate-400 font-semibold">${x(t.email||`—`)}</span></td>
        <td class="p-4">
          <div class="flex items-center gap-2">
            ${t.ownerName?E(t.ownerName,`w-6 h-6`,`text-[8px]`):``}
            <span>${x(t.ownerName||`—`)}</span>
          </div>
        </td>
        <td class="p-4 text-right">
          <div class="font-bold text-slate-900 text-[10px]">Sales: ${y(t.totalSales)}</div>
          <div class="text-[11px] font-extrabold ${n?`text-rose-600`:`text-slate-400`} flex items-center justify-end gap-1">
            ${n?`<span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>`:``}
            Due: ${y(t.totalDue)}
          </div>
          ${B(t)}
        </td>
        <td class="p-4"><span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${D(t.status)}">${x(t.status)}</span></td>
        <td class="p-4 text-center">
          <div class="inline-flex items-center justify-center gap-1 rounded-xl border border-sky-100 bg-sky-50 p-1">
            <button type="button" onclick="window.openCRMDrawer('${x(t.id)}')" title="View" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${S(`view.png`,`View`,`w-5 h-5`)}
            </button>
            <button type="button" onclick="window.openCustomerModal('${x(t.id)}')" title="Edit" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${S(`edit.png`,`Edit`,`w-5 h-5`)}
            </button>
          </div>
        </td>
      </tr>
    `}),z(n,i+1,o),window.updateBulkSelection(),f()}function H(e){let t=document.getElementById(`crm-drawer-hero`);if(!t||!e)return;let n=e.customer,r=e.financialSummary?.totalSales??0,i=e.financialSummary?.totalDue??0,a=e.financialSummary?.creditLimit??n.creditLimit??0,o=e.financialSummary?.lastPurchaseDate;t.innerHTML=`
    <div class="flex flex-col md:flex-row md:items-center gap-4">
      ${E(n.name,`w-14 h-14`,`text-sm`)}
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h4 class="text-base font-extrabold text-slate-900">${x(n.name)}</h4>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${D(n.status)}">${x(n.status)}</span>
          ${k(n.pricingTier)}
        </div>
        <p class="text-xs text-slate-500 font-semibold mt-1">${x(n.company)} · ${x(n.ownerName||`No Rep`)}</p>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
      <div class="bg-white/80 p-3 rounded-xl border border-emerald-100 flex items-start gap-2">
        ${C(`spending.png`,`Total Sales`,`w-6 h-6`)}
        <div><div class="text-[9px] font-bold text-slate-400 uppercase">Total Sales</div><div class="text-sm font-extrabold text-emerald-600">${y(r)}</div></div>
      </div>
      <div class="bg-white/80 p-3 rounded-xl border border-rose-100 flex items-start gap-2">
        ${C(`risk.png`,`Outstanding`,`w-6 h-6`)}
        <div><div class="text-[9px] font-bold text-slate-400 uppercase">Outstanding</div><div class="text-sm font-extrabold text-rose-600">${y(i)}</div></div>
      </div>
      <div class="bg-white/80 p-3 rounded-xl border border-blue-100 flex items-start gap-2">
        ${C(`reps.png`,`Credit Limit`,`w-6 h-6`)}
        <div><div class="text-[9px] font-bold text-slate-400 uppercase">Credit Limit</div><div class="text-sm font-extrabold text-blue-600">${y(a)}</div></div>
      </div>
      <div class="bg-white/80 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
        ${C(`scheduled.png`,`Last Purchase`,`w-6 h-6`)}
        <div><div class="text-[9px] font-bold text-slate-400 uppercase">Last Purchase</div><div class="text-sm font-extrabold text-slate-700">${b(o)}</div></div>
      </div>
    </div>
  `}function U(e,t){let n=document.getElementById(`crm-profile-content`);if(!(!n||!t)){if(e===`overview`){let e=t.financialSummary?.totalSales??0,r=t.financialSummary?.totalDue??0;n.innerHTML=`
      <div class="space-y-4 text-xs font-semibold text-slate-700">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div class="flex items-center gap-2 mb-2">${C(`customers.png`,`Info`,`w-5 h-5`)}<div class="text-[10px] font-bold text-slate-400 uppercase">Customer Information</div></div>
            <div class="mt-2">Name: <span class="text-slate-900">${x(t.customer.name)}</span></div>
            <div>Company: <span class="text-slate-900">${x(t.customer.company)}</span></div>
            <div>Territory: <span class="text-slate-900">${x(t.customer.territory||`—`)}</span></div>
            <div>Email: <span class="text-slate-900">${x(t.contacts[0]?.email||`—`)}</span></div>
            <div>Phone: <span class="text-slate-900">${x(t.contacts[0]?.phone||`—`)}</span></div>
          </div>
          <div class="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <div class="flex items-center gap-2 mb-2">${C(`spending.png`,`Finance`,`w-5 h-5`)}<div class="text-[10px] font-bold text-slate-400 uppercase">Financial Metrics</div></div>
            <div class="mt-2">Total Spend: <span class="text-emerald-600 font-bold">${y(e)}</span></div>
            <div>Outstanding: <span class="text-rose-600 font-bold">${y(r)}</span></div>
            <div>Payment Terms: <span class="text-slate-900">${x(t.customer.paymentTerms||`Net 30`)}</span></div>
            <div>Category: <span class="text-slate-900">${x(t.customer.category||`—`)}</span></div>
          </div>
        </div>
      </div>
    `;return}if(e===`contacts`){n.innerHTML=`
      <div class="space-y-6 text-xs font-semibold text-slate-700">
        <div><div class="text-[10px] font-bold text-slate-400 uppercase mb-3">Contacts</div><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${t.contacts.length?t.contacts.map(e=>`
          <div class="bg-white p-4 rounded-xl border border-slate-200">
            <div class="font-bold text-slate-900">${x(e.name)}${e.primary?` <span class="text-[9px] text-blue-600">Primary</span>`:``}</div>
            <div class="text-[10px] text-slate-400 mt-1">${x(e.designation||`Contact`)}</div>
            <div class="mt-2">${x(e.phone||`—`)}</div>
            <div class="text-slate-500">${x(e.email||`—`)}</div>
          </div>
        `).join(``):`<div class="text-slate-400">No contacts on file.</div>`}</div></div>
        <div><div class="text-[10px] font-bold text-slate-400 uppercase mb-3">Addresses</div><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${t.addresses.length?t.addresses.map(e=>`
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div class="text-[10px] font-bold text-slate-400 uppercase">${x(e.type||`Address`)}</div>
            <div class="mt-1 text-slate-900">${x(e.line1||`—`)}</div>
            <div class="text-slate-500">${x([e.city,e.region,e.country].filter(Boolean).join(`, `)||`—`)}</div>
          </div>
        `).join(``):`<div class="text-slate-400">No addresses on file.</div>`}</div></div>
      </div>
    `;return}if(e===`sales`){let e=t.invoices||[];if(!e.length){n.innerHTML=`<div class="text-slate-400 text-xs font-semibold p-4 bg-slate-50 rounded-xl border border-slate-200">No sales invoices recorded for this customer yet.</div>`;return}n.innerHTML=`
      <div class="overflow-x-auto rounded-xl border border-slate-100">
        <table class="w-full text-left text-xs">
          <thead><tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
            <th class="p-3">Date</th><th class="p-3">Invoice</th><th class="p-3 text-right">Amount</th><th class="p-3">Status</th>
          </tr></thead>
          <tbody class="divide-y divide-slate-100">
            ${e.map(e=>`
              <tr class="hover:bg-slate-50">
                <td class="p-3">${b(e.date||e.issueDate)}</td>
                <td class="p-3 font-bold text-slate-900">${x(e.ref||e.id||`—`)}</td>
                <td class="p-3 text-right font-bold">${y(e.total||e.amount)}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${A(e.status)}">${x(e.status||`—`)}</span></td>
              </tr>
            `).join(``)}
          </tbody>
        </table>
      </div>
    `;return}if(e===`activity`){let e=new Date().toISOString().slice(0,10),r=(t.activities||[]).slice(0,20),i=(t.tasks||[]).filter(e=>e.status!==`done`),a=r.length?r.map(e=>`
          <div class="flex gap-3 pb-4 border-l-2 border-blue-200 pl-4 ml-2">
            <div class="flex-1">
              <div class="font-bold text-slate-900">${x(e.summary||e.activityType||`Activity`)}</div>
              <div class="text-[10px] text-slate-400 mt-0.5">${b(e.completedAt||e.createdAt)} · ${x(e.activityType||`note`)}</div>
              ${e.note?`<div class="text-slate-600 mt-1">${x(e.note)}</div>`:``}
            </div>
          </div>
        `).join(``):`<div class="text-slate-400 mb-4">No activity logged yet.</div>`;n.innerHTML=`
      <div class="space-y-6 text-xs font-semibold text-slate-700">
        <div><div class="text-[10px] font-bold text-slate-400 uppercase mb-3">Open Follow-ups</div><div class="space-y-2">${i.length?i.map(t=>{let n=`text-slate-500`;return t.dueDate&&t.dueDate<e?n=`text-rose-600 font-extrabold`:t.dueDate===e&&(n=`text-amber-600 font-extrabold`),`
            <div class="bg-amber-50/50 p-3 rounded-xl border border-amber-100 flex items-center justify-between gap-2">
              <div>
                <div class="font-bold text-slate-900">${x(t.title||t.summary||`Follow-up`)}</div>
                <div class="text-[10px] ${n}">Due: ${x(t.dueDate||`—`)}</div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white border border-amber-200 text-amber-700">${x(t.status||`open`)}</span>
            </div>
          `}).join(``):`<div class="text-slate-400">No open follow-ups.</div>`}</div></div>
        <div><div class="text-[10px] font-bold text-slate-400 uppercase mb-3">Activity Timeline</div>${a}</div>
      </div>
    `}}}window.showCustomersMainView=function(){document.getElementById(`crm-customers-main-view`).classList.remove(`hidden`),document.getElementById(`crm-customers-form-view`).classList.add(`hidden`)},window.showCustomersFormView=function(){document.getElementById(`crm-customers-main-view`).classList.add(`hidden`),document.getElementById(`crm-customers-form-view`).classList.remove(`hidden`)},window.openCustomerModal=function(e=``){if(document.getElementById(`crm-customer-form`).reset(),document.getElementById(`crm-customer-id`).value=``,document.getElementById(`crm-customer-modal-title`).textContent=`Create Customer`,R(`crm-input-owner`),e){let t=s(d,e);t&&(document.getElementById(`crm-customer-id`).value=e,document.getElementById(`crm-customer-modal-title`).textContent=`Edit Customer`,document.getElementById(`crm-input-name`).value=t.customer.name,document.getElementById(`crm-input-company`).value=t.customer.company,document.getElementById(`crm-input-email`).value=t.contacts[0]?.email||``,document.getElementById(`crm-input-phone`).value=t.contacts[0]?.phone||``,document.getElementById(`crm-input-status`).value=t.customer.status,document.getElementById(`crm-input-owner`).value=t.customer.ownerId||``)}window.showCustomersFormView()},window.handleCustomerSubmit=function(t){t.preventDefault();let n=document.getElementById(`crm-customer-id`).value,r={name:document.getElementById(`crm-input-name`).value.trim(),company:document.getElementById(`crm-input-company`).value.trim(),email:document.getElementById(`crm-input-email`).value.trim(),phone:document.getElementById(`crm-input-phone`).value.trim(),status:document.getElementById(`crm-input-status`).value,ownerId:document.getElementById(`crm-input-owner`).value,ownerName:document.getElementById(`crm-input-owner`).options[document.getElementById(`crm-input-owner`).selectedIndex]?.text||``},i=n?e(d,n,r):c(d,r);if(!i.ok){alert(i.error||`Unable to save customer.`);return}window.showCustomersMainView(),j()},window.openCRMDrawer=function(e){let t=s(d,e);t&&(g=e,document.getElementById(`crm-drawer-subtitle`).textContent=`${t.customer.company} · ${t.customer.ownerName||`No Rep`}`,H(t),window.switchProfileTab(`overview`),document.getElementById(`crm-details-drawer-overlay`).classList.remove(`hidden`),setTimeout(()=>{document.getElementById(`crm-details-drawer`).classList.remove(`drawer-hidden`)},10),f())},window.closeCRMDrawer=function(){document.getElementById(`crm-details-drawer`).classList.add(`drawer-hidden`),setTimeout(()=>{document.getElementById(`crm-details-drawer-overlay`).classList.add(`hidden`),g=null},300)},window.switchProfileTab=function(e){if(!document.getElementById(`crm-profile-content`)||!g)return;document.querySelectorAll(`.crm-profile-tab`).forEach(t=>{t.getAttribute(`data-tab`)===e?t.className=`crm-profile-tab px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white cursor-pointer`:t.className=`crm-profile-tab px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer`});let t=s(d,g);t&&U(e,t)},window.setCustomerQuickFilter=function(e){_.quickFilter=e||`all`,e===`active`?_.status=`active`:e===`overdue`?_.status=`overdue`:e===`all`&&(_.status=`all`),_.currentPage=1;let t=document.getElementById(`crm-filter-status`);t&&(e===`active`||e===`overdue`||e===`all`)&&(t.value=_.status),V(),window.scrollToCustomerTable()},window.scrollToCustomerTable=function(){document.getElementById(`crm-customers-table-panel`)?.scrollIntoView({behavior:`smooth`,block:`start`})},window.removeCustomerFilterChip=function(e){if(e===`quick`&&(_.quickFilter=`all`),e===`search`){_.searchQuery=``;let e=document.getElementById(`crm-search-input`);e&&(e.value=``)}if(e===`status`){_.status=`all`;let e=document.getElementById(`crm-filter-status`);e&&(e.value=`all`)}if(e===`tier`){_.tier=`all`;let e=document.getElementById(`crm-filter-tier`);e&&(e.value=`all`)}if(e===`owner`){_.ownerId=`all`;let e=document.getElementById(`crm-filter-owner`);e&&(e.value=`all`)}if(e===`territory`){_.territory=``;let e=document.getElementById(`crm-filter-territory`);e&&(e.value=``)}_.currentPage=1,V()},window.handleCustomerSearch=function(e){_.searchQuery=String(e||``).toLowerCase().trim(),_.currentPage=1,V()},window.handleCustomerSort=function(e){_.sortKey=e||`name-asc`,_.currentPage=1,V()},window.applyCustomerFilter=function(){let e=document.getElementById(`crm-filter-status`),t=document.getElementById(`crm-filter-tier`),n=document.getElementById(`crm-filter-owner`),r=document.getElementById(`crm-filter-territory`);_.status=e?.value||`all`,_.tier=t?.value||`all`,_.ownerId=n?.value||`all`,_.territory=String(r?.value||``).toLowerCase().trim(),_.status!==`active`&&_.status!==`overdue`&&(_.quickFilter===`active`||_.quickFilter===`overdue`)&&(_.quickFilter=`all`),_.currentPage=1,V()},window.clearCustomerFilters=function(){_.searchQuery=``,_.status=`all`,_.tier=`all`,_.ownerId=`all`,_.territory=``,_.quickFilter=`all`,_.currentPage=1;let e=document.getElementById(`crm-search-input`),t=document.getElementById(`crm-filter-status`),n=document.getElementById(`crm-filter-tier`),r=document.getElementById(`crm-filter-owner`),i=document.getElementById(`crm-filter-territory`);e&&(e.value=``),t&&(t.value=`all`),n&&(n.value=`all`),r&&(r.value=`all`),i&&(i.value=``),V()},window.toggleAdvancedFilters=function(){document.getElementById(`crm-advanced-filters`)?.classList.toggle(`hidden`)},window.changeCustomerPage=function(e){let t=P().length,n=Math.max(1,Math.ceil(t/h)||1);_.currentPage=Math.min(n,Math.max(1,_.currentPage+Number(e||0))),V()},window.toggleBulkSelectAll=function(e){document.querySelectorAll(`.crm-row-select`).forEach(t=>{t.checked=!!e}),window.updateBulkSelection()},window.updateBulkSelection=function(){let e=[...document.querySelectorAll(`.crm-row-select:checked`)],t=document.getElementById(`crm-bulk-toolbar`),n=document.getElementById(`crm-bulk-count`);n&&(n.textContent=e.length),t&&(e.length>0?t.classList.remove(`hidden`):t.classList.add(`hidden`));let r=document.getElementById(`crm-bulk-select-all`),i=[...document.querySelectorAll(`.crm-row-select`)];r&&i.length&&(r.checked=i.every(e=>e.checked))};function W(){return[...document.querySelectorAll(`.crm-row-select:checked`)].map(e=>e.getAttribute(`data-id`)).filter(Boolean)}function G(e,t,n=`text/csv;charset=utf-8`){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.click(),URL.revokeObjectURL(i)}window.bulkExportCustomers=function(){let e=W();e.length&&G(`customers-export-${new Date().toISOString().slice(0,10)}.csv`,o(d,e))},window.bulkDeleteCustomers=function(){let e=W();e.length&&confirm(`Delete ${e.length} selected customer(s)? This cannot be undone.`)&&(e.forEach(e=>n(d,e)),j())},window.downloadCustomerTemplate=function(){G(`customer-import-template.csv`,r())},window.bulkAssignCustomers=function(){W().length&&(R(`crm-bulk-assign-owner`),document.getElementById(`crm-bulk-assign-modal`)?.classList.remove(`hidden`))},window.closeBulkAssignModal=function(){document.getElementById(`crm-bulk-assign-modal`)?.classList.add(`hidden`)},window.confirmBulkAssign=function(){let t=W(),n=document.getElementById(`crm-bulk-assign-owner`);if(!t.length||!n?.value)return;let r=n.options[n.selectedIndex]?.text||``;t.forEach(t=>e(d,t,{ownerId:n.value,ownerName:r})),window.closeBulkAssignModal(),j()},window.openImportModal=function(){let e=document.getElementById(`crm-import-result`),t=document.getElementById(`crm-import-file`);e&&(e.classList.add(`hidden`),e.textContent=``),t&&(t.value=``),document.getElementById(`crm-import-modal`)?.classList.remove(`hidden`)},window.closeImportModal=function(){document.getElementById(`crm-import-modal`)?.classList.add(`hidden`)};function K(e){let t=[],n=``,r=!1;for(let i=0;i<e.length;i+=1){let a=e[i];a===`"`?r&&e[i+1]===`"`?(n+=`"`,i+=1):r=!r:a===`,`&&!r?(t.push(n.trim()),n=``):n+=a}return t.push(n.trim()),t}window.processCustomerImport=function(){let e=document.getElementById(`crm-import-file`),t=document.getElementById(`crm-import-result`),n=e?.files?.[0];if(!n){alert(`Please choose a CSV file first.`);return}let r=new FileReader;r.onload=e=>{let n=String(e.target?.result||``).split(/\r?\n/).filter(e=>e.trim());if(n.length<2){t&&(t.className=`text-xs font-semibold mb-4 text-rose-600`,t.textContent=`CSV file is empty or invalid.`,t.classList.remove(`hidden`));return}let r=K(n[0]).map(e=>e.toLowerCase()),a=0,o=0;for(let e=1;e<n.length;e+=1){let t=K(n[e]),s={};if(r.forEach((e,n)=>{s[e]=t[n]||``}),!s.name&&!s.company){o+=1;continue}let l={name:s.name||s.company,company:s.company||s.name,email:s.email||``,phone:s.phone||``,status:s.status||`active`,ownerName:s.ownername||s.owner||``,contactName:s.contactname||s.name||``,pricingTier:s.pricingtier||`Standard`,paymentTerms:s.paymentterms||`Net 30`,territory:s.territory||``,branch:s.branch||``},u=i(d).find(e=>e.name.toLowerCase()===String(l.ownerName).toLowerCase());u&&(l.ownerId=u.id),c(d,l).ok?a+=1:o+=1}p(),V(),L(),t&&(t.className=`text-xs font-semibold mb-4 text-emerald-600`,t.textContent=`Imported ${a} customer(s). Skipped ${o}.`,t.classList.remove(`hidden`))},r.readAsText(n)},window.exportCustomerProfilePdf=function(){if(g){window.print();return}alert(`Open a customer profile first to print.`)},window.openTimelineModal=function(){g&&(document.getElementById(`crm-activity-summary`).value=``,document.getElementById(`crm-activity-note`).value=``,document.getElementById(`crm-activity-type`).value=`note`,document.getElementById(`crm-activity-modal`)?.classList.remove(`hidden`))},window.closeActivityModal=function(){document.getElementById(`crm-activity-modal`)?.classList.add(`hidden`)},window.saveCustomerActivity=function(){if(!g)return;let e=document.getElementById(`crm-activity-summary`).value.trim(),t=document.getElementById(`crm-activity-note`).value.trim(),n=document.getElementById(`crm-activity-type`).value;if(!e){alert(`Please enter an activity summary.`);return}l(d,{entityType:`customer`,entityId:g,activityType:n,summary:e,note:t}),p(),window.closeActivityModal(),window.switchProfileTab(`activity`)},document.addEventListener(`DOMContentLoaded`,async()=>{await m,t(d),R(`crm-input-owner`),R(`crm-filter-owner`,!0);let e=document.getElementById(`crm-sort-select`);e&&(_.sortKey=e.value||`name-asc`),V(),L(),f()}),window.addEventListener(`hookerp:language-changed`,()=>{if(R(`crm-input-owner`),R(`crm-filter-owner`,!0),g){let e=s(d,g);e&&H(e)}V(),L(),f()});