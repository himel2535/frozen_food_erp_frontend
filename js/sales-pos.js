// ----------------------------------------------------
// Point of Sale (POS) Module — Toys Factory ERP MPA
// ----------------------------------------------------
import { appReadyPromise, initIcons } from '/js/shared.js';

const products = [
  { id: 'PRD-001', name: 'Premium Office Chair', price: 145.00, stock: 45, img: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=200' },
  { id: 'PRD-002', name: 'Ergonomic Desk', price: 299.99, stock: 12, img: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=200' },
  { id: 'PRD-003', name: 'Mechanical Keyboard', price: 85.50, stock: 104, img: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=200' },
  { id: 'PRD-004', name: 'Wireless Mouse', price: 45.00, stock: 210, img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=200' },
  { id: 'PRD-005', name: 'Monitor Arm Mount', price: 65.00, stock: 34, img: 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&q=80&w=200' },
  { id: 'PRD-006', name: 'USB-C Docking Station', price: 120.00, stock: 56, img: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=200' }
];

let cart = [];

window.renderPOSGrid = function() {
  const grid = document.getElementById('pos-product-grid');
  if (!grid) return;
  grid.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all flex flex-col group';
    card.onclick = () => window.addToCart(p.id);

    card.innerHTML = `
      <div class="h-32 w-full bg-slate-100 overflow-hidden relative">
        <img src="${p.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        <div class="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded-lg text-slate-700 shadow-sm">
          ${p.stock} in stock
        </div>
      </div>
      <div class="p-3 flex-1 flex flex-col justify-between">
        <h3 class="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">${p.name}</h3>
        <p class="text-sm font-extrabold text-blue-600 mt-2">$${p.price.toFixed(2)}</p>
      </div>
    `;
    grid.appendChild(card);
  });
};

window.addToCart = function(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  
  window.renderCart();
};

window.updateQty = function(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  
  window.renderCart();
};

window.renderCart = function() {
  const cartContainer = document.getElementById('pos-cart-items');
  const emptyState = document.getElementById('pos-empty-cart');
  
  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = '';
    cartContainer.appendChild(emptyState);
    emptyState.classList.remove('hidden');
    window.updateTotals();
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  cartContainer.innerHTML = '';

  cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'bg-white border border-slate-100 rounded-xl p-2.5 flex items-center justify-between shadow-sm';
    
    el.innerHTML = `
      <div class="flex-1 pr-2 overflow-hidden">
        <h4 class="text-xs font-bold text-slate-800 truncate">${item.name}</h4>
        <p class="text-[11px] font-bold text-blue-600 mt-0.5">$${(item.price * item.qty).toFixed(2)}</p>
      </div>
      <div class="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
        <button onclick="window.updateQty('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer text-xs font-bold">-</button>
        <span class="w-4 text-center text-xs font-extrabold text-slate-800">${item.qty}</span>
        <button onclick="window.updateQty('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer text-xs font-bold">+</button>
      </div>
    `;
    cartContainer.appendChild(el);
  });

  window.updateTotals();
};

window.updateTotals = function() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  document.getElementById('pos-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('pos-tax').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('pos-total').textContent = `$${total.toFixed(2)}`;
};

window.clearCart = function() {
  cart = [];
  window.renderCart();
};

window.checkout = function() {
  if (cart.length === 0) return alert('Cart is empty!');
  alert('Payment processed successfully! Printing receipt...');
  window.clearCart();
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  window.renderPOSGrid();
  initIcons();
});
