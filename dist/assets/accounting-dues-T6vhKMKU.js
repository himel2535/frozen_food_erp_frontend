import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{o as e,t}from"./shared-Det_SasC.js";var n=[{id:`CUST-001`,name:`Acme Corp`,type:`Receivable`,buckets:{b30:1250,b60:450,b90:0,b90plus:0}},{id:`CUST-002`,name:`TechStart LLC`,type:`Receivable`,buckets:{b30:0,b60:890,b90:120,b90plus:0}},{id:`SUPP-001`,name:`Global Wood Suppliers`,type:`Payable`,buckets:{b30:3400,b60:0,b90:0,b90plus:0}},{id:`SUPP-002`,name:`MetalWorks Inc`,type:`Payable`,buckets:{b30:0,b60:0,b90:2100,b90plus:450}}];window.renderTable=function(){let t=document.getElementById(`accounting-dues-body`);if(!t)return;t.innerHTML=``;let r=document.getElementById(`accounting-dues-search-input`)?.value.toLowerCase()||``,i=document.getElementById(`accounting-dues-type-filter`)?.value||`all`,a=n.filter(e=>{let t=!r||e.name.toLowerCase().includes(r)||e.id.toLowerCase().includes(r),n=i===`all`||e.type.toLowerCase()===i.toLowerCase();return t&&n});if(a.length===0){t.innerHTML=`<tr><td colspan="8" class="p-8 text-center text-slate-400">No pending dues found matching filters</td></tr>`;return}a.forEach(e=>{let n=e.buckets.b30+e.buckets.b60+e.buckets.b90+e.buckets.b90plus,r=e.type===`Receivable`?`bg-emerald-50 text-emerald-700`:`bg-rose-50 text-rose-700`,i=document.createElement(`tr`);i.className=`hover:bg-slate-50 transition-colors group`,i.innerHTML=`
      <td class="p-4">
        <div class="font-bold text-slate-900">${e.name}</div>
        <div class="text-[10px] text-slate-400">${e.id}</div>
      </td>
      <td class="p-4">
        <span class="px-2 py-1 rounded-lg text-[10px] font-bold ${r}">${e.type}</span>
      </td>
      <td class="p-4 text-right font-medium text-slate-600">$${e.buckets.b30.toFixed(2)}</td>
      <td class="p-4 text-right font-medium text-amber-600">$${e.buckets.b60.toFixed(2)}</td>
      <td class="p-4 text-right font-medium text-orange-600">$${e.buckets.b90.toFixed(2)}</td>
      <td class="p-4 text-right font-bold text-rose-600">$${e.buckets.b90plus.toFixed(2)}</td>
      <td class="p-4 text-right font-extrabold text-slate-900">$${n.toFixed(2)}</td>
      <td class="p-4 text-center">
        <button onclick="alert('Payment reminder sent to ${e.name}!')" class="border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm">Remind</button>
      </td>
    `,t.appendChild(i)}),e()},window.renderMetrics=function(){let e=document.getElementById(`accounting-ledger-metrics`);e&&(e.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200 premium-shadow">
      <p class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Receivables</p>
      <p class="text-2xl font-extrabold text-slate-900 mt-1">$2,710.00</p>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200 premium-shadow">
      <p class="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Total Payables</p>
      <p class="text-2xl font-extrabold text-slate-900 mt-1">$5,950.00</p>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200 premium-shadow">
      <p class="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Over 60 Days Old</p>
      <p class="text-2xl font-extrabold text-slate-900 mt-1">$2,670.00</p>
    </div>
  `)},document.addEventListener(`DOMContentLoaded`,async()=>{await t,window.renderMetrics(),window.renderTable()});