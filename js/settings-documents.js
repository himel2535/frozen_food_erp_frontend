import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

const DEFAULT_DOCS = [];

function getDocs() {
  if (!appState.documents) {
    appState.documents = [...DEFAULT_DOCS];
    saveAppState();
  }
  return appState.documents;
}

function getInventory() {
  return Array.isArray(appState.inventory) ? appState.inventory : [];
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getNextDocId() {
  const maxNumericId = getDocs().reduce((maxValue, item) => {
    const numericId = Number.parseInt(String(item.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);
  return `DOC-${String(maxNumericId + 1).padStart(3, '0')}`;
}

window.showMainView = function() {
  document.getElementById('docs-main-view').classList.remove('hidden');
  document.getElementById('docs-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('docs-main-view').classList.add('hidden');
  document.getElementById('docs-form-view').classList.remove('hidden');
};

window.openDocModal = function(docId = '') {
  const form = document.getElementById('docs-form');
  if (!form) return;

  form.reset();
  document.getElementById('docs-edit-id').value = '';
  document.getElementById('docs-form-title').textContent = 'Upload Document';
  document.getElementById('docs-file-name').classList.add('hidden');
  
  populateProducts();

  if (docId) {
    const doc = getDocs().find(d => d.id === docId);
    if (doc) {
      document.getElementById('docs-edit-id').value = doc.id;
      document.getElementById('docs-form-title').textContent = 'Edit Document';
      document.getElementById('docs-input-title').value = doc.title || '';
      document.getElementById('docs-input-category').value = doc.category || 'SOP';
      document.getElementById('docs-input-version').value = doc.version || 'v1.0';
      document.getElementById('docs-input-product').value = doc.productId || '';
      document.getElementById('docs-input-desc').value = doc.description || '';
      
      if (doc.filename) {
        document.getElementById('docs-file-name').textContent = `Current File: ${doc.filename}`;
        document.getElementById('docs-file-name').classList.remove('hidden');
      }
    }
  }

  window.showFormView();
  initIcons();
};

function populateProducts() {
  const select = document.getElementById('docs-input-product');
  const products = getInventory();
  
  select.innerHTML = '<option value="">None / General</option>' + products.map(p => {
    return `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.sku)})</option>`;
  }).join('');
}

// File input change listener for mock preview
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('docs-input-file');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const fileNameDisplay = document.getElementById('docs-file-name');
      if (e.target.files && e.target.files[0]) {
        fileNameDisplay.textContent = `Selected: ${e.target.files[0].name}`;
        fileNameDisplay.classList.remove('hidden');
      }
    });
  }
});

window.handleSubmit = function(event) {
  event.preventDefault();

  const docs = getDocs();
  const editId = document.getElementById('docs-edit-id').value;
  const fileInput = document.getElementById('docs-input-file');
  let filename = '';
  
  if (fileInput && fileInput.files && fileInput.files[0]) {
    filename = fileInput.files[0].name;
  } else if (editId) {
    const existing = docs.find(d => d.id === editId);
    if (existing) filename = existing.filename;
  } else {
    // Mock filename for demo
    filename = 'uploaded_document.pdf';
  }
  
  const payload = {
    id: editId || getNextDocId(),
    title: document.getElementById('docs-input-title').value.trim(),
    category: document.getElementById('docs-input-category').value,
    version: document.getElementById('docs-input-version').value.trim(),
    productId: document.getElementById('docs-input-product').value,
    description: document.getElementById('docs-input-desc').value.trim(),
    filename: filename,
    uploadDate: new Date().toISOString().split('T')[0]
  };

  const existingIndex = docs.findIndex(d => d.id === payload.id);
  if (existingIndex >= 0) {
    payload.uploadDate = docs[existingIndex].uploadDate; // Preserve original date
    docs[existingIndex] = payload;
  } else {
    docs.push(payload);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('docs-table-body');
  if (!tbody) return;

  const searchValue = String(document.getElementById('docs-search-input')?.value || '').toLowerCase();
  const filterCategory = document.getElementById('docs-filter-category')?.value || 'all';
  
  const docs = getDocs().filter(d => {
    const searchString = [d.title, d.description, d.filename].join(' ').toLowerCase();
    const searchMatch = !searchValue || searchString.includes(searchValue);
    const categoryMatch = filterCategory === 'all' || d.category === filterCategory;
    return searchMatch && categoryMatch;
  });

  tbody.innerHTML = '';

  if (docs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 font-semibold">No documents found.</td></tr>';
    return;
  }

  docs.forEach(d => {
    let productStr = 'General';
    if (d.productId) {
      const p = getInventory().find(i => String(i.id) === String(d.productId));
      if (p) productStr = p.name;
    }
    
    let catClass = 'bg-slate-100 text-slate-600';
    if (d.category === 'SOP') catClass = 'bg-blue-50 text-blue-600';
    if (d.category === 'Product Drawing') catClass = 'bg-purple-50 text-purple-600';
    if (d.category === 'Quality Standard') catClass = 'bg-emerald-50 text-emerald-600';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4">
          <div class="font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-2">
            <i data-lucide="file" class="w-3.5 h-3.5"></i> ${escapeHtml(d.title)}
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">${escapeHtml(d.filename)}</div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${catClass}">
            ${escapeHtml(d.category)}
          </span>
        </td>
        <td class="px-6 py-4">
          <div class="font-semibold text-slate-700 text-xs">${escapeHtml(productStr)}</div>
        </td>
        <td class="px-6 py-4 text-[11px] font-semibold text-slate-600">${escapeHtml(d.uploadDate)}</td>
        <td class="px-6 py-4 text-center">
          <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">${escapeHtml(d.version)}</span>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.openDocModal('${d.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const container = document.getElementById('docs-metrics');
  if (!container) return;

  const docs = getDocs();
  const sop = docs.filter(d => d.category === 'SOP').length;
  const drawings = docs.filter(d => d.category === 'Product Drawing').length;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Documents</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${docs.length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 premium-shadow bg-blue-50/20">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">SOPs</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${sop}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-purple-200 premium-shadow bg-purple-50/20">
      <span class="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Drawings / CAD</span>
      <span class="text-xl font-extrabold text-purple-700 block mt-2">${drawings}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-indigo-200 premium-shadow bg-indigo-50/20">
      <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Active Versions</span>
      <span class="text-xl font-extrabold text-indigo-700 block mt-2">${docs.length}</span>
    </div>
  `;
}

function renderAll() {
  renderMetrics();
  window.renderTable();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});
