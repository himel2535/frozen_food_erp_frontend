import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";var i=[{id:`DSP-001`,date:`2026-07-20`,salesOrderId:`SO-2026-0001`,vehicleId:`AST-003`,vehicleName:`Delivery Van (Ford Transit)`,driverName:`Rahim Uddin`,driverPhone:`01711-111111`,eta:`2026-07-20T14:30`,status:`on_route`,location:`Dhaka`,stockDeducted:!0},{id:`DSP-002`,date:`2026-07-20`,salesOrderId:`SO-2026-0002`,vehicleId:`AST-003`,vehicleName:`Delivery Van (Ford Transit)`,driverName:`Karim Hossain`,driverPhone:`01722-222222`,eta:`2026-07-20T16:00`,status:`on_route`,location:`Dhaka`,stockDeducted:!0},{id:`DSP-003`,date:`2026-07-19`,salesOrderId:`SO-2026-0001`,vehicleId:`AST-003`,vehicleName:`Delivery Van (Ford Transit)`,driverName:`Rahim Uddin`,driverPhone:`01711-111111`,eta:`2026-07-19T11:00`,status:`delivered`,location:`Mirpur`,stockDeducted:!0},{id:`DSP-004`,date:`2026-07-21`,salesOrderId:`SO-2026-0002`,vehicleId:``,vehicleName:``,driverName:``,driverPhone:``,eta:`2026-07-21T10:00`,status:`scheduled`,location:`Chittagong`,stockDeducted:!1},{id:`DSP-005`,date:`2026-07-18`,salesOrderId:`SO-2026-0001`,vehicleId:`AST-003`,vehicleName:`Delivery Van (Ford Transit)`,driverName:`Salma Begum`,driverPhone:`01733-333333`,eta:`2026-07-18T15:30`,status:`delivered`,location:`Mirpur`,stockDeducted:!0},{id:`DSP-006`,date:`2026-07-21`,salesOrderId:`SO-2026-0002`,vehicleId:`AST-003`,vehicleName:`Delivery Van (Ford Transit)`,driverName:`Karim Hossain`,driverPhone:`01722-222222`,eta:`2026-07-21T13:00`,status:`scheduled`,location:`Chittagong`,stockDeducted:!1}],a=!1,o=new Set;function s(e){return{Scheduled:`scheduled`,scheduled:`scheduled`,Dispatched:`on_route`,on_route:`on_route`,"On route":`on_route`,Delivered:`delivered`,delivered:`delivered`,Cancelled:`scheduled`,cancelled:`scheduled`}[e]||`scheduled`}function c(e){return{scheduled:`Scheduled`,on_route:`On route`,delivered:`Delivered`}[e]||e}function l(e){return e===`scheduled`?`dispatch-badge dispatch-badge-scheduled`:e===`on_route`?`dispatch-badge dispatch-badge-on_route`:e===`delivered`?`dispatch-badge dispatch-badge-delivered`:`dispatch-badge dispatch-badge-slate`}function u(){return e.dispatchSettings||(e.dispatchSettings={autoSms:!1},n()),e.dispatchSettings}function d(){return(!Array.isArray(e.dispatches)||e.dispatches.length===0&&!e._dispatchMigratedV2)&&(e.dispatches=i.map(e=>({...e})),e._dispatchMigratedV2=!0,n()),e.dispatches.forEach(e=>{e.status=s(e.status)}),e.dispatches}function f(){return Array.isArray(e.salesOrders)?e.salesOrders:[]}function p(){let t=(Array.isArray(e.assets)?e.assets:[]).filter(e=>e.category===`Vehicle`||e.category===`Vehicles`);return t.length===0&&(t=[{id:`AST-003`,name:`Delivery Van (Ford Transit)`,category:`Vehicles`},{id:`AST-004`,name:`Pickup Truck (Toyota Hilux)`,category:`Vehicles`}]),t}function m(){return Array.isArray(e.inventory)?e.inventory:[]}function h(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function g(e,t,n=`w-4 h-4`){return`<img src="/images/icons/actions/${e}" alt="${h(t)}" class="${n} object-contain pointer-events-none" />`}function _(e,t){return`<img src="/images/icons/metrics/${e}" alt="${h(t)}" class="w-9 h-9 object-contain pointer-events-none shrink-0" />`}function v(){let e=d().reduce((e,t)=>{let n=Number.parseInt(String(t.id||``).replace(/[^\d]/g,``),10);return Number.isFinite(n)?Math.max(e,n):e},0);return`DSP-${String(e+1).padStart(3,`0`)}`}function y(e){let t=String(e||``).trim().split(/\s+/).filter(Boolean);return t.length===0?`?`:t.length===1?t[0].slice(0,2).toUpperCase():(t[0][0]+t[t.length-1][0]).toUpperCase()}function b(e){if(!e)return`—`;let t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString(`en-GB`,{day:`numeric`,month:`short`,hour:`2-digit`,minute:`2-digit`})}function x(e){if(e.vehicleName)return e.vehicleName;if(!e.vehicleId)return`N/A`;let t=p().find(t=>t.id===e.vehicleId);return t?t.name:e.vehicleId}function S(e,t){u().autoSms&&console.info(`[Dispatch SMS] ${e.id} → ${c(t)} | Driver: ${e.driverName||`N/A`} | Phone: ${e.driverPhone||`N/A`}`)}window.showMainView=function(){document.getElementById(`dispatch-main-view`).classList.remove(`hidden`),document.getElementById(`dispatch-form-view`).classList.add(`hidden`),F()},window.showFormView=function(){document.getElementById(`dispatch-main-view`).classList.add(`hidden`),document.getElementById(`dispatch-form-view`).classList.remove(`hidden`)},window.openDispatchModal=function(e=``){let n=document.getElementById(`dispatch-form`);if(!n)return;n.reset(),document.getElementById(`dispatch-edit-id`).value=``;let r=document.getElementById(`dispatch-form-title`);if(r&&(r.textContent=`Create dispatch log`),document.getElementById(`dispatch-input-date`).value=new Date().toISOString().split(`T`)[0],document.getElementById(`dispatch-input-eta`).value=``,document.getElementById(`dispatch-input-location`).value=``,C(),T(),e){let t=d().find(t=>t.id===e);t&&(document.getElementById(`dispatch-edit-id`).value=t.id,r&&(r.textContent=`Edit dispatch log`),document.getElementById(`dispatch-input-so`).value=t.salesOrderId,document.getElementById(`dispatch-input-date`).value=t.date,document.getElementById(`dispatch-input-vehicle`).value=t.vehicleId||``,document.getElementById(`dispatch-input-driver`).value=t.driverName||``,document.getElementById(`dispatch-input-phone`).value=t.driverPhone||``,document.getElementById(`dispatch-input-status`).value=s(t.status),document.getElementById(`dispatch-input-eta`).value=t.eta||``,document.getElementById(`dispatch-input-location`).value=t.location||``,document.getElementById(`dispatch-input-so`).disabled=!!t.stockDeducted)}else document.getElementById(`dispatch-input-so`).disabled=!1;window.updateDispatchHelpers(),window.showFormView(),t()};function C(){let e=document.getElementById(`dispatch-input-so`),t=f();e.innerHTML=`<option value="">Select sales order...</option>`+t.map(e=>`<option value="${e.id}">${h(e.id)} (Customer: ${h(e.customerName||`Unknown`)})</option>`).join(``),t.length===0&&(e.innerHTML+=`
      <option value="SO-2026-0001">SO-2026-0001 (Customer: Bell Labs)</option>
      <option value="SO-2026-0002">SO-2026-0002 (Customer: General Electric)</option>
    `);let n=document.getElementById(`dispatch-input-vehicle`);n.innerHTML=`<option value="">Select vehicle...</option>`+p().map(e=>`<option value="${e.id}">${h(e.id)} — ${h(e.name)}</option>`).join(``)}function w(){let e=document.getElementById(`dispatch-filter-vehicle`),t=document.getElementById(`dispatch-bulk-vehicle`),n=p();e&&e.options.length<=1&&n.forEach(t=>{e.innerHTML+=`<option value="${t.id}">${h(t.name)}</option>`}),t&&(t.innerHTML=`<option value="">Select vehicle</option>`+n.map(e=>`<option value="${e.id}">${h(e.name)}</option>`).join(``))}function T(){let e=document.getElementById(`dispatch-sms-note`),t=u();e&&e.classList.toggle(`hidden`,!t.autoSms)}window.toggleAutoSms=function(){let e=u();e.autoSms=document.getElementById(`dispatch-sms-toggle`)?.checked||!1,n(),T()},window.updateDispatchHelpers=function(){let e=document.getElementById(`dispatch-input-so`).value,t=document.getElementById(`dispatch-order-preview`),n=document.getElementById(`dispatch-order-items`);if(!e){t.classList.add(`hidden`);return}let r=f().find(t=>t.id===e);if(!r||!r.items||r.items.length===0){n.innerHTML=`<div class="text-slate-500 italic">No items found in this order.</div>`,t.classList.remove(`hidden`);return}n.innerHTML=r.items.map(e=>`<div>• ${h(e.name||e.productName)}: ${e.quantity} units</div>`).join(``),t.classList.remove(`hidden`)},window.handleSubmit=function(e){e.preventDefault();let t=d(),r=document.getElementById(`dispatch-edit-id`).value,i=document.getElementById(`dispatch-input-so`).value,a=s(document.getElementById(`dispatch-input-status`).value),o=document.getElementById(`dispatch-input-vehicle`).value,c=p().find(e=>e.id===o);if(!i){alert(`Please select a sales order.`);return}let l=r?t.find(e=>e.id===r):null,u=l?s(l.status):null,f={id:r||v(),salesOrderId:i,date:document.getElementById(`dispatch-input-date`).value,vehicleId:o,vehicleName:c?c.name:``,driverName:document.getElementById(`dispatch-input-driver`).value.trim(),driverPhone:document.getElementById(`dispatch-input-phone`).value.trim(),eta:document.getElementById(`dispatch-input-eta`).value||``,location:document.getElementById(`dispatch-input-location`).value.trim()||``,status:a,stockDeducted:l?l.stockDeducted:!1};if((a===`on_route`||a===`delivered`)&&!f.stockDeducted)if(confirm(`Dispatching this order will permanently deduct the items from inventory. Proceed?`))E(f.salesOrderId),f.stockDeducted=!0;else return;let m=t.findIndex(e=>e.id===f.id);m>=0?t[m]=f:t.push(f),u!==a&&S(f,a),n(),window.showMainView()};function E(e){let t=f().find(t=>t.id===e);if(!t||!t.items)return;let r=m();t.items.forEach(e=>{let t=r.find(t=>String(t.id)===String(e.productId)||t.name===e.name||t.name===e.productName);t&&(t.stock=Math.max(0,(t.stock||0)-Number(e.quantity||0)))}),n()}function D(){let e=String(document.getElementById(`dispatch-search-input`)?.value||``).toLowerCase(),t=document.getElementById(`dispatch-filter-status`)?.value||`all`,n=document.getElementById(`dispatch-filter-vehicle`)?.value||`all`,r=document.getElementById(`dispatch-filter-date-start`)?.value||``,i=document.getElementById(`dispatch-filter-date-end`)?.value||``;return d().filter(a=>{let o=[a.id,a.salesOrderId,a.driverName,a.location].join(` `).toLowerCase(),c=!e||o.includes(e),l=t===`all`||s(a.status)===t,u=n===`all`||a.vehicleId===n,d=!0;return r&&(d&&=a.date>=r),i&&(d&&=a.date<=i),c&&l&&u&&d})}function O(e){return`
    <tr>
      <td colspan="${e}" class="px-6 py-12 text-center">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <i data-lucide="truck" class="w-6 h-6 text-slate-400"></i>
          </div>
          <p class="text-sm font-semibold text-slate-700">No dispatches created yet</p>
          <p class="text-xs text-slate-400 font-medium">Create a dispatch log to assign vehicles and track deliveries.</p>
          <button type="button" onclick="window.openDispatchModal()" class="mt-1 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-xs hover:bg-blue-700 cursor-pointer">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> New dispatch log
          </button>
        </div>
      </td>
    </tr>
  `}function k(){return`
    <div class="dispatch-card p-8 flex flex-col items-center gap-3 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
        <i data-lucide="truck" class="w-6 h-6 text-slate-400"></i>
      </div>
      <p class="text-sm font-semibold text-slate-700">No dispatches created yet</p>
      <p class="text-xs text-slate-400 font-medium">Create a dispatch log to assign vehicles and track deliveries.</p>
      <button type="button" onclick="window.openDispatchModal()" class="mt-1 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-xs hover:bg-blue-700 cursor-pointer">
        <i data-lucide="plus" class="w-3.5 h-3.5"></i> New dispatch log
      </button>
    </div>
  `}function A(e){let t=e.driverName||`Unassigned`;return`
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">${h(y(e.driverName))}</div>
      <div class="min-w-0">
        <div class="font-semibold text-slate-700 truncate">${h(t)}</div>
        <div class="text-[10px] text-slate-400 truncate">${h(e.driverPhone||``)}</div>
      </div>
    </div>
  `}window.renderTable=function(){let e=document.getElementById(`dispatch-table-body`),n=document.getElementById(`dispatch-mobile-list`);if(!e)return;let r=D();if(e.innerHTML=``,r.length===0){e.innerHTML=O(9),n&&(n.innerHTML=k()),M(),t();return}r.forEach(t=>{let n=s(t.status),r=o.has(t.id)?`checked`:``;e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3">
          <input type="checkbox" class="dispatch-row-check rounded border-slate-300 cursor-pointer" data-id="${h(t.id)}" ${r} onchange="window.toggleRowSelect('${h(t.id)}', this.checked)">
        </td>
        <td class="px-4 py-3 font-semibold text-slate-900">${h(t.id)}</td>
        <td class="px-4 py-3 text-[11px] text-slate-600">${h(t.date)}</td>
        <td class="px-4 py-3">
          <span class="text-xs font-semibold text-blue-600">${h(t.salesOrderId)}</span>
        </td>
        <td class="px-4 py-3 font-medium text-slate-700">${h(x(t))}</td>
        <td class="px-4 py-3">${A(t)}</td>
        <td class="px-4 py-3 text-[11px] text-slate-600">${h(b(t.eta))}</td>
        <td class="px-4 py-3">
          <span class="${l(n)}">${h(c(n))}</span>
        </td>
        <td class="px-4 py-3 text-center">
          <div class="inline-flex items-center justify-center gap-1 rounded-xl border border-sky-100 bg-sky-50 p-1">
            <button type="button" onclick="window.viewLiveLocation('${h(t.id)}')" title="View" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${g(`view.png`,`View`,`w-5 h-5`)}
            </button>
            <button type="button" onclick="window.openDispatchModal('${h(t.id)}')" title="Edit" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${g(`edit.png`,`Edit`,`w-5 h-5`)}
            </button>
          </div>
        </td>
      </tr>
    `}),j(r),M(),t()};function j(e){let t=document.getElementById(`dispatch-mobile-list`);if(t){if(e.length===0){t.innerHTML=k();return}t.innerHTML=e.map(e=>{let t=s(e.status),n=o.has(e.id)?`checked`:``;return`
      <div class="dispatch-card p-4 flex flex-col gap-3 hover:bg-slate-50/50 transition-colors">
        <div class="flex items-start justify-between gap-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="dispatch-row-check rounded border-slate-300 cursor-pointer" data-id="${h(e.id)}" ${n} onchange="window.toggleRowSelect('${h(e.id)}', this.checked)">
            <span class="font-semibold text-slate-900 text-xs">${h(e.id)}</span>
          </label>
          <span class="${l(t)}">${h(c(t))}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div><span class="text-slate-400">Date</span><p class="font-medium text-slate-700">${h(e.date)}</p></div>
          <div><span class="text-slate-400">Sales order</span><p class="font-semibold text-blue-600">${h(e.salesOrderId)}</p></div>
          <div><span class="text-slate-400">Vehicle</span><p class="font-medium text-slate-700">${h(x(e))}</p></div>
          <div><span class="text-slate-400">ETA</span><p class="font-medium text-slate-700">${h(b(e.eta))}</p></div>
        </div>
        <div>${A(e)}</div>
        <div class="flex items-center gap-2 pt-1 border-t border-slate-100">
          <button type="button" onclick="window.viewLiveLocation('${h(e.id)}')" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 cursor-pointer">
            ${g(`view.png`,`View`,`w-4 h-4`)} View
          </button>
          <button type="button" onclick="window.openDispatchModal('${h(e.id)}')" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 cursor-pointer">
            ${g(`edit.png`,`Edit`,`w-4 h-4`)} Edit
          </button>
        </div>
      </div>
    `}).join(``)}}window.toggleRowSelect=function(e,t){t?o.add(e):o.delete(e),M()},window.toggleSelectAll=function(e){let t=D();e?t.forEach(e=>o.add(e.id)):t.forEach(e=>o.delete(e.id)),window.renderTable()},window.clearBulkSelection=function(){o.clear();let e=document.getElementById(`dispatch-select-all`);e&&(e.checked=!1),window.renderTable()};function M(){let e=document.getElementById(`dispatch-bulk-bar`),t=document.getElementById(`dispatch-bulk-count`);if(!e)return;let n=o.size;e.classList.toggle(`hidden`,n===0),t&&(t.textContent=String(n))}window.bulkAssignDispatches=function(){if(o.size===0)return;let e=document.getElementById(`dispatch-bulk-driver`)?.value.trim()||``,t=document.getElementById(`dispatch-bulk-vehicle`)?.value||``,r=p().find(e=>e.id===t);if(!e&&!t){alert(`Enter a driver name or select a vehicle.`);return}d().forEach(n=>{o.has(n.id)&&(e&&(n.driverName=e),t&&(n.vehicleId=t,n.vehicleName=r?r.name:``))}),n(),o.clear(),document.getElementById(`dispatch-bulk-driver`).value=``,window.renderTable()},window.viewLiveLocation=function(e){let t=d().find(t=>t.id===e);if(!t)return;let n=t.location||`Unknown area`,r=c(s(t.status));alert(`Live location (simulated)\n\nDispatch: ${t.id}\nArea: ${n}\nStatus: ${r}\nDriver: ${t.driverName||`Unassigned`}\nVehicle: ${x(t)}`)},window.dismissRouteHint=function(){a=!0;let e=document.getElementById(`dispatch-route-hint`);e&&e.classList.add(`hidden`)};function N(){let e=document.getElementById(`dispatch-route-hint`),t=document.getElementById(`dispatch-route-hint-text`);if(!e||!t)return;if(a){e.classList.add(`hidden`);return}let n=d().filter(e=>s(e.status)===`on_route`&&e.location),r={};n.forEach(e=>{let t=String(e.location).trim();r[t]||(r[t]=0),r[t]+=1});let i=Object.entries(r).find(([,e])=>e>=2);if(!i){e.classList.add(`hidden`);return}let[o,c]=i;t.textContent=`${c} deliveries in ${o} — consider combining routes`,e.classList.remove(`hidden`)}function P(){let e=document.getElementById(`dispatch-metrics`);if(!e)return;let t=d(),n=t.filter(e=>s(e.status)===`scheduled`).length,r=t.filter(e=>s(e.status)===`on_route`).length,i=t.filter(e=>s(e.status)===`delivered`).length;e.innerHTML=`
    <div class="dispatch-card dispatch-card-tint-slate p-4 flex items-start gap-3">
      ${_(`total.png`,`Total dispatches`)}
      <div>
        <span class="text-[11px] font-semibold text-slate-500 block">Total dispatches</span>
        <span class="text-xl font-bold text-slate-900 block mt-1">${t.length}</span>
      </div>
    </div>
    <div class="dispatch-card dispatch-card-tint-blue p-4 flex items-start gap-3">
      ${_(`scheduled.png`,`Scheduled`)}
      <div>
        <span class="text-[11px] font-semibold text-blue-600 block">Scheduled</span>
        <span class="text-xl font-bold text-blue-700 block mt-1">${n}</span>
      </div>
    </div>
    <div class="dispatch-card dispatch-card-tint-amber p-4 flex items-start gap-3">
      ${_(`on-route.png`,`On route`)}
      <div>
        <span class="text-[11px] font-semibold text-amber-600 block">On route</span>
        <span class="text-xl font-bold text-amber-700 block mt-1">${r}</span>
      </div>
    </div>
    <div class="dispatch-card dispatch-card-tint-emerald p-4 flex items-start gap-3">
      ${_(`delivered.png`,`Delivered`)}
      <div>
        <span class="text-[11px] font-semibold text-emerald-600 block">Delivered</span>
        <span class="text-xl font-bold text-emerald-700 block mt-1">${i}</span>
      </div>
    </div>
  `}function F(){let e=document.getElementById(`dispatch-sms-toggle`);e&&(e.checked=!!u().autoSms),w(),P(),N(),window.renderTable(),T(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,F()});