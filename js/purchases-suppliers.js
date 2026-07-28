import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let currentEditingId = null;

// Initial list of suppliers if not present in appState
function getList() {
  if (!appState.purchasesSuppliers) {
    appState.purchasesSuppliers = [
      {
        id: "SUP-001",
        name: "Apex Yarns Ltd",
        contact: "John Apex",
        email: "sales@apexyarns.com",
        phone: "+880 1711-556677",
        status: "Active",
        terms: "Net 30",
        lead: "7 Days",
        rating: 4.8,
        address: "Plot 42, Tejgaon I/A, Dhaka",
        notes: "Primary supplier of cotton and composite yarns."
      },
      {
        id: "SUP-002",
        name: "Global Dye Chemicals",
        contact: "Alice Green",
        email: "contact@globaldyes.com",
        phone: "+1 212-555-0199",
        status: "Active",
        terms: "Net 15",
        lead: "3 Days",
        rating: 4.5,
        address: "740 Broadway, New York, NY 10003",
        notes: "Eco-friendly dyes and organic raw pigments."
      },
      {
        id: "SUP-003",
        name: "Universal Silks Co",
        contact: "Wang Wei",
        email: "info@universalsilks.com",
        phone: "+86 21 6248 1122",
        status: "Inactive",
        terms: "Due on Receipt",
        lead: "15 Days",
        rating: 4.2,
        address: "888 Nanjing Road, Shanghai",
        notes: "Premium mulberry silk and high-end textiles."
      }
    ];
    saveAppState();
  }
  return appState.purchasesSuppliers;
}

// Navigation helpers
window.showMainView = function() {
  document.getElementById('purchases-suppliers-main-view').classList.remove('hidden');
  document.getElementById('purchases-suppliers-form-view').classList.add('hidden');
  currentEditingId = null;
};

window.showFormView = function() {
  document.getElementById('purchases-suppliers-main-view').classList.add('hidden');
  document.getElementById('purchases-suppliers-form-view').classList.remove('hidden');
};

// Open creation mode
window.openSupplierModal = function() {
  currentEditingId = null;
  const form = document.getElementById('purchases-suppliers-form');
  if (form) form.reset();

  document.getElementById('supplier-form-title').innerText = "Add Supplier";
  
  // Collapse advanced section by default
  const advancedSection = document.getElementById('supplier-advanced-section');
  if (advancedSection) advancedSection.classList.add('hidden');
  const advancedIcon = document.getElementById('supplier-advanced-icon');
  if (advancedIcon) advancedIcon.style.transform = 'rotate(0deg)';

  window.showFormView();
};

// Collapsible advanced fields toggle
window.toggleAdvancedFields = function() {
  const section = document.getElementById('supplier-advanced-section');
  const icon = document.getElementById('supplier-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

// Form Submission handling
window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();

  const name = document.getElementById('input-supp-name').value;
  const contact = document.getElementById('input-supp-contact').value;
  const phone = document.getElementById('input-supp-phone').value;
  const status = document.getElementById('input-supp-status').value;
  const terms = document.getElementById('input-supp-terms').value;
  const lead = document.getElementById('input-supp-lead').value || '7 Days';

  // Advanced fields
  const email = document.getElementById('input-supp-email').value;
  const ratingVal = document.getElementById('input-supp-rating').value;
  const rating = ratingVal ? parseFloat(ratingVal) : 5.0;
  const address = document.getElementById('input-supp-address').value;
  const notes = document.getElementById('input-supp-notes').value;

  if (currentEditingId) {
    const record = list.find(item => item.id === currentEditingId);
    if (record) {
      record.name = name;
      record.contact = contact;
      record.phone = phone;
      record.status = status;
      record.terms = terms;
      record.lead = lead;
      record.email = email;
      record.rating = rating;
      record.address = address;
      record.notes = notes;
    }
  } else {
    const nextIdNum = list.length > 0 ? Math.max(...list.map(item => Number(item.id.replace('SUP-', '')))) + 1 : 1;
    const newId = `SUP-${String(1000 + nextIdNum).slice(1)}`;
    const newRecord = {
      id: newId,
      name,
      contact,
      phone,
      status,
      terms,
      lead,
      email,
      rating,
      address,
      notes
    };
    list.push(newRecord);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

// Edit action
window.editRecord = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record) return;

  currentEditingId = id;
  document.getElementById('supplier-form-title').innerText = `Edit Supplier: ${id}`;

  document.getElementById('input-supp-name').value = record.name;
  document.getElementById('input-supp-contact').value = record.contact;
  document.getElementById('input-supp-phone').value = record.phone;
  document.getElementById('input-supp-status').value = record.status;
  document.getElementById('input-supp-terms').value = record.terms;
  document.getElementById('input-supp-lead').value = record.lead;

  // Advanced inputs
  document.getElementById('input-supp-email').value = record.email || '';
  document.getElementById('input-supp-rating').value = record.rating || '';
  document.getElementById('input-supp-address').value = record.address || '';
  document.getElementById('input-supp-notes').value = record.notes || '';

  window.showFormView();
};

// Delete action
window.deleteRecord = function(id) {
  const list = getList();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) return;

  if (confirm(`Are you sure you want to remove supplier ${id}?`)) {
    list.splice(index, 1);
    saveAppState();
    renderAll();
  }
};

