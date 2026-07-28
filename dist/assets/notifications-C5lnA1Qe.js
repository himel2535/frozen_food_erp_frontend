import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(){return Array.isArray(e.inventory)?e.inventory:[]}function a(){let e=[];return i().forEach(t=>{(t.stock||0)<50&&e.push({id:`NOTIF-INV-${t.id}`,type:`Inventory`,title:`Low Stock Alert`,message:`${t.name} (${t.sku}) is running low on stock. Current stock: ${t.stock}.`,time:`Just now`,read:!1,actionUrl:`/inventory-products.html`})}),e.push({id:`NOTIF-PAY-1`,type:`Payment`,title:`Payment Due`,message:`Supplier invoice #INV-992 from PolyPlastics Co. is due tomorrow ($14,500).`,time:`2 hours ago`,read:!1,actionUrl:`/accounting-payables.html`}),e.push({id:`NOTIF-SYS-1`,type:`System`,title:`Maintenance Reminder`,message:`Injection Molding Machine A1 requires monthly calibration.`,time:`1 day ago`,read:!0,actionUrl:`/manufacturing-machine-maintenance.html`}),e}function o(){return e.readNotifications||(e.readNotifications=[],n()),e.readNotifications}window.renderNotifications=function(){let e=document.getElementById(`notifications-list`);if(!e)return;let t=document.getElementById(`notifications-filter-type`)?.value||`all`,n=o(),r=a();if(r=r.map(e=>({...e,read:e.read||n.includes(e.id)})),t!==`all`&&(r=r.filter(e=>e.type===t)),e.innerHTML=``,r.length===0){e.innerHTML=`<div class="p-8 text-center text-slate-400 font-semibold">No notifications found.</div>`;return}r.forEach(t=>{let n=`info`,r=`text-blue-500`,i=`bg-blue-50`;t.type===`Inventory`?(n=`alert-triangle`,r=`text-rose-500`,i=`bg-rose-50`):t.type===`Payment`?(n=`dollar-sign`,r=`text-amber-500`,i=`bg-amber-50`):t.type===`System`&&(n=`settings`,r=`text-slate-500`,i=`bg-slate-100`);let a=t.read?``:`<div class="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0"></div>`,o=t.read?`bg-white`:`bg-slate-50/70`;e.innerHTML+=`
      <div class="p-5 flex items-start gap-4 transition-colors ${o}">
        <div class="w-10 h-10 rounded-full ${i} flex items-center justify-center shrink-0">
          <i data-lucide="${n}" class="w-5 h-5 ${r}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-sm font-bold text-slate-900 truncate ${t.read?`opacity-70`:``}">${c(t.title)}</h4>
            <span class="text-[10px] font-semibold text-slate-400 shrink-0">${t.time}</span>
          </div>
          <p class="text-xs text-slate-600 mt-1 ${t.read?`opacity-70`:``}">${c(t.message)}</p>
          <div class="mt-2">
            <a href="${t.actionUrl}" class="text-[11px] font-bold text-blue-600 hover:underline">View Details &rarr;</a>
          </div>
        </div>
        ${a}
      </div>
    `}),s()},window.markAllAsRead=function(){let e=o();a().forEach(t=>{!t.read&&!e.includes(t.id)&&e.push(t.id)}),n(),window.renderNotifications()};function s(){let e=document.getElementById(`header-notification-dot`);if(!e)return;let t=o();a().filter(e=>!e.read&&!t.includes(e.id)).length>0?e.classList.remove(`hidden`):e.classList.add(`hidden`)}function c(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}document.addEventListener(`DOMContentLoaded`,async()=>{await r,window.renderNotifications(),t()});