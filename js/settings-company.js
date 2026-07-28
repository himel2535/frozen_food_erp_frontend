import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function getSettings() {
  if (!appState.companyConfig) {
    appState.companyConfig = {
      name: "Demo Company Inc.",
      tagline: "Enterprise Solutions for Modern Business",
      email: "admin@democompany.com",
      phone: "+1 (555) 123-4567",
      address: "123 Business Ave, Suite 400, San Francisco, CA 94102",
      currency: "USD ($)",
      timezone: "Pacific (UTC-8)",
      dateFormat: "MM/DD/YYYY",
      language: "English (US)",
      fiscalStart: "July",
      numberFormat: "1,234.56 (US/UK)",
      taxid: "12-3456789",
      industry: "SaaS / Technology",
      size: "11–50 employees"
    };
    saveAppState();
  }
  return appState.companyConfig;
}

window.showMainView = function() {
  document.getElementById('settings-company-main-view').classList.remove('hidden');
  document.getElementById('settings-company-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('settings-company-main-view').classList.add('hidden');
  document.getElementById('settings-company-form-view').classList.remove('hidden');
};

window.openCompanyForm = function() {
  const config = getSettings();

  // Reset/Collapse advanced sections
  const advancedSec = document.getElementById('settings-company-advanced-section');
  const advancedIcon = document.getElementById('settings-company-advanced-icon');
  if (advancedSec) advancedSec.classList.add('hidden');
  if (advancedIcon) {
    advancedIcon.style.transform = 'rotate(0deg)';
    advancedIcon.setAttribute('data-lucide', 'chevron-down');
  }

  // Populate form fields
  document.getElementById('input-name').value = config.name || '';
  document.getElementById('input-tagline').value = config.tagline || '';
  document.getElementById('input-email').value = config.email || '';
  document.getElementById('input-phone').value = config.phone || '';
  document.getElementById('input-address').value = config.address || '';
  document.getElementById('input-currency').value = config.currency || 'USD ($)';
  document.getElementById('input-timezone').value = config.timezone || 'Pacific (UTC-8)';
  document.getElementById('input-date-format').value = config.dateFormat || 'MM/DD/YYYY';
  document.getElementById('input-language').value = config.language || 'English (US)';
  document.getElementById('input-fiscal-start').value = config.fiscalStart || 'July';
  document.getElementById('input-number-format').value = config.numberFormat || '1,234.56 (US/UK)';
  document.getElementById('input-taxid').value = config.taxid || '';
  document.getElementById('input-industry').value = config.industry || 'SaaS / Technology';
  document.getElementById('input-size').value = config.size || '11–50 employees';

  window.showFormView();
  initIcons();
};

window.toggleAdvancedFields = function() {
  const sec = document.getElementById('settings-company-advanced-section');
  const icon = document.getElementById('settings-company-advanced-icon');
  if (!sec) return;

  const isHidden = sec.classList.contains('hidden');
  if (isHidden) {
    sec.classList.remove('hidden');
    if (icon) icon.style.transform = 'rotate(180deg)';
  } else {
    sec.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
};

window.handleCompanySubmit = function(event) {
  event.preventDefault();
  const config = getSettings();

  config.name = document.getElementById('input-name').value;
  config.tagline = document.getElementById('input-tagline').value;
  config.email = document.getElementById('input-email').value;
  config.phone = document.getElementById('input-phone').value;
  config.address = document.getElementById('input-address').value;
  config.currency = document.getElementById('input-currency').value;
  config.timezone = document.getElementById('input-timezone').value;
  config.dateFormat = document.getElementById('input-date-format').value;
  config.language = document.getElementById('input-language').value;
  config.fiscalStart = document.getElementById('input-fiscal-start').value;
  config.numberFormat = document.getElementById('input-number-format').value;
  config.taxid = document.getElementById('input-taxid').value;
  config.industry = document.getElementById('input-industry').value;
  config.size = document.getElementById('input-size').value;

  // Sync to general companyName state if needed (e.g. sidebar and header tags)
  appState.companyName = config.name;
  appState.companyEmail = config.email;
  appState.currencySymbol = config.currency.includes('$') ? '$' : config.currency.includes('€') ? '€' : config.currency.includes('£') ? '£' : config.currency.includes('৳') ? '৳' : config.currency.includes('₹') ? '₹' : '$';

  saveAppState();
  window.showMainView();
  renderAll();
};

function renderProfileDetails() {
  const config = getSettings();

  document.getElementById('display-name').textContent = config.name || '—';
  document.getElementById('display-tagline').textContent = config.tagline || '—';
  document.getElementById('display-email').textContent = config.email || '—';
  document.getElementById('display-phone').textContent = config.phone || '—';
  document.getElementById('display-taxid').textContent = config.taxid || '—';
  document.getElementById('display-industry').textContent = config.industry || '—';
  document.getElementById('display-size').textContent = config.size || '—';
  document.getElementById('display-address').textContent = config.address || '—';

  document.getElementById('display-currency').textContent = config.currency || '—';
  document.getElementById('display-timezone').textContent = config.timezone || '—';
  document.getElementById('display-date-format').textContent = config.dateFormat || '—';
  document.getElementById('display-language').textContent = config.language || '—';
  document.getElementById('display-fiscal-start').textContent = config.fiscalStart || '—';
  document.getElementById('display-number-format').textContent = config.numberFormat || '—';

  // Dynamic logo first character
  const logoEl = document.getElementById('display-logo');
  if (logoEl && config.name) {
    logoEl.textContent = config.name.charAt(0).toUpperCase();
  }
}

function renderAll() {
  renderProfileDetails();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});
