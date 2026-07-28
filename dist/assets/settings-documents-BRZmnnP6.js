import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";var i=[];function a(){return e.documents||(e.documents=[...i],n()),e.documents}function o(){return Array.isArray(e.inventory)?e.inventory:[]}function s(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function c(){let e=a().reduce((e,t)=>{let n=Number.parseInt(String(t.id||``).replace(/[^\d]/g,``),10);return Number.isFinite(n)?Math.max(e,n):e},0);return`DOC-${String(e+1).padStart(3,`0`)}`}window.showMainView=function(){document.getElementById(`docs-main-view`).classList.remove(`hidden`),document.getElementById(`docs-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`docs-main-view`).classList.add(`hidden`),document.getElementById(`docs-form-view`).classList.remove(`hidden`)},window.openDocModal=function(e=``){let n=document.getElementById(`docs-form`);if(n){if(n.reset(),document.getElementById(`docs-edit-id`).value=``,document.getElementById(`docs-form-title`).textContent=`Upload Document`,document.getElementById(`docs-file-name`).classList.add(`hidden`),l(),e){let t=a().find(t=>t.id===e);t&&(document.getElementById(`docs-edit-id`).value=t.id,document.getElementById(`docs-form-title`).textContent=`Edit Document`,document.getElementById(`docs-input-title`).value=t.title||``,document.getElementById(`docs-input-category`).value=t.category||`SOP`,document.getElementById(`docs-input-version`).value=t.version||`v1.0`,document.getElementById(`docs-input-product`).value=t.productId||``,document.getElementById(`docs-input-desc`).value=t.description||``,t.filename&&(document.getElementById(`docs-file-name`).textContent=`Current File: ${t.filename}`,document.getElementById(`docs-file-name`).classList.remove(`hidden`)))}window.showFormView(),t()}};function l(){let e=document.getElementById(`docs-input-product`);e.innerHTML=`<option value="">None / General</option>`+o().map(e=>`<option value="${e.id}">${s(e.name)} (${s(e.sku)})</option>`).join(``)}document.addEventListener(`DOMContentLoaded`,()=>{let e=document.getElementById(`docs-input-file`);e&&e.addEventListener(`change`,e=>{let t=document.getElementById(`docs-file-name`);e.target.files&&e.target.files[0]&&(t.textContent=`Selected: ${e.target.files[0].name}`,t.classList.remove(`hidden`))})}),window.handleSubmit=function(e){e.preventDefault();let t=a(),r=document.getElementById(`docs-edit-id`).value,i=document.getElementById(`docs-input-file`),o=``;if(i&&i.files&&i.files[0])o=i.files[0].name;else if(r){let e=t.find(e=>e.id===r);e&&(o=e.filename)}else o=`uploaded_document.pdf`;let s={id:r||c(),title:document.getElementById(`docs-input-title`).value.trim(),category:document.getElementById(`docs-input-category`).value,version:document.getElementById(`docs-input-version`).value.trim(),productId:document.getElementById(`docs-input-product`).value,description:document.getElementById(`docs-input-desc`).value.trim(),filename:o,uploadDate:new Date().toISOString().split(`T`)[0]},l=t.findIndex(e=>e.id===s.id);l>=0?(s.uploadDate=t[l].uploadDate,t[l]=s):t.push(s),n(),window.showMainView(),d()},window.renderTable=function(){let e=document.getElementById(`docs-table-body`);if(!e)return;let t=String(document.getElementById(`docs-search-input`)?.value||``).toLowerCase(),n=document.getElementById(`docs-filter-category`)?.value||`all`,r=a().filter(e=>{let r=[e.title,e.description,e.filename].join(` `).toLowerCase(),i=!t||r.includes(t),a=n===`all`||e.category===n;return i&&a});if(e.innerHTML=``,r.length===0){e.innerHTML=`<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 font-semibold">No documents found.</td></tr>`;return}r.forEach(t=>{let n=`General`;if(t.productId){let e=o().find(e=>String(e.id)===String(t.productId));e&&(n=e.name)}let r=`bg-slate-100 text-slate-600`;t.category===`SOP`&&(r=`bg-blue-50 text-blue-600`),t.category===`Product Drawing`&&(r=`bg-purple-50 text-purple-600`),t.category===`Quality Standard`&&(r=`bg-emerald-50 text-emerald-600`),e.innerHTML+=`
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4">
          <div class="font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-2">
            <i data-lucide="file" class="w-3.5 h-3.5"></i> ${s(t.title)}
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">${s(t.filename)}</div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${r}">
            ${s(t.category)}
          </span>
        </td>
        <td class="px-6 py-4">
          <div class="font-semibold text-slate-700 text-xs">${s(n)}</div>
        </td>
        <td class="px-6 py-4 text-[11px] font-semibold text-slate-600">${s(t.uploadDate)}</td>
        <td class="px-6 py-4 text-center">
          <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">${s(t.version)}</span>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.openDocModal('${t.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
        </td>
      </tr>
    `})};function u(){let e=document.getElementById(`docs-metrics`);if(!e)return;let t=a(),n=t.filter(e=>e.category===`SOP`).length,r=t.filter(e=>e.category===`Product Drawing`).length;e.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Documents</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${t.length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 premium-shadow bg-blue-50/20">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">SOPs</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${n}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-purple-200 premium-shadow bg-purple-50/20">
      <span class="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Drawings / CAD</span>
      <span class="text-xl font-extrabold text-purple-700 block mt-2">${r}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-indigo-200 premium-shadow bg-indigo-50/20">
      <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Active Versions</span>
      <span class="text-xl font-extrabold text-indigo-700 block mt-2">${t.length}</span>
    </div>
  `}function d(){u(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,d()});