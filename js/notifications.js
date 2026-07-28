import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function getInventory() {
  return Array.isArray(appState.inventory) ? appState.inventory : [];
}

// Generate dynamic notifications based on system state
function generateNotifications() {
  const notifs = [];
  
  // 1. Inventory Low Stock Alerts
  const inventory = getInventory();
  inventory.forEach(item => {
    // If stock is below 50, trigger low stock
    if ((item.stock || 0) < 50) {
      notifs.push({
        id: `NOTIF-INV-${item.id}`,
        type: 'Inventory',
        title: 'Low Stock Alert',
        message: `${item.name} (${item.sku}) is running low on stock. Current stock: ${item.stock}.`,
        time: 'Just now',
        read: false,
        actionUrl: '/inventory-products.html'
      });
    }
  });

  // 2. Dummy Payment Alerts (since we don't have full accounting linked in this simple demo, we mock a few)
  notifs.push({
    id: `NOTIF-PAY-1`,
    type: 'Payment',
    title: 'Payment Due',
    message: 'Supplier invoice #INV-992 from PolyPlastics Co. is due tomorrow ($14,500).',
    time: '2 hours ago',
    read: false,
    actionUrl: '/accounting-payables.html'
  });

  // 3. System Alerts
  notifs.push({
    id: `NOTIF-SYS-1`,
    type: 'System',
    title: 'Maintenance Reminder',
    message: 'Injection Molding Machine A1 requires monthly calibration.',
    time: '1 day ago',
    read: true,
    actionUrl: '/manufacturing-machine-maintenance.html'
  });

  return notifs;
}

// Manage read status in state
function getReadNotifications() {
  if (!appState.readNotifications) {
    appState.readNotifications = [];
    saveAppState();
  }
  return appState.readNotifications;
}

window.renderNotifications = function() {
  const list = document.getElementById('notifications-list');
  if (!list) return;

  const filterType = document.getElementById('notifications-filter-type')?.value || 'all';
  const readIds = getReadNotifications();
  let notifs = generateNotifications();

  // Apply read status
  notifs = notifs.map(n => ({
    ...n,
    read: n.read || readIds.includes(n.id)
  }));

  if (filterType !== 'all') {
    notifs = notifs.filter(n => n.type === filterType);
  }

  list.innerHTML = '';

  if (notifs.length === 0) {
    list.innerHTML = '<div class="p-8 text-center text-slate-400 font-semibold">No notifications found.</div>';
    return;
  }

  notifs.forEach(n => {
    let icon = 'info';
    let iconColor = 'text-blue-500';
    let bgColor = 'bg-blue-50';
    
    if (n.type === 'Inventory') {
      icon = 'alert-triangle';
      iconColor = 'text-rose-500';
      bgColor = 'bg-rose-50';
    } else if (n.type === 'Payment') {
      icon = 'dollar-sign';
      iconColor = 'text-amber-500';
      bgColor = 'bg-amber-50';
    } else if (n.type === 'System') {
      icon = 'settings';
      iconColor = 'text-slate-500';
      bgColor = 'bg-slate-100';
    }

    const unreadIndicator = n.read ? '' : '<div class="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0"></div>';
    const bgClass = n.read ? 'bg-white' : 'bg-slate-50/70';

    list.innerHTML += `
      <div class="p-5 flex items-start gap-4 transition-colors ${bgClass}">
        <div class="w-10 h-10 rounded-full ${bgColor} flex items-center justify-center shrink-0">
          <i data-lucide="${icon}" class="w-5 h-5 ${iconColor}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-sm font-bold text-slate-900 truncate ${n.read ? 'opacity-70' : ''}">${escapeHtml(n.title)}</h4>
            <span class="text-[10px] font-semibold text-slate-400 shrink-0">${n.time}</span>
          </div>
          <p class="text-xs text-slate-600 mt-1 ${n.read ? 'opacity-70' : ''}">${escapeHtml(n.message)}</p>
          <div class="mt-2">
            <a href="${n.actionUrl}" class="text-[11px] font-bold text-blue-600 hover:underline">View Details &rarr;</a>
          </div>
        </div>
        ${unreadIndicator}
      </div>
    `;
  });
  
  updateHeaderBell();
};

window.markAllAsRead = function() {
  const readIds = getReadNotifications();
  const notifs = generateNotifications();
  
  notifs.forEach(n => {
    if (!n.read && !readIds.includes(n.id)) {
      readIds.push(n.id);
    }
  });
  
  saveAppState();
  window.renderNotifications();
};

function updateHeaderBell() {
  const dot = document.getElementById('header-notification-dot');
  if (!dot) return;
  
  const readIds = getReadNotifications();
  const notifs = generateNotifications();
  const unreadCount = notifs.filter(n => !n.read && !readIds.includes(n.id)).length;
  
  if (unreadCount > 0) {
    dot.classList.remove('hidden');
  } else {
    dot.classList.add('hidden');
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  window.renderNotifications();
  initIcons();
});
