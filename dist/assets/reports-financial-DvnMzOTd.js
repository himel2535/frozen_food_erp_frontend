import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.reportFinancial||(e.reportFinancial=[{date:`2026-06-01`,ref:`TXN-001`,type:`Income`,category:`Sales Revenue`,amount:15e3},{date:`2026-06-05`,ref:`TXN-002`,type:`Expense`,category:`Raw Materials`,amount:4500},{date:`2026-06-10`,ref:`TXN-003`,type:`Expense`,category:`Office Supplies`,amount:350},{date:`2026-06-15`,ref:`TXN-004`,type:`Income`,category:`Sales Revenue`,amount:8200},{date:`2026-06-25`,ref:`TXN-005`,type:`Expense`,category:`Payroll`,amount:12500}],n()),e.reportFinancial}window.renderAll=function(){let e=o(),n=document.getElementById(`filter-start`)?.value||``,r=document.getElementById(`filter-end`)?.value||``,s=document.getElementById(`filter-type`)?.value||`All`,c=e.filter(e=>{let t=!0;return n&&e.date<n&&(t=!1),r&&e.date>r&&(t=!1),s!==`All`&&e.type!==s&&(t=!1),t});c.sort((e,t)=>new Date(t.date)-new Date(e.date));let l=document.getElementById(`report-body`);l&&(l.innerHTML=``,c.length===0?l.innerHTML=`<tr><td colspan="5" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`:c.forEach(e=>{let t=`bg-emerald-100 text-emerald-700`;e.type===`Expense`&&(t=`bg-rose-100 text-rose-700`);let n=e.type===`Income`?`text-emerald-600`:`text-rose-600`,r=e.type===`Income`?`+`:`-`;l.innerHTML+=`
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4">${i(e.date)}</td>
            <td class="p-4 font-bold text-slate-900">${i(e.ref)}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold ${t}">${i(e.type)}</span>
            </td>
            <td class="p-4">${i(e.category)}</td>
            <td class="p-4 text-right font-bold ${n}">${r}${a(e.amount)}</td>
          </tr>
        `}));let u=document.getElementById(`report-metrics`);if(u){let e=0,t=0;c.forEach(n=>{n.type===`Income`&&(e+=n.amount),n.type===`Expense`&&(t+=n.amount)});let n=e-t;u.innerHTML=`
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Inflows (Income)</span>
        <span class="text-xl font-extrabold text-emerald-600 block mt-2">${a(e)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outflows (Expense)</span>
        <span class="text-xl font-extrabold text-rose-600 block mt-2">${a(t)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Cash Flow</span>
        <span class="text-xl font-extrabold ${n>=0?`text-blue-600`:`text-rose-600`} block mt-2">${a(n)}</span>
      </div>
    `}t()},document.addEventListener(`DOMContentLoaded`,async()=>{await r,window.renderAll()});