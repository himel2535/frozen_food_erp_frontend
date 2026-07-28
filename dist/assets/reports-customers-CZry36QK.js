import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.reportCustomers||(e.reportCustomers=[{name:`Acme Corp`,status:`Active`,orders:24,revenue:125e3,outstanding:5e3,lastActive:`2026-06-15`},{name:`Globex Inc`,status:`Active`,orders:12,revenue:45e3,outstanding:3200,lastActive:`2026-06-10`},{name:`Initech`,status:`Active`,orders:8,revenue:22e3,outstanding:750,lastActive:`2026-05-28`},{name:`Soylent Corp`,status:`Inactive`,orders:2,revenue:8500,outstanding:0,lastActive:`2025-11-12`},{name:`Umbrella Corp`,status:`Active`,orders:45,revenue:25e4,outstanding:12500,lastActive:`2026-06-18`}],n()),e.reportCustomers}window.renderAll=function(){let e=o(),n=document.getElementById(`filter-search`)?.value.toLowerCase()||``,r=document.getElementById(`filter-status`)?.value||`All`,s=e.filter(e=>{let t=!0;return n&&!e.name.toLowerCase().includes(n)&&(t=!1),r!==`All`&&e.status!==r&&(t=!1),t});s.sort((e,t)=>t.revenue-e.revenue);let c=document.getElementById(`report-body`);c&&(c.innerHTML=``,s.length===0?c.innerHTML=`<tr><td colspan="6" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`:s.forEach(e=>{let t=`bg-slate-100 text-slate-600`;e.status===`Active`&&(t=`bg-emerald-100 text-emerald-700`),e.status===`Inactive`&&(t=`bg-rose-100 text-rose-700`),c.innerHTML+=`
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4 font-bold text-slate-900">${i(e.name)}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold ${t}">${i(e.status)}</span>
            </td>
            <td class="p-4">${e.orders}</td>
            <td class="p-4 font-bold text-emerald-600">${a(e.revenue)}</td>
            <td class="p-4 ${e.outstanding>0?`text-rose-600 font-bold`:`text-slate-500`}">${a(e.outstanding)}</td>
            <td class="p-4 text-right">${i(e.lastActive)}</td>
          </tr>
        `}));let l=document.getElementById(`report-metrics`);if(l){let e=0,t=0,n=0;s.forEach(r=>{e+=r.outstanding,t+=r.revenue,r.status===`Active`&&n++});let r=s.length>0?t/s.length:0;l.innerHTML=`
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Customers</span>
        <span class="text-xl font-extrabold text-slate-800 block mt-2">${n}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding AR</span>
        <span class="text-xl font-extrabold text-rose-600 block mt-2">${a(e)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Revenue per Customer</span>
        <span class="text-xl font-extrabold text-emerald-600 block mt-2">${a(r)}</span>
      </div>
    `}t()},document.addEventListener(`DOMContentLoaded`,async()=>{await r,window.renderAll()});