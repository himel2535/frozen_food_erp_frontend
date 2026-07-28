import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.payrollSlips||(e.payrollSlips=[{id:`SLP-202605-001`,employee:`Sarah Jenkins`,period:`2026-05`,gross:6500,deductions:1200,net:5300,status:`Paid`,method:`Bank Transfer`,txnId:`TXN-99001`,remarks:`May salary disbursed.`},{id:`SLP-202605-002`,employee:`David Chen`,period:`2026-05`,gross:4200,deductions:500,net:3700,status:`Paid`,method:`Bank Transfer`,txnId:`TXN-99002`,remarks:`May salary disbursed.`},{id:`SLP-202606-001`,employee:`Emily Stone`,period:`2026-06`,gross:8e3,deductions:1500,net:6500,status:`Pending`,method:``,txnId:``,remarks:`Pending release.`}],n()),e.payrollSlips}window.showMainView=function(){document.getElementById(`payroll-slips-main-view`).classList.remove(`hidden`),document.getElementById(`payroll-slips-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`payroll-slips-main-view`).classList.add(`hidden`),document.getElementById(`payroll-slips-form-view`).classList.remove(`hidden`)},window.openSlipModal=function(){let e=document.getElementById(`payroll-slips-form`);e&&e.reset();let t=document.getElementById(`payroll-slips-advanced-section`),n=document.getElementById(`payroll-slips-advanced-icon`);t&&!t.classList.contains(`hidden`)&&(t.classList.add(`hidden`),n&&(n.style.transform=`rotate(0deg)`));let r=document.getElementById(`slip-form-title`);r&&(r.textContent=`Create Manual Payslip`),document.getElementById(`input-net`).value=`0.00`,window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`payroll-slips-advanced-section`),t=document.getElementById(`payroll-slips-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t&&(t.style.transform=`rotate(180deg)`)):(e.classList.add(`hidden`),t&&(t.style.transform=`rotate(0deg)`))},window.calculateNet=function(){let e=parseFloat(document.getElementById(`input-gross`).value)||0,t=parseFloat(document.getElementById(`input-deductions`).value)||0,n=Math.max(0,e-t);document.getElementById(`input-net`).value=n.toFixed(2)},window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-employee`).value,i=document.getElementById(`input-period`).value,a=parseFloat(document.getElementById(`input-gross`).value)||0,s=parseFloat(document.getElementById(`input-deductions`).value)||0,l=Math.max(0,a-s),u=document.getElementById(`input-method`).value,d=document.getElementById(`input-txn-id`).value,f=document.getElementById(`input-remarks`).value,p={id:`SLP-${i.replace(`-`,``)}-${String(100+t.length+1).slice(1)}`,employee:r,period:i,gross:a,deductions:s,net:l,status:d?`Paid`:`Pending`,method:u,txnId:d,remarks:f};t.push(p),n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`payroll-slips-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`payroll-slips-search-input`)?.value.toLowerCase()||``,n=o().filter(e=>!t||e.id.toLowerCase().includes(t)||e.employee.toLowerCase().includes(t));if(n.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.sort((e,t)=>t.id.localeCompare(e.id)),n.forEach(t=>{let n=`bg-slate-100 text-slate-600`;t.status===`Paid`&&(n=`bg-emerald-100 text-emerald-700`),t.status===`Pending`&&(n=`bg-amber-100 text-amber-700`),e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900 cursor-pointer hover:text-blue-600 hover:underline">${i(t.id)}</td>
        <td class="p-4 font-semibold text-slate-800">${i(t.employee)}</td>
        <td class="p-4">${i(t.period)}</td>
        <td class="p-4 text-slate-600">${a(t.gross)}</td>
        <td class="p-4 text-rose-600">-${a(t.deductions)}</td>
        <td class="p-4 font-bold text-blue-600">${a(t.net)}</td>
        <td class="p-4">
          <span class="px-2 py-1 rounded-md text-[10px] font-bold ${n}">
            ${i(t.status)}
          </span>
        </td>
        <td class="p-4 text-right">
          <button class="text-blue-600 hover:text-blue-800 p-1 cursor-pointer transition-colors" title="Download PDF">
            <i data-lucide="download" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `})};function s(){let e=o(),t=document.getElementById(`payroll-slips-metrics`);if(!t)return;let n=e.length,r=new Date().toISOString().slice(0,7),i=0;e.forEach(e=>{e.period===r&&e.status===`Paid`&&(i+=e.net)}),t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Slips Generated</span>
      <span class="text-xl font-extrabold text-slate-800 block mt-2">${n}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Disbursed This Month</span>
      <span class="text-xl font-extrabold text-blue-600 block mt-2">${a(i)}</span>
    </div>
  `}function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});