import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.purchasesPayments||(e.purchasesPayments=[{id:`PP-001`,billRef:`BILL-2026-0001`,supplier:`Global Dye Chemicals`,method:`Bank Transfer`,txnRef:`TXN-99887766`,date:`2026-06-18`,amount:825,status:`Completed`,notes:`Paid in full.`},{id:`PP-002`,billRef:`BILL-2026-0012`,supplier:`Premium Yarns Ltd`,method:`Credit Card`,txnRef:`CC-442211`,date:`2026-06-20`,amount:1500,status:`Pending`,notes:`Awaiting clearing.`},{id:`PP-003`,billRef:`BILL-2026-0015`,supplier:`Machinery Spares Co`,method:`Cheque`,txnRef:`CHQ-00123`,date:`2026-06-22`,amount:5e3,status:`Failed`,notes:`Cheque bounced due to signature mismatch.`}],n()),e.purchasesPayments}window.showMainView=function(){document.getElementById(`purchases-payments-main-view`).classList.remove(`hidden`),document.getElementById(`purchases-payments-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`purchases-payments-main-view`).classList.add(`hidden`),document.getElementById(`purchases-payments-form-view`).classList.remove(`hidden`)},window.openPaymentModal=function(){let e=document.getElementById(`purchases-payments-form`);e&&e.reset();let t=document.getElementById(`purchases-payments-advanced-section`),n=document.getElementById(`purchases-payments-advanced-icon`);t&&!t.classList.contains(`hidden`)&&(t.classList.add(`hidden`),n&&(n.style.transform=`rotate(0deg)`));let r=document.getElementById(`payment-form-title`);r&&(r.textContent=`Create Payment`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`purchases-payments-advanced-section`),t=document.getElementById(`purchases-payments-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t&&(t.style.transform=`rotate(180deg)`)):(e.classList.add(`hidden`),t&&(t.style.transform=`rotate(0deg)`))},window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-bill-ref`).value,i=document.getElementById(`input-supp`).value,a=document.getElementById(`input-method`).value,s=parseFloat(document.getElementById(`input-amount`).value),l=document.getElementById(`input-date`).value,u=document.getElementById(`input-status`).value,d=document.getElementById(`input-txn-ref`).value,f=document.getElementById(`input-notes`).value,p={id:`PP-${String(100+t.length+1).slice(1)}`,billRef:r,supplier:i,method:a,amount:s,date:l,status:u,txnRef:d,notes:f};t.push(p),n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`purchases-payments-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`purchases-payments-search-input`)?.value.toLowerCase()||``,n=o().filter(e=>!t||Object.values(e).some(e=>String(e).toLowerCase().includes(t)));if(n.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.forEach(t=>{let n=`bg-slate-100 text-slate-600`;t.status===`Completed`&&(n=`bg-emerald-100 text-emerald-700`),t.status===`Pending`&&(n=`bg-amber-100 text-amber-700`),t.status===`Failed`&&(n=`bg-red-100 text-red-700`),e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${i(t.id)}</td>
        <td class="p-4 font-semibold text-blue-600 cursor-pointer hover:underline">${i(t.billRef)}</td>
        <td class="p-4">
          <div class="font-bold text-slate-800">${i(t.supplier)}</div>
        </td>
        <td class="p-4">
          <div class="font-medium text-slate-700">${i(t.method)}</div>
          <div class="text-[10px] text-slate-400">${i(t.txnRef||`-`)}</div>
        </td>
        <td class="p-4">${i(t.date)}</td>
        <td class="p-4 font-bold text-slate-900">${a(t.amount)}</td>
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
    `})};function s(){let e=o(),t=document.getElementById(`purchases-payments-metrics`);if(!t)return;let n=e.length,r=0,i=0;e.forEach(e=>{e.status===`Completed`&&(r+=e.amount),e.status===`Pending`&&i++});let s=e.filter(e=>e.status===`Completed`).length,c=s>0?r/s:0;t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Payments</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${n}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount Paid</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${a(r)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Payments</span>
      <span class="text-xl font-extrabold text-amber-500 block mt-2">${i}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg. Payment Size</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${a(c)}</span>
    </div>
  `}function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});