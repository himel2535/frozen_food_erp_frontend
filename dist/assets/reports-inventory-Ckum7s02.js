import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.reportInventory||(e.reportInventory=[{sku:`RAW-001`,name:`Cotton Yarn 40s`,category:`Raw Materials`,warehouse:`Main Warehouse`,qty:5e3,cost:2.5},{sku:`RAW-002`,name:`Red Dye #4`,category:`Raw Materials`,warehouse:`Main Warehouse`,qty:150,cost:15},{sku:`FIN-001`,name:`Basic T-Shirt (M)`,category:`Finished Goods`,warehouse:`Factory Floor`,qty:300,cost:5.5},{sku:`FIN-002`,name:`Premium Polo (L)`,category:`Finished Goods`,warehouse:`Main Warehouse`,qty:1200,cost:8},{sku:`RAW-003`,name:`Elastic Bands`,category:`Raw Materials`,warehouse:`Factory Floor`,qty:10,cost:.5}],n()),e.reportInventory}window.renderAll=function(){let e=o(),n=document.getElementById(`filter-search`)?.value.toLowerCase()||``,r=document.getElementById(`filter-category`)?.value||`All`,s=document.getElementById(`filter-warehouse`)?.value||`All`,c=e.filter(e=>{let t=!0;return n&&!e.sku.toLowerCase().includes(n)&&!e.name.toLowerCase().includes(n)&&(t=!1),r!==`All`&&e.category!==r&&(t=!1),s!==`All`&&e.warehouse!==s&&(t=!1),t}),l=document.getElementById(`report-body`);l&&(l.innerHTML=``,c.length===0?l.innerHTML=`<tr><td colspan="7" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`:c.forEach(e=>{let t=e.qty*e.cost,n=e.qty<50;l.innerHTML+=`
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4 font-bold text-slate-900">${i(e.sku)}</td>
            <td class="p-4">${i(e.name)}</td>
            <td class="p-4">${i(e.category)}</td>
            <td class="p-4">${i(e.warehouse)}</td>
            <td class="p-4 ${n?`text-rose-600 font-bold`:``}">${e.qty} ${n?`⚠️`:``}</td>
            <td class="p-4">${a(e.cost)}</td>
            <td class="p-4 text-right font-bold text-blue-600">${a(t)}</td>
          </tr>
        `}));let u=document.getElementById(`report-metrics`);if(u){let e=0,t=0;c.forEach(n=>{e+=n.qty*n.cost,n.qty<50&&t++}),u.innerHTML=`
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Inventory Valuation</span>
        <span class="text-xl font-extrabold text-blue-600 block mt-2">${a(e)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total SKUs</span>
        <span class="text-xl font-extrabold text-slate-800 block mt-2">${c.length}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Low Stock Items</span>
        <span class="text-xl font-extrabold ${t>0?`text-rose-600`:`text-emerald-600`} block mt-2">${t}</span>
      </div>
    `}t()},document.addEventListener(`DOMContentLoaded`,async()=>{await r,window.renderAll()});