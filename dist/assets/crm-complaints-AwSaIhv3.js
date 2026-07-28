import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";var i=[];function a(){return e.complaints||(e.complaints=[...i],n()),e.complaints}function o(){return Array.isArray(e.crmCustomers)?e.crmCustomers:[]}function s(e){return o().find(t=>String(t.id)===String(e))}function c(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function l(){let e=a().reduce((e,t)=>{let n=Number.parseInt(String(t.id||``).replace(/[^\d]/g,``),10);return Number.isFinite(n)?Math.max(e,n):e},0);return`CMP-${String(e+1).padStart(3,`0`)}`}window.showMainView=function(){document.getElementById(`complaints-main-view`).classList.remove(`hidden`),document.getElementById(`complaints-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`complaints-main-view`).classList.add(`hidden`),document.getElementById(`complaints-form-view`).classList.remove(`hidden`)},window.openComplaintModal=function(e=``){let n=document.getElementById(`complaints-form`);if(n){if(n.reset(),document.getElementById(`complaints-edit-id`).value=``,document.getElementById(`complaints-form-title`).textContent=`Log Complaint`,document.getElementById(`complaints-input-date`).value=new Date().toISOString().split(`T`)[0],u(),e){let t=a().find(t=>t.id===e);t&&(document.getElementById(`complaints-edit-id`).value=t.id,document.getElementById(`complaints-form-title`).textContent=`Edit Complaint`,document.getElementById(`complaints-input-customer`).value=t.customerId||``,document.getElementById(`complaints-input-date`).value=t.date||``,document.getElementById(`complaints-input-subject`).value=t.subject||``,document.getElementById(`complaints-input-desc`).value=t.description||``,document.getElementById(`complaints-input-priority`).value=t.priority||`Medium`,document.getElementById(`complaints-input-status`).value=t.status||`Open`,document.getElementById(`complaints-input-resolution`).value=t.resolution||``)}window.showFormView(),t()}};function u(){let e=document.getElementById(`complaints-input-customer`);e.innerHTML=`<option value="">Select Customer...</option>`+o().map(e=>`<option value="${e.id}">${c(e.name||e.company)} (${c(e.id)})</option>`).join(``)}window.handleSubmit=function(e){e.preventDefault();let t=a(),r={id:document.getElementById(`complaints-edit-id`).value||l(),customerId:document.getElementById(`complaints-input-customer`).value,date:document.getElementById(`complaints-input-date`).value,subject:document.getElementById(`complaints-input-subject`).value.trim(),description:document.getElementById(`complaints-input-desc`).value.trim(),priority:document.getElementById(`complaints-input-priority`).value,status:document.getElementById(`complaints-input-status`).value,resolution:document.getElementById(`complaints-input-resolution`).value.trim()},i=t.findIndex(e=>e.id===r.id);i>=0?t[i]=r:t.push(r),n(),window.showMainView(),f()},window.renderTable=function(){let e=document.getElementById(`complaints-table-body`);if(!e)return;let t=String(document.getElementById(`complaints-search-input`)?.value||``).toLowerCase(),n=document.getElementById(`complaints-filter-status`)?.value||`all`,r=document.getElementById(`complaints-filter-priority`)?.value||`all`,i=a().filter(e=>{let i=s(e.customerId),a=[e.id,e.subject,i?.name,i?.company].join(` `).toLowerCase(),o=!t||a.includes(t),c=n===`all`||e.status===n,l=r===`all`||e.priority===r;return o&&c&&l});if(e.innerHTML=``,i.length===0){e.innerHTML=`<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 font-semibold">No complaints found.</td></tr>`;return}i.forEach(t=>{let n=s(t.customerId),r=`bg-slate-100 text-slate-600`;t.status===`Open`&&(r=`bg-rose-50 text-rose-600 border-rose-200`),t.status===`In Progress`&&(r=`bg-amber-50 text-amber-600 border-amber-200`),(t.status===`Resolved`||t.status===`Closed`)&&(r=`bg-emerald-50 text-emerald-600 border-emerald-200`);let i=`text-slate-600`;t.priority===`High`&&(i=`text-rose-600`),t.priority===`Medium`&&(i=`text-amber-600`),t.priority===`Low`&&(i=`text-blue-600`),e.innerHTML+=`
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${c(t.id)}</td>
        <td class="px-6 py-4 text-[11px] font-semibold text-slate-600">${t.date}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-700">${c(n?.name||n?.company||`Unknown`)}</div>
        </td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-700">${c(t.subject)}</div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="text-xs font-bold ${i}">${c(t.priority)}</span>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${r}">
            ${c(t.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.openComplaintModal('${t.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
        </td>
      </tr>
    `})};function d(){let e=document.getElementById(`complaints-metrics`);if(!e)return;let t=a(),n=t.filter(e=>e.status===`Open`).length,r=t.filter(e=>e.status===`In Progress`).length,i=t.filter(e=>e.status===`Resolved`||e.status===`Closed`).length;e.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Complaints</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${t.length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-rose-200 premium-shadow bg-rose-50/20">
      <span class="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Open</span>
      <span class="text-xl font-extrabold text-rose-700 block mt-2">${n}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-amber-200 premium-shadow bg-amber-50/20">
      <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">In Progress</span>
      <span class="text-xl font-extrabold text-amber-700 block mt-2">${r}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Resolved</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${i}</span>
    </div>
  `}function f(){d(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,f()});