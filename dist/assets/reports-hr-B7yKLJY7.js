import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.reportHR||(e.reportHR=[{id:`EMP-001`,name:`Sarah Jenkins`,dept:`Sales`,role:`Sales Manager`,status:`Active`,hireDate:`2024-01-15`,salary:6500},{id:`EMP-002`,name:`David Chen`,dept:`Engineering`,role:`Frontend Dev`,status:`Active`,hireDate:`2025-03-01`,salary:5200},{id:`EMP-003`,name:`Emily Stone`,dept:`Management`,role:`CEO`,status:`Active`,hireDate:`2023-01-01`,salary:12e3},{id:`EMP-004`,name:`Mark Zuckerberg`,dept:`Engineering`,role:`Intern`,status:`Terminated`,hireDate:`2025-06-01`,salary:1500},{id:`EMP-005`,name:`Amanda Waller`,dept:`Sales`,role:`SDR`,status:`Active`,hireDate:`2026-02-10`,salary:4e3}],n()),e.reportHR}window.renderAll=function(){let e=o(),n=document.getElementById(`filter-search`)?.value.toLowerCase()||``,r=document.getElementById(`filter-dept`)?.value||`All`,s=document.getElementById(`filter-status`)?.value||`All`,c=e.filter(e=>{let t=!0;return n&&!e.id.toLowerCase().includes(n)&&!e.name.toLowerCase().includes(n)&&(t=!1),r!==`All`&&e.dept!==r&&(t=!1),s!==`All`&&e.status!==s&&(t=!1),t});c.sort((e,t)=>new Date(t.hireDate)-new Date(e.hireDate));let l=document.getElementById(`report-body`);l&&(l.innerHTML=``,c.length===0?l.innerHTML=`<tr><td colspan="7" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`:c.forEach(e=>{let t=`bg-slate-100 text-slate-600`;e.status===`Active`&&(t=`bg-emerald-100 text-emerald-700`),e.status===`Terminated`&&(t=`bg-rose-100 text-rose-700`),l.innerHTML+=`
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4 font-bold text-slate-900">${i(e.id)}</td>
            <td class="p-4 font-bold text-blue-600">${i(e.name)}</td>
            <td class="p-4">${i(e.dept)}</td>
            <td class="p-4">${i(e.role)}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold ${t}">${i(e.status)}</span>
            </td>
            <td class="p-4">${i(e.hireDate)}</td>
            <td class="p-4 text-right">${a(e.salary)}</td>
          </tr>
        `}));let u=document.getElementById(`report-metrics`);if(u){let e=0,t=0;c.forEach(n=>{n.status===`Active`&&(e++,t+=n.salary)});let n=e>0?t/e:0;u.innerHTML=`
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Headcount</span>
        <span class="text-xl font-extrabold text-slate-800 block mt-2">${e}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Base Cost (Active)</span>
        <span class="text-xl font-extrabold text-rose-600 block mt-2">${a(t)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Salary</span>
        <span class="text-xl font-extrabold text-blue-600 block mt-2">${a(n)}</span>
      </div>
    `}t()},document.addEventListener(`DOMContentLoaded`,async()=>{await r,window.renderAll()});