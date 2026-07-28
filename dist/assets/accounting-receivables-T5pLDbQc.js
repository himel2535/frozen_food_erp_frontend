import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.accountingReceivables||(e.accountingReceivables=[{id:`REC-001`,invoiceRef:`INV-2026-0001`,customer:`Acme Corp`,dueDate:`2026-06-15`,totalAmount:5e3,balanceDue:0,status:`Paid`,method:`Bank Transfer`,refNo:`TXN-112233`,notes:`Paid in full.`},{id:`REC-002`,invoiceRef:`INV-2026-0004`,customer:`Globex Inc`,dueDate:`2026-06-10`,totalAmount:3200,balanceDue:3200,status:`Overdue`,method:``,refNo:``,notes:`Pending collection.`},{id:`REC-003`,invoiceRef:`INV-2026-0008`,customer:`Initech`,dueDate:`2026-06-25`,totalAmount:1500,balanceDue:750,status:`Partial`,method:`Credit Card`,refNo:`CC-8811`,notes:`Half paid upfront.`}],n()),e.accountingReceivables}window.showMainView=function(){document.getElementById(`accounting-receivables-main-view`).classList.remove(`hidden`),document.getElementById(`accounting-receivables-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`accounting-receivables-main-view`).classList.add(`hidden`),document.getElementById(`accounting-receivables-form-view`).classList.remove(`hidden`)},window.openReceivableModal=function(){let e=document.getElementById(`accounting-receivables-form`);e&&e.reset();let t=document.getElementById(`accounting-receivables-advanced-section`),n=document.getElementById(`accounting-receivables-advanced-icon`);t&&!t.classList.contains(`hidden`)&&(t.classList.add(`hidden`),n&&(n.style.transform=`rotate(0deg)`));let r=document.getElementById(`receivable-form-title`);r&&(r.textContent=`Receive Payment`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`accounting-receivables-advanced-section`),t=document.getElementById(`accounting-receivables-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t&&(t.style.transform=`rotate(180deg)`)):(e.classList.add(`hidden`),t&&(t.style.transform=`rotate(0deg)`))},window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-customer`).value,i=document.getElementById(`input-invoice`).value,a=parseFloat(document.getElementById(`input-amount`).value),s=document.getElementById(`input-date`).value,l=document.getElementById(`input-method`).value,u=document.getElementById(`input-ref-no`).value,d=document.getElementById(`input-notes`).value,f=t.find(e=>e.invoiceRef===i);if(f)f.balanceDue=Math.max(0,f.balanceDue-a),f.balanceDue===0?f.status=`Paid`:f.balanceDue<f.totalAmount&&(f.status=`Partial`),f.method=l,f.refNo=u,f.notes=d;else{let e={id:`REC-${String(100+t.length+1).slice(1)}`,invoiceRef:i,customer:r,dueDate:s,totalAmount:a,balanceDue:0,status:`Paid`,method:l,refNo:u,notes:d};t.push(e)}n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`accounting-receivables-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`accounting-receivables-search-input`)?.value.toLowerCase()||``,n=o().filter(e=>!t||Object.values(e).some(e=>String(e).toLowerCase().includes(t)));if(n.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.forEach(t=>{let n=`bg-slate-100 text-slate-600`;t.status===`Paid`&&(n=`bg-emerald-100 text-emerald-700`),t.status===`Partial`&&(n=`bg-blue-100 text-blue-700`),(t.status===`Open`||t.status===`Overdue`)&&(n=`bg-red-100 text-red-700`),e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900 cursor-pointer hover:text-blue-600 hover:underline">${i(t.invoiceRef)}</td>
        <td class="p-4 font-semibold text-slate-800">${i(t.customer)}</td>
        <td class="p-4">${i(t.dueDate)}</td>
        <td class="p-4">${a(t.totalAmount)}</td>
        <td class="p-4 font-bold ${t.balanceDue>0?`text-rose-600`:`text-slate-500`}">${a(t.balanceDue)}</td>
        <td class="p-4">
          <span class="px-2 py-1 rounded-md text-[10px] font-bold ${n}">
            ${i(t.status)}
          </span>
        </td>
        <td class="p-4 text-right">
          <button class="text-blue-600 hover:text-blue-800 p-1 cursor-pointer transition-colors" title="Edit">
            <i data-lucide="edit-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `})};function s(){let e=o(),t=document.getElementById(`accounting-receivables-metrics`);if(!t)return;let n=0,r=0,i=0,s=new Date().toISOString().split(`T`)[0];e.forEach(e=>{n+=e.balanceDue,e.dueDate<s&&e.balanceDue>0&&(r+=e.balanceDue),i+=e.totalAmount-e.balanceDue}),t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding</span>
      <span class="text-xl font-extrabold text-blue-600 block mt-2">${a(n)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Amount</span>
      <span class="text-xl font-extrabold text-rose-600 block mt-2">${a(r)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Collected</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${a(i)}</span>
    </div>
  `}function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});