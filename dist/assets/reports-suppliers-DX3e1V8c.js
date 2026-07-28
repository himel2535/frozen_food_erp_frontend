import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.reportSuppliers||(e.reportSuppliers=[{name:`Global Dye Chemicals`,status:`Active`,pos:18,spend:85e3,outstanding:0,lastOrder:`2026-06-02`},{name:`Premium Yarns Ltd`,status:`Active`,pos:32,spend:15e4,outstanding:1500,lastOrder:`2026-06-06`},{name:`Machinery Spares Co`,status:`Active`,pos:5,spend:12e3,outstanding:2500,lastOrder:`2026-06-11`},{name:`Office Supplies Depot`,status:`Inactive`,pos:1,spend:350,outstanding:0,lastOrder:`2025-08-15`}],n()),e.reportSuppliers}window.renderAll=function(){let e=o(),n=document.getElementById(`filter-search`)?.value.toLowerCase()||``,r=document.getElementById(`filter-status`)?.value||`All`,s=e.filter(e=>{let t=!0;return n&&!e.name.toLowerCase().includes(n)&&(t=!1),r!==`All`&&e.status!==r&&(t=!1),t});s.sort((e,t)=>t.spend-e.spend);let c=document.getElementById(`report-body`);c&&(c.innerHTML=``,s.length===0?c.innerHTML=`<tr><td colspan="6" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`:s.forEach(e=>{let t=`bg-slate-100 text-slate-600`;e.status===`Active`&&(t=`bg-emerald-100 text-emerald-700`),e.status===`Inactive`&&(t=`bg-rose-100 text-rose-700`),c.innerHTML+=`
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4 font-bold text-slate-900">${i(e.name)}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold ${t}">${i(e.status)}</span>
            </td>
            <td class="p-4">${e.pos}</td>
            <td class="p-4 font-bold text-rose-600">${a(e.spend)}</td>
            <td class="p-4 ${e.outstanding>0?`text-amber-600 font-bold`:`text-slate-500`}">${a(e.outstanding)}</td>
            <td class="p-4 text-right">${i(e.lastOrder)}</td>
          </tr>
        `}));let l=document.getElementById(`report-metrics`);if(l){let e=0,t=0,n=`N/A`,r=0;s.forEach(i=>{e+=i.outstanding,i.status===`Active`&&t++,i.spend>r&&(r=i.spend,n=i.name)}),l.innerHTML=`
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Suppliers</span>
        <span class="text-xl font-extrabold text-slate-800 block mt-2">${t}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding AP</span>
        <span class="text-xl font-extrabold text-amber-600 block mt-2">${a(e)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow overflow-hidden">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Supplier</span>
        <span class="text-lg font-extrabold text-blue-600 block mt-2 truncate" title="${i(n)}">${i(n)}</span>
      </div>
    `}t()},document.addEventListener(`DOMContentLoaded`,async()=>{await r,window.renderAll()});