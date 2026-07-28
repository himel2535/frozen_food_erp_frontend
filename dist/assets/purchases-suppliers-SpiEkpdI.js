import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var a=null;function o(){return e.purchasesSuppliers||(e.purchasesSuppliers=[{id:`SUP-001`,name:`Apex Yarns Ltd`,contact:`John Apex`,email:`sales@apexyarns.com`,phone:`+880 1711-556677`,status:`Active`,terms:`Net 30`,lead:`7 Days`,rating:4.8,address:`Plot 42, Tejgaon I/A, Dhaka`,notes:`Primary supplier of cotton and composite yarns.`},{id:`SUP-002`,name:`Global Dye Chemicals`,contact:`Alice Green`,email:`contact@globaldyes.com`,phone:`+1 212-555-0199`,status:`Active`,terms:`Net 15`,lead:`3 Days`,rating:4.5,address:`740 Broadway, New York, NY 10003`,notes:`Eco-friendly dyes and organic raw pigments.`},{id:`SUP-003`,name:`Universal Silks Co`,contact:`Wang Wei`,email:`info@universalsilks.com`,phone:`+86 21 6248 1122`,status:`Inactive`,terms:`Due on Receipt`,lead:`15 Days`,rating:4.2,address:`888 Nanjing Road, Shanghai`,notes:`Premium mulberry silk and high-end textiles.`}],n()),e.purchasesSuppliers}window.showMainView=function(){document.getElementById(`purchases-suppliers-main-view`).classList.remove(`hidden`),document.getElementById(`purchases-suppliers-form-view`).classList.add(`hidden`),a=null},window.showFormView=function(){document.getElementById(`purchases-suppliers-main-view`).classList.add(`hidden`),document.getElementById(`purchases-suppliers-form-view`).classList.remove(`hidden`)},window.openSupplierModal=function(){a=null;let e=document.getElementById(`purchases-suppliers-form`);e&&e.reset(),document.getElementById(`supplier-form-title`).innerText=`Add Supplier`;let t=document.getElementById(`supplier-advanced-section`);t&&t.classList.add(`hidden`);let n=document.getElementById(`supplier-advanced-icon`);n&&(n.style.transform=`rotate(0deg)`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`supplier-advanced-section`),t=document.getElementById(`supplier-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t.style.transform=`rotate(180deg)`):(e.classList.add(`hidden`),t.style.transform=`rotate(0deg)`)},window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-supp-name`).value,i=document.getElementById(`input-supp-contact`).value,s=document.getElementById(`input-supp-phone`).value,l=document.getElementById(`input-supp-status`).value,u=document.getElementById(`input-supp-terms`).value,d=document.getElementById(`input-supp-lead`).value||`7 Days`,f=document.getElementById(`input-supp-email`).value,p=document.getElementById(`input-supp-rating`).value,m=p?parseFloat(p):5,h=document.getElementById(`input-supp-address`).value,g=document.getElementById(`input-supp-notes`).value;if(a){let e=t.find(e=>e.id===a);e&&(e.name=r,e.contact=i,e.phone=s,e.status=l,e.terms=u,e.lead=d,e.email=f,e.rating=m,e.address=h,e.notes=g)}else{let e=t.length>0?Math.max(...t.map(e=>Number(e.id.replace(`SUP-`,``))))+1:1,n={id:`SUP-${String(1e3+e).slice(1)}`,name:r,contact:i,phone:s,status:l,terms:u,lead:d,email:f,rating:m,address:h,notes:g};t.push(n)}n(),window.showMainView(),c()},window.editRecord=function(e){let t=o().find(t=>t.id===e);t&&(a=e,document.getElementById(`supplier-form-title`).innerText=`Edit Supplier: ${e}`,document.getElementById(`input-supp-name`).value=t.name,document.getElementById(`input-supp-contact`).value=t.contact,document.getElementById(`input-supp-phone`).value=t.phone,document.getElementById(`input-supp-status`).value=t.status,document.getElementById(`input-supp-terms`).value=t.terms,document.getElementById(`input-supp-lead`).value=t.lead,document.getElementById(`input-supp-email`).value=t.email||``,document.getElementById(`input-supp-rating`).value=t.rating||``,document.getElementById(`input-supp-address`).value=t.address||``,document.getElementById(`input-supp-notes`).value=t.notes||``,window.showFormView())},window.deleteRecord=function(e){let t=o(),r=t.findIndex(t=>t.id===e);r!==-1&&confirm(`Are you sure you want to remove supplier ${e}?`)&&(t.splice(r,1),n(),c())};function s(){let e=o(),t=document.getElementById(`purchases-suppliers-metrics`);if(!t)return;let n=e.length,r=e.filter(e=>e.status===`Active`).length,i=e.map(e=>parseInt(e.lead)||0).filter(Boolean),a=i.length>0?Math.round(i.reduce((e,t)=>e+t,0)/i.length):0,s=e.map(e=>parseFloat(e.rating)||0).filter(Boolean);t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Suppliers</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${n} listed</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Vendors</span>
      <span class="text-xl font-extrabold text-blue-600 block mt-2">${r} active</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Lead Time</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${a} Days</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supplier Health</span>
      <span class="text-xl font-extrabold text-indigo-600 block mt-2">${s.length>0?(s.reduce((e,t)=>e+t,0)/s.length).toFixed(1):`5.0`} ★</span>
    </div>
  `}window.renderTable=function(){let e=document.getElementById(`purchases-suppliers-body`);if(!e)return;e.innerHTML=``;let t=(document.getElementById(`purchases-suppliers-search-input`)?.value||``).toLowerCase(),n=document.getElementById(`filter-supplier-status`)?.value||`all`,r=document.getElementById(`filter-supplier-rating`)?.value||`all`,a=document.getElementById(`filter-supplier-terms`)?.value||`all`,s=o().filter(e=>{if(n!==`all`&&e.status!==n||a!==`all`&&e.terms!==a)return!1;if(r!==`all`){let t=parseFloat(r);if((e.rating||0)<t)return!1}return!(t&&!(e.id.toLowerCase().includes(t)||e.name.toLowerCase().includes(t)||(e.contact||``).toLowerCase().includes(t)||(e.phone||``).toLowerCase().includes(t)||(e.email||``).toLowerCase().includes(t)))});if(s.length===0){e.innerHTML=`<tr><td colspan="9" class="p-8 text-center text-slate-400 font-semibold">No suppliers found.</td></tr>`;return}s.forEach(t=>{let n=t.status===`Inactive`?`bg-rose-50 text-rose-700 border-rose-200`:`bg-emerald-50 text-emerald-700 border-emerald-200`;e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${i(t.id)}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-900">${i(t.name)}</div>
          ${t.email?`<div class="text-[10px] text-slate-400 font-medium">${i(t.email)}</div>`:``}
        </td>
        <td class="p-4 font-semibold text-slate-700">${i(t.contact)}</td>
        <td class="p-4 font-medium text-slate-600">${i(t.phone)}</td>
        <td class="p-4 text-center font-semibold text-slate-650">${i(t.lead)}</td>
        <td class="p-4 font-semibold text-slate-500">${i(t.terms)}</td>
        <td class="p-4 text-center font-bold text-indigo-600">${Number(t.rating||5).toFixed(1)} ★</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${n}">
            ${t.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            <button onclick="window.editRecord('${t.id}')" title="Edit Supplier" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deleteRecord('${t.id}')" title="Delete" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `})};function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});