// Render stats boxes
function renderMetrics() {
  const list = getList();
  const container = document.getElementById('purchases-suppliers-metrics');
  if (!container) return;

  const total = list.length;
  const active = list.filter(item => item.status === 'Active').length;
  
  // Calculate average lead time
  const leadTimes = list.map(item => parseInt(item.lead) || 0).filter(Boolean);
  const avgLead = leadTimes.length > 0 ? Math.round(leadTimes.reduce((s, c) => s + c, 0) / leadTimes.length) : 0;

  // Calculate average rating
  const ratings = list.map(item => parseFloat(item.rating) || 0).filter(Boolean);
  const avgRating = ratings.length > 0 ? (ratings.reduce((s, c) => s + c, 0) / ratings.length).toFixed(1) : '5.0';

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Suppliers</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total} listed</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Vendors</span>
      <span class="text-xl font-extrabold text-blue-600 block mt-2">${active} active</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Lead Time</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${avgLead} Days</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supplier Health</span>
      <span class="text-xl font-extrabold text-indigo-600 block mt-2">${avgRating} ★</span>
    </div>
  `;
}

// Render data table rows
window.renderTable = function() {
  const tbody = document.getElementById('purchases-suppliers-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = (document.getElementById('purchases-suppliers-search-input')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('filter-supplier-status')?.value || 'all';
  const ratingFilter = document.getElementById('filter-supplier-rating')?.value || 'all';
  const termsFilter = document.getElementById('filter-supplier-terms')?.value || 'all';

  const list = getList();

  const filtered = list.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (termsFilter !== 'all' && item.terms !== termsFilter) return false;
    
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      if ((item.rating || 0) < minRating) return false;
    }

    if (search) {
      const queryMatches = 
        item.id.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        (item.contact || '').toLowerCase().includes(search) ||
        (item.phone || '').toLowerCase().includes(search) ||
        (item.email || '').toLowerCase().includes(search);

      if (!queryMatches) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400 font-semibold">No suppliers found.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    const isInactive = item.status === 'Inactive';
    const badgeClass = isInactive 
      ? 'bg-rose-50 text-rose-700 border-rose-200' 
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-900">${escapeHtml(item.name)}</div>
          ${item.email ? `<div class="text-[10px] text-slate-400 font-medium">${escapeHtml(item.email)}</div>` : ''}
        </td>
        <td class="p-4 font-semibold text-slate-700">${escapeHtml(item.contact)}</td>
        <td class="p-4 font-medium text-slate-600">${escapeHtml(item.phone)}</td>
        <td class="p-4 text-center font-semibold text-slate-650">${escapeHtml(item.lead)}</td>
        <td class="p-4 font-semibold text-slate-500">${escapeHtml(item.terms)}</td>
        <td class="p-4 text-center font-bold text-indigo-600">${Number(item.rating || 5.0).toFixed(1)} ★</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}">
            ${item.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            <button onclick="window.editRecord('${item.id}')" title="Edit Supplier" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deleteRecord('${item.id}')" title="Delete" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
};

function renderAll() {
  renderMetrics();
  window.renderTable();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});
