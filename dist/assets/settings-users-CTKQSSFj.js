import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(){return e.users||(e.users=[{name:`John Doe`,email:`john.doe@hookerp.com`,role:`Admin`,status:`active`,lastLogin:`Jun 17, 2026 · 09:14 AM`,phone:`+1 (555) 019-9234`,jobTitle:`Chief Executive Officer`,department:`Executive`,bio:`Co-founder & CEO.`},{name:`Sarah Connor`,email:`sarah.c@hookerp.com`,role:`Admin`,status:`active`,lastLogin:`Jun 17, 2026 · 08:52 AM`,phone:`+1 (555) 018-8743`,jobTitle:`Chief Security Officer`,department:`Security`,bio:`Guarding systems.`},{name:`Ellen Ripley`,email:`ripley@hookerp.com`,role:`Manager`,status:`active`,lastLogin:`Jun 16, 2026 · 05:30 PM`,phone:`+1 (555) 017-7654`,jobTitle:`Warrant Officer`,department:`Operations`,bio:`Experienced dispatcher.`},{name:`Arthur Dent`,email:`dent@hookerp.com`,role:`Staff`,status:`on-leave`,lastLogin:`Jun 10, 2026 · 03:12 PM`,phone:`+1 (555) 012-3456`,jobTitle:`Hitchhiker Specialist`,department:`Logistics`,bio:`Always carries a towel.`}],n()),e.users}window.showMainView=function(){document.getElementById(`settings-users-main-view`).classList.remove(`hidden`),document.getElementById(`settings-users-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`settings-users-main-view`).classList.add(`hidden`),document.getElementById(`settings-users-form-view`).classList.remove(`hidden`)},window.openUserForm=function(e=null){let n=document.getElementById(`settings-users-form`);n&&n.reset();let r=document.getElementById(`user-form-title`),i=document.getElementById(`input-user-index`),o=document.getElementById(`settings-users-advanced-section`),s=document.getElementById(`settings-users-advanced-icon`);if(o&&o.classList.add(`hidden`),s&&(s.style.transform=`rotate(0deg)`,s.setAttribute(`data-lucide`,`chevron-down`)),e!==null){r&&(r.textContent=`Edit User`);let t=a()[e];i&&(i.value=e),document.getElementById(`input-name`).value=t.name||``,document.getElementById(`input-email`).value=t.email||``,document.getElementById(`input-role`).value=t.role||`Staff`,document.getElementById(`input-status`).value=t.status||`active`,document.getElementById(`input-phone`).value=t.phone||``,document.getElementById(`input-job-title`).value=t.jobTitle||``,document.getElementById(`input-department`).value=t.department||``,document.getElementById(`input-bio`).value=t.bio||``}else r&&(r.textContent=`Create User`),i&&(i.value=``);window.showFormView(),t()},window.toggleAdvancedFields=function(){let e=document.getElementById(`settings-users-advanced-section`),t=document.getElementById(`settings-users-advanced-icon`);e&&(e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t&&(t.style.transform=`rotate(180deg)`)):(e.classList.add(`hidden`),t&&(t.style.transform=`rotate(0deg)`)))},window.handleUserSubmit=function(e){e.preventDefault();let t=a(),r=document.getElementById(`input-user-index`).value,i={name:document.getElementById(`input-name`).value,email:document.getElementById(`input-email`).value,role:document.getElementById(`input-role`).value,status:document.getElementById(`input-status`).value,phone:document.getElementById(`input-phone`).value,jobTitle:document.getElementById(`input-job-title`).value,department:document.getElementById(`input-department`).value,bio:document.getElementById(`input-bio`).value,lastLogin:r===``?`Never`:t[r].lastLogin};r===``?t.push(i):t[r]=i,n(),window.showMainView(),s()},window.deleteUser=function(e){confirm(`Are you sure you want to delete user ${a()[e].name}?`)&&(a().splice(e,1),n(),s())},window.renderUsers=function(){let e=document.getElementById(`settings-users-tbody`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`settings-users-search`)?.value.toLowerCase()||``,n=a().map((e,t)=>({...e,originalIndex:t})).filter(e=>!t||e.name.toLowerCase().includes(t)||e.email.toLowerCase().includes(t)||e.role.toLowerCase().includes(t)||e.status.toLowerCase().includes(t));if(n.length===0){e.innerHTML=`<tr><td colspan="6" class="p-8 text-center text-slate-450">No users found matching search criteria.</td></tr>`;return}n.forEach(t=>{let n=`bg-slate-100 text-slate-600`;t.status===`active`&&(n=`bg-emerald-50 text-emerald-600`),t.status===`on-leave`&&(n=`bg-amber-50 text-amber-600`),t.status===`inactive`&&(n=`bg-slate-100 text-slate-400`),t.status===`pending`&&(n=`bg-blue-50 text-blue-600`);let r=t.role===`Admin`?`bg-purple-50 text-purple-600`:t.role===`Manager`?`bg-blue-50 text-blue-600`:t.role===`Staff`?`bg-emerald-50 text-emerald-600`:`bg-slate-150 text-slate-500`,a=t.name?t.name.split(` `).map(e=>e[0]).join(``).substring(0,2).toUpperCase():`U`;e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              ${i(a)}
            </div>
            <div>
              <span class="font-bold text-slate-900 block">${i(t.name)}</span>
              <span class="text-[10px] text-slate-400 block">${i(t.jobTitle||`No Title`)}</span>
            </div>
          </div>
        </td>
        <td class="p-4">${i(t.email||`—`)}</td>
        <td class="p-4"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${r}">${i(t.role)}</span></td>
        <td class="p-4"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${n}">${i(t.status)}</span></td>
        <td class="p-4 text-slate-400 font-medium">${i(t.lastLogin)}</td>
        <td class="p-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <button onclick="window.openUserForm(${t.originalIndex})" class="p-1.5 text-slate-450 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Edit User">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deleteUser(${t.originalIndex})" class="p-1.5 text-slate-450 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete User">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `})};function o(){let e=a(),t=document.getElementById(`settings-users-metrics`);t&&(t.innerHTML=`
    <div class="premium-card p-5 premium-shadow bg-white rounded-2xl border border-slate-200/80">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
        <div class="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><i data-lucide="users" class="w-4 h-4"></i></div>
      </div>
      <div class="mt-3">
        <span class="text-xl font-extrabold tracking-tight text-slate-900 block">${e.length}</span>
        <span class="text-[10px] text-slate-400 font-medium block mt-0.5">Active team credentials</span>
      </div>
    </div>
    <div class="premium-card p-5 premium-shadow bg-white rounded-2xl border border-slate-200/80">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Credentials</span>
        <div class="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="user" class="w-4 h-4"></i></div>
      </div>
      <div class="mt-3">
        <span class="text-xl font-extrabold tracking-tight text-slate-900 block">${e.filter(e=>e.status===`active`).length}</span>
        <span class="text-[10px] text-emerald-550 font-medium block mt-0.5">● Ready for operation</span>
      </div>
    </div>
    <div class="premium-card p-5 premium-shadow bg-white rounded-2xl border border-slate-200/80">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Invites</span>
        <div class="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><i data-lucide="mail" class="w-4 h-4"></i></div>
      </div>
      <div class="mt-3">
        <span class="text-xl font-extrabold tracking-tight text-slate-900 block">${e.filter(e=>e.status===`pending`).length}</span>
        <span class="text-[10px] text-amber-550 font-medium block mt-0.5">Awaiting setup completion</span>
      </div>
    </div>
    <div class="premium-card p-5 premium-shadow bg-white rounded-2xl border border-slate-200/80">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Defined Roles</span>
        <div class="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><i data-lucide="settings" class="w-4 h-4"></i></div>
      </div>
      <div class="mt-3">
        <span class="text-xl font-extrabold tracking-tight text-slate-900 block">${new Set(e.map(e=>e.role)).size}</span>
        <span class="text-[10px] text-slate-400 font-medium block mt-0.5">Access permission structures</span>
      </div>
    </div>
  `)}function s(){o(),window.renderUsers(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,s()});