import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";var i=[{id:`BOM-001`,name:`Action Figure Assembly v1`,targetProductId:4,outputQuantity:1,status:`Active`,cost:1.05,materials:[{productId:1,quantity:.1,costPerUnit:2.5,totalCost:.25},{productId:3,quantity:2,costPerUnit:.4,totalCost:.8}]}];function a(){return e.boms||(e.boms=[...i],n()),e.boms}function o(){return Array.isArray(e.inventory)?e.inventory:[]}function s(e){return o().find(t=>t.id===Number(e))}function c(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function l(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function u(){let e=a().reduce((e,t)=>{let n=Number.parseInt(String(t.id||``).replace(/[^\d]/g,``),10);return Number.isFinite(n)?Math.max(e,n):e},0);return`BOM-${String(e+1).padStart(3,`0`)}`}window.showMainView=function(){document.getElementById(`bom-main-view`).classList.remove(`hidden`),document.getElementById(`bom-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`bom-main-view`).classList.add(`hidden`),document.getElementById(`bom-form-view`).classList.remove(`hidden`)},window.openBomModal=function(e=``){let n=document.getElementById(`bom-form`);if(n){if(n.reset(),document.getElementById(`bom-edit-id`).value=``,document.getElementById(`bom-form-title`).textContent=`Create Bill of Materials`,d(),document.getElementById(`bom-materials-body`).innerHTML=``,p(),e){let t=a().find(t=>t.id===e);t&&(document.getElementById(`bom-edit-id`).value=t.id,document.getElementById(`bom-form-title`).textContent=`Edit Bill of Materials`,document.getElementById(`bom-input-name`).value=t.name,document.getElementById(`bom-input-target-product`).value=t.targetProductId,document.getElementById(`bom-input-output-qty`).value=t.outputQuantity||1,document.getElementById(`bom-input-status`).value=t.status||`Active`,t.materials.forEach(e=>window.addMaterialRow(e.productId,e.quantity)))}else window.addMaterialRow();window.showFormView(),t()}};function d(){let e=document.getElementById(`bom-input-target-product`);if(!e)return;let t=[`Finished Goods`,`Semi-Finished Goods`];e.innerHTML=`<option value="">Select a Product</option>`+o().filter(e=>t.includes(e.productType)).map(e=>`<option value="${e.id}">${c(e.name)} (${c(e.sku)})</option>`).join(``)}function f(e=``){return`<option value="">Select Material...</option>`+o().map(t=>`<option value="${t.id}" ${t.id==e?`selected`:``}>${c(t.name)} (${c(t.sku)})</option>`).join(``)}window.addMaterialRow=function(e=``,n=1){let r=document.getElementById(`bom-materials-body`);if(!r)return;let i=document.createElement(`tr`);i.className=`material-row border-b border-slate-50 last:border-0`,i.innerHTML=`
    <td class="py-2 pr-4">
      <select class="material-product-select w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500" onchange="window.recalculateBomCost()">
        ${f(e)}
      </select>
    </td>
    <td class="py-2 px-4">
      <input type="number" min="0.001" step="any" value="${n}" class="material-qty-input w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 text-center" oninput="window.recalculateBomCost()">
    </td>
    <td class="py-2 px-4 text-right font-semibold text-slate-600 material-unit-cost">$0.00</td>
    <td class="py-2 pl-4 text-right font-bold text-slate-900 material-total-cost">$0.00</td>
    <td class="py-2 text-center">
      <button type="button" onclick="this.closest('tr').remove(); window.recalculateBomCost();" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </td>
  `,r.appendChild(i),window.recalculateBomCost(),t()},window.recalculateBomCost=function(){let e=document.querySelectorAll(`.material-row`),t=0;e.forEach(e=>{let n=e.querySelector(`.material-product-select`),r=e.querySelector(`.material-qty-input`),i=e.querySelector(`.material-unit-cost`),a=e.querySelector(`.material-total-cost`),o=n.value,c=Number(r.value)||0;if(o){let e=s(o),n=e?Number(e.cost||0):0,r=n*c;i.textContent=l(n),a.textContent=l(r),t+=r}else i.textContent=`$0.00`,a.textContent=`$0.00`}),p(t)};function p(e=0){let t=document.getElementById(`bom-total-cost`);t&&(t.textContent=l(e))}window.handleSubmit=function(e){e.preventDefault();let t=a(),r=document.getElementById(`bom-edit-id`).value,i=Number(document.getElementById(`bom-input-target-product`).value);if(!i){alert(`Please select a target product.`);return}let o=[],c=0,l=!1;if(document.querySelectorAll(`.material-row`).forEach(e=>{let t=Number(e.querySelector(`.material-product-select`).value),n=Number(e.querySelector(`.material-qty-input`).value)||0;if(t&&n>0){l=!0;let e=s(t),r=e?Number(e.cost||0):0,i=r*n;c+=i,o.push({productId:t,quantity:n,costPerUnit:r,totalCost:i})}}),!l){alert(`Please add at least one valid material with quantity > 0.`);return}let d={id:r||u(),name:document.getElementById(`bom-input-name`).value.trim(),targetProductId:i,outputQuantity:Number(document.getElementById(`bom-input-output-qty`).value)||1,status:document.getElementById(`bom-input-status`).value,cost:c,materials:o},f=t.findIndex(e=>e.id===d.id);f>=0?t[f]=d:t.push(d),n(),window.showMainView(),h()},window.renderTable=function(){let e=document.getElementById(`bom-table-body`);if(!e)return;let t=String(document.getElementById(`bom-search-input`)?.value||``).toLowerCase(),n=document.getElementById(`bom-filter-status`)?.value||`all`,r=a().filter(e=>{let r=s(e.targetProductId),i=r?r.name:``,a=!t||[e.id,e.name,i].join(` `).toLowerCase().includes(t),o=n===`all`||e.status===n;return a&&o});if(e.innerHTML=``,r.length===0){e.innerHTML=`<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 font-semibold">No BOMs found.</td></tr>`;return}r.forEach(t=>{let n=s(t.targetProductId),r=n?n.name:`Unknown Product`,i=`bg-slate-200 text-slate-600`;t.status===`Active`&&(i=`bg-emerald-50 text-emerald-600`),t.status===`Archived`&&(i=`bg-amber-50 text-amber-600`),e.innerHTML+=`
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${c(t.id)}</td>
        <td class="px-6 py-4 font-bold text-slate-900">${c(t.name)}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-700">${c(r)}</div>
          <div class="text-[10px] text-slate-400 font-semibold">Output: ${t.outputQuantity} unit(s)</div>
        </td>
        <td class="px-6 py-4 text-center font-semibold text-slate-900">${t.materials.length}</td>
        <td class="px-6 py-4 text-right font-bold text-slate-900">${l(t.cost)}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${i}">
            ${c(t.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.openBomModal('${t.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
        </td>
      </tr>
    `})};function m(){let e=document.getElementById(`bom-metrics`);if(!e)return;let t=a();e.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total BOMs</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${t.length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active BOMs</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${t.filter(e=>e.status===`Active`).length}</span>
    </div>
  `}function h(){m(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,h()});