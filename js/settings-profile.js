// ----------------------------------------------------
// Profile Settings Module — Toys Factory ERP MPA
// ----------------------------------------------------

window.showMainView = function() {
  const mainView = document.getElementById('settings-profile-main-view');
  const formView = document.getElementById('settings-profile-form-view');
  if (mainView && formView) {
    mainView.classList.remove('hidden');
    formView.classList.add('hidden');
  }
};

window.showProfileForm = function() {
  const mainView = document.getElementById('settings-profile-main-view');
  const formView = document.getElementById('settings-profile-form-view');
  if (mainView && formView) {
    mainView.classList.add('hidden');
    formView.classList.remove('hidden');
  }
};

window.handleProfileSubmit = function(event) {
  event.preventDefault();
  
  // Mock saving functionality
  const name = document.getElementById('input-name').value;
  const email = document.getElementById('input-email').value;
  const phone = document.getElementById('input-phone').value;

  // Update display
  document.getElementById('display-name').textContent = name;
  document.getElementById('display-email').textContent = email;
  document.getElementById('display-phone').textContent = phone;

  // Return to main view
  window.showMainView();
};
