import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{D as e,N as t,a as n,n as r,o as i,s as a,t as o}from"./shared-Det_SasC.js";function s(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function c(e,t,n=`w-4 h-4`){return`<img src="/images/icons/actions/${e}" alt="${s(t)}" class="${n} object-contain pointer-events-none" />`}function l(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function u(e){if(!e)return`—`;let t=new Date(`${e}T00:00:00`);return Number.isNaN(t.getTime())?e:t.toLocaleDateString(`en-GB`,{day:`numeric`,month:`long`,year:`numeric`})}function d(){return new Date().toISOString().slice(0,10)}function f(e){return Number(e?.deliveryQty??e?.shippedQty??0)}function p(e){return e===`partially`||e===`partial`?`partial`:e===`delivered`||e===`completed`?`delivered`:e===`pending`?`pending`:e||`pending`}var m=`all`,h=[{id:`SO-2026-0001`,customerId:1,customerName:`Bell Labs`,date:`2026-06-18`,total:12990,deliveryStatus:`partial`,status:`confirmed`,items:[{productId:`4`,name:`Super Hero Action Figure`,quantity:1e3,price:12.99,total:12990}]},{id:`SO-2026-0002`,customerId:3,customerName:`General Electric`,date:`2026-06-19`,total:500,deliveryStatus:`pending`,status:`confirmed`,items:[{productId:`3`,name:`Action Figure Arms`,quantity:500,price:1,total:500}]},{id:`SO-2026-0003`,customerId:2,customerName:`ABC Traders`,date:`2026-07-10`,total:8294,deliveryStatus:`pending`,status:`confirmed`,items:[{productId:`4`,name:`Super Hero Action Figure`,quantity:600,price:12.99,total:7794},{productId:`3`,name:`Action Figure Arms`,quantity:500,price:1,total:500}]},{id:`SO-2026-0004`,customerId:4,customerName:`Rainbow Toys`,date:`2026-07-12`,total:10392,deliveryStatus:`partial`,status:`confirmed`,items:[{productId:`4`,name:`Super Hero Action Figure`,quantity:800,price:12.99,total:10392}]},{id:`SO-2026-0005`,customerId:5,customerName:`Kids World`,date:`2026-07-05`,total:1200,deliveryStatus:`delivered`,status:`completed`,items:[{productId:`3`,name:`Action Figure Arms`,quantity:1200,price:1,total:1200}]}],g=[{id:`DC-000001`,orderId:`SO-2026-0001`,customerId:1,customerName:`Bell Labs`,date:`2026-06-20`,warehouse:`Central Hub`,value:3897,trackingNumber:``,vehicleNumber:`DHAKA-METRO-GA-9922`,driverName:`Robert Khan`,driverMobile:`01711-111111`,deliveryMethod:`Own Vehicle`,deliveryLocation:`Gulshan-2, Dhaka`,contactPerson:`Alexander Graham`,contactNumber:`01711-100100`,notes:`Unload at warehouse gate. Handle toys carefully.`,status:`delivered`,items:[{productId:`4`,name:`Super Hero Action Figure`,orderedQty:1e3,previousQty:0,deliveryQty:300,remainingQty:700,price:12.99}]},{id:`DC-000002`,orderId:`SO-2026-0002`,customerId:3,customerName:`General Electric`,date:`2026-06-19`,warehouse:`Central Hub`,value:500,trackingNumber:`TRK5432109`,vehicleNumber:`DHAKA-METRO-T-5511`,driverName:`Rahim Uddin`,driverMobile:`01722-222222`,deliveryMethod:`Courier`,deliveryLocation:`Agrabad, Chittagong`,contactPerson:`Thomas Edison`,contactNumber:`01812-200200`,notes:`Fragile parts — keep upright.`,status:`draft`,items:[{productId:`3`,name:`Action Figure Arms`,orderedQty:500,previousQty:0,deliveryQty:500,remainingQty:0,price:1}]},{id:`DC-000003`,orderId:`SO-2026-0001`,customerId:1,customerName:`Bell Labs`,date:`2026-07-08`,warehouse:`Central Hub`,value:5196,trackingNumber:``,vehicleNumber:`DHAKA-METRO-GA-9922`,driverName:`Robert Khan`,driverMobile:`01711-111111`,deliveryMethod:`Own Vehicle`,deliveryLocation:`Gulshan-2, Dhaka`,contactPerson:`Alexander Graham`,contactNumber:`01711-100100`,notes:`Second partial shipment for remaining action figures.`,status:`delivered`,items:[{productId:`4`,name:`Super Hero Action Figure`,orderedQty:1e3,previousQty:300,deliveryQty:400,remainingQty:300,price:12.99}]},{id:`DC-000004`,orderId:`SO-2026-0003`,customerId:2,customerName:`ABC Traders`,date:`2026-07-18`,warehouse:`Central Hub`,value:5196,trackingNumber:``,vehicleNumber:`DHAKA-METRO-KA-3344`,driverName:`Karim Hossain`,driverMobile:`01733-333333`,deliveryMethod:`Own Vehicle`,deliveryLocation:`Mirpur-10, Dhaka`,contactPerson:`Hasan Ali`,contactNumber:`01911-300300`,notes:`First delivery planned — confirm gate pass before unload.`,status:`draft`,items:[{productId:`4`,name:`Super Hero Action Figure`,orderedQty:600,previousQty:0,deliveryQty:400,remainingQty:200,price:12.99},{productId:`3`,name:`Action Figure Arms`,orderedQty:500,previousQty:0,deliveryQty:0,remainingQty:500,price:1}]},{id:`DC-000005`,orderId:`SO-2026-0004`,customerId:4,customerName:`Rainbow Toys`,date:`2026-07-15`,warehouse:`Central Hub`,value:2598,trackingNumber:`TRK7788123`,vehicleNumber:`CTG-GA-7788`,driverName:`Salma Begum`,driverMobile:`01744-444444`,deliveryMethod:`Courier`,deliveryLocation:`GEC Circle, Chittagong`,contactPerson:`Nusrat Jahan`,contactNumber:`01611-400400`,notes:`Partial delivery — remaining qty next week.`,status:`delivered`,items:[{productId:`4`,name:`Super Hero Action Figure`,orderedQty:800,previousQty:0,deliveryQty:200,remainingQty:600,price:12.99}]},{id:`DC-000006`,orderId:`SO-2026-0003`,customerId:2,customerName:`ABC Traders`,date:`2026-07-12`,warehouse:`Central Hub`,value:1299,trackingNumber:``,vehicleNumber:`DHAKA-METRO-KA-3344`,driverName:`Karim Hossain`,driverMobile:`01733-333333`,deliveryMethod:`Own Vehicle`,deliveryLocation:`Mirpur-10, Dhaka`,contactPerson:`Hasan Ali`,contactNumber:`01911-300300`,notes:`Cancelled — customer requested reschedule.`,status:`cancelled`,items:[{productId:`4`,name:`Super Hero Action Figure`,orderedQty:600,previousQty:0,deliveryQty:100,remainingQty:500,price:12.99}]},{id:`DC-000007`,orderId:`SO-2026-0005`,customerId:5,customerName:`Kids World`,date:`2026-07-07`,warehouse:`Central Hub`,value:1200,trackingNumber:``,vehicleNumber:`DHAKA-METRO-CHA-1122`,driverName:`Jamal Ahmed`,driverMobile:`01755-555555`,deliveryMethod:`Customer Pickup`,deliveryLocation:`Uttara Sector-7, Dhaka`,contactPerson:`Rina Akter`,contactNumber:`01511-500500`,notes:`Full delivery — customer picked up from factory gate.`,status:`delivered`,items:[{productId:`3`,name:`Action Figure Arms`,orderedQty:1200,previousQty:0,deliveryQty:1200,remainingQty:0,price:1}]}];function _(){return(!Array.isArray(r.salesDeliveries)||!r._deliveryChallanSeededV2)&&(r.salesDeliveries=g.map(e=>({...e,items:(e.items||[]).map(e=>({...e}))})),r._deliveryChallanSeededV2=!0,a()),r.salesDeliveries.forEach(e=>{[`draft`,`delivered`,`cancelled`].includes(e.status)||(e.status=e.status===`delivered`?`delivered`:`draft`),(e.items||[]).forEach(e=>{e.deliveryQty==null&&e.shippedQty!=null&&(e.deliveryQty=e.shippedQty)})}),r.salesDeliveries}function v(){return(!Array.isArray(r.salesOrders)||!r._deliveryOrdersSeededV2)&&(r.salesOrders=h.map(e=>({...e,items:(e.items||[]).map(e=>({...e}))})),r._deliveryOrdersSeededV2=!0,a()),r.salesOrders.forEach(e=>{e.deliveryStatus===`partially`&&(e.deliveryStatus=`partial`)}),r.salesOrders}function y(){return n()}function b(){return e(r),t(r)}function x(){let e=r.companyConfig||{};return{name:e.name||`TOYS FACTORY`,address:e.address||``,phone:e.phone||``,email:e.email||``}}function S(){let e=_(),t=0;return e.forEach(e=>{let n=String(e.id||``).match(/DC-(\d+)/i);n&&(t=Math.max(t,parseInt(n[1],10)))}),`DC-${String(t+1).padStart(6,`0`)}`}function C(e,t){return _().filter(t=>t.orderId===e&&t.status===`delivered`).reduce((e,n)=>{let r=(n.items||[]).find(e=>String(e.productId)===String(t));return e+(r?f(r):0)},0)}function w(e){let t=(Array.isArray(r.inventory)?r.inventory:[]).find(t=>String(t.id)===String(e)||String(t.sku)===String(e));return{sku:t?.sku||String(e||`—`),uom:String(t?.uom||`PCS`).toUpperCase()}}function T(e){return(Array.isArray(r.inventory)?r.inventory:[]).find(t=>String(t.id)===String(e)||String(t.sku)===String(e))}function E(e,t){let n=T(e);if(!n)return 0;let r=y().find(e=>e.name===t||e.id===t);return r&&n.warehouseStock&&n.warehouseStock[r.id]!=null?Number(n.warehouseStock[r.id]||0):Number(n.stock||0)}function D(e,t){return e<=0?`text-rose-600`:e<t?`text-amber-600`:`text-emerald-600`}function O(e){let t=v().find(t=>t.id===e);if(!t)return{lines:[],orderQty:0,deliveredQty:0,remainingQty:0};let n=(t.items||[]).map(t=>{let n=Number(t.quantity||0),r=C(e,t.productId),i=Math.max(0,n-r);return{productId:t.productId,name:t.name,orderQty:n,deliveredQty:r,remainingQty:i}});return{lines:n,orderQty:n.reduce((e,t)=>e+t.orderQty,0),deliveredQty:n.reduce((e,t)=>e+t.deliveredQty,0),remainingQty:n.reduce((e,t)=>e+t.remainingQty,0)}}function k(e){let t=v().find(t=>t.id===e);if(!t)return;let n=O(e);n.remainingQty<=0&&n.orderQty>0?(t.deliveryStatus=`delivered`,t.status=`completed`):n.deliveredQty>0?t.deliveryStatus=`partial`:t.deliveryStatus=`pending`}function A(e,t,n){let r=T(e);if(!r||n<=0)return;r.stock=Math.max(0,Number(r.stock||0)-n);let i=y().find(e=>e.name===t||e.id===t);if(i&&r.warehouseStock){let e=Number(r.warehouseStock[i.id]||0);r.warehouseStock[i.id]=Math.max(0,e-n)}}function j(e,t){let n=document.getElementById(`input-order-ref`);n&&(n.innerHTML=`<option value="">Select Sales Order</option>`,v().forEach(r=>{if(p(r.deliveryStatus)!==`delivered`||r.id===t){let t=r.id===e?` selected`:``;n.innerHTML+=`<option value="${r.id}"${t}>${s(r.id)} (${s(r.customerName)})</option>`}}))}function M(e){let t=document.getElementById(`input-warehouse`);t&&(t.innerHTML=`<option value="">Select Warehouse</option>`,y().forEach(n=>{let r=n.name===e?` selected`:``;t.innerHTML+=`<option value="${s(n.name)}"${r}>${s(n.name)} (${s(n.location)})</option>`}))}function N(e,t){let n=document.getElementById(`delivery-form-header`);n&&(n.setAttribute(`title`,e),t&&n.setAttribute(`subtitle`,t))}function P(e,t){let n=document.getElementById(`delivery-form-items-body`),r=v().find(t=>t.id===e);if(!r)return;let i=document.getElementById(`input-warehouse`)?.value||``,a=r.items||[];if(a.length===0){n.innerHTML=`<tr><td colspan="6" class="p-4 text-center text-slate-400 font-medium">This order has no items.</td></tr>`;return}let o={};(t||[]).forEach(e=>{o[String(e.productId)]=f(e)}),n.innerHTML=``,a.forEach(t=>{let r=C(e,t.productId),a=Number(t.quantity||0),c=Math.max(0,a-r),l=E(t.productId,i),u=o[String(t.productId)]==null?c:Math.min(o[String(t.productId)],c),d=Math.max(0,c-u);n.innerHTML+=`
      <tr class="border-b border-slate-100 items-row"
          data-product-id="${s(t.productId)}"
          data-product-name="${s(t.name)}"
          data-price="${t.price||0}"
          data-order-qty="${a}"
          data-previous-qty="${r}"
          data-remaining-limit="${c}">
        <td class="p-3">
          <p class="font-bold text-slate-900">${s(t.name)}</p>
        </td>
        <td class="p-3 text-center font-bold text-slate-500">${a}</td>
        <td class="p-3 text-center font-bold text-slate-500">${r}</td>
        <td class="p-3 text-center font-bold text-slate-400 remaining-qty-label">${d}</td>
        <td class="p-3 text-center font-bold stock-qty-label ${D(l,c)}">${l}</td>
        <td class="p-3 text-center">
          <input type="number" min="0" max="${c}" value="${u}"
            class="w-24 px-2 py-1 rounded-lg border border-slate-200 text-center font-bold focus:outline-none focus:border-blue-500 delivery-qty-input cursor-text"
            oninput="window.handleDeliveryQtyChange(this)">
        </td>
      </tr>
    `})}window.showMainView=function(){document.getElementById(`sales-deliveries-main-view`).classList.remove(`hidden`),document.getElementById(`sales-deliveries-form-view`).classList.add(`hidden`),document.getElementById(`sales-deliveries-detail-view`).classList.add(`hidden`),V()},window.showFormView=function(){document.getElementById(`sales-deliveries-main-view`).classList.add(`hidden`),document.getElementById(`sales-deliveries-form-view`).classList.remove(`hidden`),document.getElementById(`sales-deliveries-detail-view`).classList.add(`hidden`)},window.showDetailView=function(e){document.getElementById(`sales-deliveries-main-view`).classList.add(`hidden`),document.getElementById(`sales-deliveries-form-view`).classList.add(`hidden`),document.getElementById(`sales-deliveries-detail-view`).classList.remove(`hidden`),L(e)},window.toggleAdvancedFields=function(){let e=document.getElementById(`sales-deliveries-advanced-section`),t=document.getElementById(`sales-deliveries-advanced-icon`);if(!e||!t)return;let n=e.classList.contains(`hidden`);e.classList.toggle(`hidden`,!n),t.style.transform=n?`rotate(180deg)`:`rotate(0deg)`},window.toggleMoreFilters=function(){let e=document.getElementById(`more-filters-panel`),t=document.getElementById(`more-filters-icon`);if(!e)return;let n=e.classList.contains(`hidden`);e.classList.toggle(`hidden`,!n),t&&(t.style.transform=n?`rotate(180deg)`:`rotate(0deg)`),i()},window.setQuickFilter=function(e){if(m=e||`all`,document.querySelectorAll(`.quick-chip`).forEach(e=>{e.className=e.getAttribute(`data-quick`)===m?`quick-chip px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-500 bg-blue-50 text-blue-700 cursor-pointer`:`quick-chip px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer`}),e===`draft`){let e=document.getElementById(`filter-status`);e&&(e.value=`draft`)}else document.getElementById(`filter-status`)?.value===`draft`&&e!==`draft`&&(document.getElementById(`filter-status`).value=`all`);window.renderTable()},window.openDeliveriesModal=function(e){let t=document.getElementById(`sales-deliveries-form`);t&&t.reset(),document.getElementById(`input-challan-edit-id`).value=``,document.getElementById(`input-challan-no`).value=S(),document.getElementById(`input-date`).value=d(),N(`Create Delivery Challan`,`Select sales order and delivery quantities.`);let n=document.getElementById(`sales-deliveries-advanced-section`),r=document.getElementById(`sales-deliveries-advanced-icon`);n&&n.classList.add(`hidden`),r&&(r.style.transform=`rotate(0deg)`),document.getElementById(`delivery-form-items-body`).innerHTML=`
    <tr>
      <td colspan="6" class="p-4 text-center text-slate-400 font-medium">Select a Sales Order to load items.</td>
    </tr>
  `,j(e||``),M(``),window.showFormView(),i(),e&&(document.getElementById(`input-order-ref`).value=e,window.handleOrderSelectionChange())},window.editDraftChallan=function(e){let t=_().find(t=>t.id===e);if(!t||t.status!==`draft`){alert(`Only draft challans can be edited.`);return}let n=document.getElementById(`sales-deliveries-form`);n&&n.reset(),document.getElementById(`input-challan-edit-id`).value=t.id,document.getElementById(`input-challan-no`).value=t.id,document.getElementById(`input-date`).value=t.date||d(),N(`Edit Draft — ${t.id}`,`Update quantities and transport details.`),j(t.orderId,t.orderId),M(t.warehouse),document.getElementById(`input-customer-name`).value=t.customerName||``,document.getElementById(`input-customer-id`).value=t.customerId||``,document.getElementById(`input-method`).value=t.deliveryMethod||`Own Vehicle`,document.getElementById(`input-vehicle`).value=t.vehicleNumber||``,document.getElementById(`input-driver`).value=t.driverName||``,document.getElementById(`input-driver-mobile`).value=t.driverMobile||``,document.getElementById(`input-tracking`).value=t.trackingNumber||``,document.getElementById(`input-location`).value=t.deliveryLocation||``,document.getElementById(`input-contact-person`).value=t.contactPerson||``,document.getElementById(`input-contact-phone`).value=t.contactNumber||``,document.getElementById(`input-notes`).value=t.notes||``;let r=document.getElementById(`sales-deliveries-advanced-section`),a=document.getElementById(`sales-deliveries-advanced-icon`),o=t.vehicleNumber||t.driverName||t.deliveryLocation;r&&r.classList.toggle(`hidden`,!o),a&&(a.style.transform=o?`rotate(180deg)`:`rotate(0deg)`),P(t.orderId,t.items),window.showFormView(),i()},window.handleOrderSelectionChange=function(){let e=document.getElementById(`input-order-ref`).value,t=document.getElementById(`input-customer-name`),n=document.getElementById(`input-customer-id`),r=document.getElementById(`delivery-form-items-body`);if(!e){t.value=``,n.value=``,r.innerHTML=`<tr><td colspan="6" class="p-4 text-center text-slate-400 font-medium">Select a Sales Order to load items.</td></tr>`;return}let i=v().find(t=>t.id===e);if(!i)return;t.value=i.customerName,n.value=i.customerId||``;let a=b().find(e=>String(e.id)===String(i.customerId));a&&(document.getElementById(`input-location`).value=a.address||a.company||``,document.getElementById(`input-contact-person`).value=a.name||``,document.getElementById(`input-contact-phone`).value=a.phone||``),P(e)},window.refreshItemStockLabels=function(){let e=document.getElementById(`input-warehouse`)?.value||``;document.querySelectorAll(`.items-row`).forEach(t=>{let n=t.getAttribute(`data-product-id`),r=Number(t.getAttribute(`data-remaining-limit`)||0),i=E(n,e),a=t.querySelector(`.stock-qty-label`);a&&(a.textContent=String(i),a.className=`p-3 text-center font-bold stock-qty-label ${D(i,r)}`)})},window.fillAllRemainingQty=function(){document.querySelectorAll(`.items-row`).forEach(e=>{let t=Number(e.getAttribute(`data-remaining-limit`)||0),n=e.querySelector(`.delivery-qty-input`);n&&(n.value=t,window.handleDeliveryQtyChange(n))})},window.handleDeliveryQtyChange=function(e){let t=e.closest(`tr`);if(!t)return;let n=Number(t.getAttribute(`data-remaining-limit`)||0),r=parseInt(e.value||0,10);(Number.isNaN(r)||r<0)&&(r=0),r>n&&(r=n,e.value=n);let i=t.querySelector(`.remaining-qty-label`);i&&(i.textContent=String(n-r))},window.saveDelivery=function(e){let t=document.getElementById(`input-order-ref`).value,n=document.getElementById(`input-customer-id`).value,r=document.getElementById(`input-customer-name`).value,i=document.getElementById(`input-date`).value,o=document.getElementById(`input-warehouse`).value,s=document.getElementById(`input-challan-edit-id`).value,c=document.getElementById(`input-challan-no`).value||S();if(!t||!i||!o){alert(`Please fill Sales Order, Delivery Date, and Warehouse.`);return}let l=document.querySelectorAll(`.items-row`),u=[],d=0;if(l.forEach(e=>{let t=e.getAttribute(`data-product-id`),n=e.getAttribute(`data-product-name`),r=parseFloat(e.getAttribute(`data-price`)||0),i=Number(e.getAttribute(`data-order-qty`)||0),a=Number(e.getAttribute(`data-previous-qty`)||0),o=Number(e.getAttribute(`data-remaining-limit`)||0),s=parseInt(e.querySelector(`.delivery-qty-input`)?.value||0,10),c=Math.max(0,o-s);s>0&&(u.push({productId:t,name:n,orderedQty:i,previousQty:a,deliveryQty:s,remainingQty:c,price:r}),d+=s*r)}),u.length===0){alert(`Please enter a Delivery Qty greater than 0 for at least one item.`);return}let f=_(),p={id:s||c,orderId:t,customerId:n?parseInt(n,10):``,customerName:r,date:i,warehouse:o,value:d,deliveryMethod:document.getElementById(`input-method`).value,trackingNumber:document.getElementById(`input-tracking`).value||``,vehicleNumber:document.getElementById(`input-vehicle`).value||``,driverName:document.getElementById(`input-driver`).value||``,driverMobile:document.getElementById(`input-driver-mobile`).value||``,deliveryLocation:document.getElementById(`input-location`).value||``,contactPerson:document.getElementById(`input-contact-person`).value||``,contactNumber:document.getElementById(`input-contact-phone`).value||``,notes:document.getElementById(`input-notes`).value||``,status:`draft`,items:u};if(s){let e=f.findIndex(e=>e.id===s);if(e===-1||f[e].status!==`draft`){alert(`This draft challan can no longer be edited.`);return}f[e]={...f[e],...p,id:s,status:`draft`}}else{let e=c;f.some(t=>t.id===e)&&(e=S(),document.getElementById(`input-challan-no`).value=e),p.id=e,f.push(p)}let m=p.id;a(),e===`generate`?(window.showDetailView(m),setTimeout(()=>window.printDeliveryNote(m),150)):window.showMainView()},window.markStatus=function(e,t){let n=_().find(t=>t.id===e);if(n&&n.status===`draft`&&[`delivered`,`cancelled`].includes(t)){if(t===`delivered`){let e=[];if((n.items||[]).forEach(t=>{let r=f(t),i=E(t.productId,n.warehouse);r>i&&e.push(`${t.name}: need ${r}, available ${i}`)}),e.length>0){alert(`Insufficient stock to mark delivered:\n\n${e.join(`
`)}`);return}(n.items||[]).forEach(e=>{A(e.productId,n.warehouse,f(e))}),n.status=`delivered`,k(n.orderId)}else t===`cancelled`&&(n.status=`cancelled`);a(),L(e)}};var F=null;window.printCurrentDeliveryChallan=function(){F&&window.printDeliveryNote(F)},window.printDeliveryNote=function(e){let t=_().find(t=>t.id===e);if(!t)return;let n=document.getElementById(`print-delivery-note-container`);if(!n)return;let r=x(),i=Array.isArray(t.items)?t.items:[],a=i.reduce((e,t)=>e+f(t),0),o=i.length?w(i[0].productId).uom:`PCS`,c=i.map((e,t)=>{let n=w(e.productId),r=f(e);return`
      <tr>
        <td style="border:1px solid #0f172a;padding:8px;text-align:center;">${String(t+1).padStart(2,`0`)}</td>
        <td style="border:1px solid #0f172a;padding:8px;">${s(e.name)}</td>
        <td style="border:1px solid #0f172a;padding:8px;text-align:right;">${r}</td>
        <td style="border:1px solid #0f172a;padding:8px;text-align:center;">${s(n.uom)}</td>
      </tr>
    `}).join(``);n.innerHTML=`
    <div style="font-family:Inter,Arial,sans-serif;color:#0f172a;font-size:13px;line-height:1.5;max-width:720px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:20px;">
        <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.06em;">${s(r.name)}</h1>
        ${r.address?`<p style="margin:4px 0 0;font-size:11px;color:#475569;">${s(r.address)}</p>`:``}
        <h2 style="margin:8px 0 0;font-size:16px;font-weight:800;letter-spacing:0.08em;">DELIVERY CHALLAN</h2>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:16px;">
        <div><strong>Challan No:</strong> ${s(t.id)}</div>
        <div><strong>Date:</strong> ${s(u(t.date))}</div>
        <div><strong>Sales Order:</strong> ${s(t.orderId)}</div>
      </div>

      <div style="margin-bottom:16px;">
        <div><strong>Customer:</strong> ${s(t.customerName)}</div>
        <div><strong>Address:</strong> ${s(t.deliveryLocation||`—`)}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="border:1px solid #0f172a;padding:8px;width:48px;">SL</th>
            <th style="border:1px solid #0f172a;padding:8px;text-align:left;">Product</th>
            <th style="border:1px solid #0f172a;padding:8px;text-align:right;">Quantity</th>
            <th style="border:1px solid #0f172a;padding:8px;width:72px;">Unit</th>
          </tr>
        </thead>
        <tbody>
          ${c||`<tr><td colspan="4" style="border:1px solid #0f172a;padding:12px;text-align:center;">No items</td></tr>`}
        </tbody>
      </table>

      <p style="font-weight:800;margin:0 0 16px;"><strong>Total Quantity:</strong> ${a} ${s(o)}</p>

      <div style="margin-bottom:28px;">
        <div><strong>Vehicle No:</strong> ${s(t.vehicleNumber||`—`)}</div>
        <div><strong>Driver:</strong> ${s(t.driverName||`—`)}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:40px;">
        <div style="text-align:center;">
          <div style="border-top:1px solid #0f172a;padding-top:8px;font-weight:700;">Prepared By</div>
        </div>
        <div style="text-align:center;">
          <div style="border-top:1px solid #0f172a;padding-top:8px;font-weight:700;">Delivered By</div>
        </div>
        <div style="text-align:center;">
          <div style="border-top:1px solid #0f172a;padding-top:8px;font-weight:700;">Received By</div>
        </div>
      </div>
    </div>
  `,n.classList.remove(`hidden`),window.print(),n.classList.add(`hidden`)};function I(e){return e===`delivered`?`bg-emerald-50 text-emerald-600`:e===`cancelled`?`bg-rose-50 text-rose-600`:`bg-amber-50 text-amber-700`}function L(e){let t=_().find(t=>t.id===e);if(!t)return;F=t.id;let n=document.getElementById(`detail-print-challan-btn`);n&&n.classList.toggle(`hidden`,t.status===`cancelled`),document.getElementById(`detail-id`).textContent=t.id,document.getElementById(`detail-date-label`).textContent=`Created on ${u(t.date)}`,document.getElementById(`detail-order-ref`).textContent=t.orderId,document.getElementById(`detail-customer-name`).textContent=t.customerName,document.getElementById(`detail-warehouse`).textContent=t.warehouse,document.getElementById(`detail-value`).textContent=l(t.value),document.getElementById(`detail-location`).textContent=t.deliveryLocation||`—`,document.getElementById(`detail-contact-person`).textContent=t.contactPerson||`—`,document.getElementById(`detail-contact-phone`).textContent=t.contactNumber||`—`,document.getElementById(`detail-notes`).textContent=t.notes||`No instructions specified.`,document.getElementById(`detail-method`).textContent=t.deliveryMethod||`—`,document.getElementById(`detail-vehicle`).textContent=t.vehicleNumber||`—`,document.getElementById(`detail-driver`).textContent=t.driverName||`—`,document.getElementById(`detail-driver-mobile`).textContent=t.driverMobile||`—`,document.getElementById(`detail-tracking`).textContent=t.trackingNumber||`—`;let r=document.getElementById(`detail-status`);r.textContent=t.status.toUpperCase(),r.className=`px-2.5 py-1 rounded-full text-[10px] font-bold mt-1 inline-block ${I(t.status)}`;let a=O(t.orderId);document.getElementById(`detail-so-totals`).innerHTML=`
    <span><span class="text-slate-400">Order Qty:</span> <strong class="text-slate-900">${a.orderQty.toLocaleString()}</strong></span>
    <span><span class="text-slate-400">Delivered:</span> <strong class="text-emerald-600">${a.deliveredQty.toLocaleString()}</strong></span>
    <span><span class="text-slate-400">Remaining:</span> <strong class="text-amber-600">${a.remainingQty.toLocaleString()}</strong></span>
  `;let o=document.getElementById(`detail-so-progress-body`);o.innerHTML=a.lines.map(e=>`
    <tr>
      <td class="p-2 font-bold text-slate-900">${s(e.name)}</td>
      <td class="p-2 text-center">${e.orderQty}</td>
      <td class="p-2 text-center text-emerald-600 font-bold">${e.deliveredQty}</td>
      <td class="p-2 text-center text-amber-600 font-bold">${e.remainingQty}</td>
    </tr>
  `).join(``)||`<tr><td colspan="4" class="p-3 text-center text-slate-400">No order items</td></tr>`;let d=document.getElementById(`detail-items-body`);d.innerHTML=``,(t.items||[]).forEach(e=>{let t=f(e);d.innerHTML+=`
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="p-3"><p class="font-bold text-slate-900">${s(e.name)}</p></td>
        <td class="p-3 text-center font-bold text-slate-500">${e.orderedQty}</td>
        <td class="p-3 text-center font-extrabold text-blue-600">${t}</td>
        <td class="p-3 text-center font-bold text-slate-400">${e.remainingQty??Math.max(0,Number(e.orderedQty||0)-t)}</td>
      </tr>
    `});let p=document.getElementById(`detail-actions-container`);p.innerHTML=``,t.status===`draft`?p.innerHTML+=`
      <button onclick="window.editDraftChallan('${t.id}')" class="w-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
        ${c(`edit.png`,`Edit Challan`,`w-4 h-4`)} Edit Challan
      </button>
      <button onclick="window.markStatus('${t.id}', 'delivered')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer">
        Mark Delivered
      </button>
      <button onclick="window.printDeliveryNote('${t.id}')" class="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
        ${c(`print.png`,`Print Challan`,`w-4 h-4`)} Print Challan
      </button>
      <button onclick="window.markStatus('${t.id}', 'cancelled')" class="w-full border border-slate-200 text-slate-400 hover:text-slate-600 text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer">
        Cancel
      </button>
    `:t.status===`delivered`?p.innerHTML+=`
      <button onclick="window.printDeliveryNote('${t.id}')" class="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
        ${c(`print.png`,`Print Challan`,`w-4 h-4`)} Print Challan
      </button>
    `:p.innerHTML+=`
      <p class="text-xs text-slate-400 font-medium text-center py-2">This challan is cancelled.</p>
    `,i()}function R(){let e=new Date,t=e.getDay(),n=t===0?6:t-1;return e.setDate(e.getDate()-n),e.toISOString().slice(0,10)}window.renderTable=function(){let e=document.getElementById(`sales-deliveries-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`sales-deliveries-search-input`)?.value.toLowerCase()||``,n=document.getElementById(`filter-status`)?.value||`all`,r=document.getElementById(`filter-warehouse`)?.value||`all`,a=document.getElementById(`filter-method`)?.value||`all`,o=document.getElementById(`filter-customer`)?.value||`all`,l=document.getElementById(`filter-date-start`)?.value||``,u=document.getElementById(`filter-date-end`)?.value||``,p=d(),h=R(),g=_().filter(e=>{let i=!t||e.id.toLowerCase().includes(t)||e.orderId.toLowerCase().includes(t)||e.customerName.toLowerCase().includes(t)||e.vehicleNumber&&e.vehicleNumber.toLowerCase().includes(t)||e.trackingNumber&&e.trackingNumber.toLowerCase().includes(t),s=n===`all`||e.status===n,c=r===`all`||e.warehouse===r,d=a===`all`||e.deliveryMethod===a,f=o===`all`||String(e.customerId)===o,g=!0;l&&(g&&=e.date>=l),u&&(g&&=e.date<=u);let _=!0;return m===`today`?_=e.date===p:m===`week`?_=e.date>=h&&e.date<=p:m===`draft`&&(_=e.status===`draft`),i&&s&&c&&d&&f&&g&&_});if(g.length===0){let t=_().length>0;e.innerHTML=`
      <tr>
        <td colspan="8" class="px-6 py-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <i data-lucide="package" class="w-6 h-6 text-slate-400"></i>
            </div>
            <p class="text-sm font-bold text-slate-700">${t?`No challans match your filters.`:`No delivery challans yet.`}</p>
            <p class="text-xs text-slate-400 font-medium">${t?`Try clearing filters or search.`:`Create your first challan from a sales order.`}</p>
            ${t?``:`
            <button type="button" onclick="window.openDeliveriesModal()" class="mt-1 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 cursor-pointer">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Create First Challan
            </button>`}
          </div>
        </td>
      </tr>
    `,i();return}g.forEach(t=>{let n=(t.items||[]).reduce((e,t)=>e+f(t),0),r=(t.items||[]).length?w(t.items[0].productId).uom:`PCS`;e.innerHTML+=`
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${s(t.id)}</div>
          <div class="text-[10px] text-slate-400 font-semibold mt-0.5">${n.toLocaleString()} ${s(r)}</div>
        </td>
        <td class="px-6 py-4 text-[11px] font-semibold text-slate-600">${s(t.date)}</td>
        <td class="px-6 py-4">
          <span class="text-xs font-bold text-blue-600">${s(t.orderId)}</span>
        </td>
        <td class="px-6 py-4 font-bold text-slate-700">${s(t.customerName)}</td>
        <td class="px-6 py-4 font-bold text-slate-700">${s(t.vehicleNumber||`N/A`)}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-700">${s(t.driverName||`N/A`)}</div>
          <div class="text-[10px] text-slate-400">${s(t.driverMobile||``)}</div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${I(t.status)}">${s(t.status)}</span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="inline-flex items-center justify-center gap-1 rounded-xl border border-sky-100 bg-sky-50 p-1">
            <button onclick="window.showDetailView('${t.id}')" title="View" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${c(`view.png`,`View`,`w-5 h-5`)}
            </button>
            ${t.status===`draft`?`
            <button onclick="window.editDraftChallan('${t.id}')" title="Edit Draft" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${c(`edit.png`,`Edit Draft`,`w-5 h-5`)}
            </button>`:``}
            ${t.status===`cancelled`?``:`
            <button onclick="window.printDeliveryNote('${t.id}')" title="Print Challan" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${c(`print.png`,`Print Challan`,`w-5 h-5`)}
            </button>`}
          </div>
        </td>
      </tr>
    `}),i()};function z(){let e=_(),t=document.getElementById(`sales-deliveries-metrics`);t&&(t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Challans</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${e.length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-amber-200 premium-shadow bg-amber-50/20">
      <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Draft</span>
      <span class="text-xl font-extrabold text-amber-700 block mt-2">${e.filter(e=>e.status===`draft`).length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Delivered</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${e.filter(e=>e.status===`delivered`).length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-rose-200 premium-shadow bg-rose-50/20">
      <span class="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Cancelled</span>
      <span class="text-xl font-extrabold text-rose-700 block mt-2">${e.filter(e=>e.status===`cancelled`).length}</span>
    </div>
  `)}function B(){let e=document.getElementById(`filter-customer`);e&&e.options.length<=1&&b().forEach(t=>{e.innerHTML+=`<option value="${t.id}">${s(t.company||t.name)}</option>`});let t=document.getElementById(`filter-warehouse`);t&&t.options.length<=1&&y().forEach(e=>{t.innerHTML+=`<option value="${e.name}">${s(e.name)}</option>`})}function V(){z(),window.renderTable(),i()}function H(){let e=new URLSearchParams(window.location.search).get(`so`);e&&(window.openDeliveriesModal(e),window.history.replaceState({},``,window.location.pathname))}document.addEventListener(`DOMContentLoaded`,async()=>{await o,B(),V(),H()});